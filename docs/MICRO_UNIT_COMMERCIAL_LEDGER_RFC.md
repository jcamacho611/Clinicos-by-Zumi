# RFC: Micro-Unit Customer Funding for Klinikos Variable COGS

Status: `DESIGN + PURE ARITHMETIC ONLY — NO DATABASE MIGRATION YET`
Date: 2026-08-20 America/New_York

## Problem

Klinikos already has a strong whole-cent commercial ledger:

- included plan allowances;
- prepaid customer balance;
- bounded customer-authorized overage;
- pre-execution reservations;
- release on failed execution;
- settlement from actual cost;
- account blocking when actual usage overruns funding.

That model is correct for vendor events whose economically meaningful unit is one cent
or more. It is not precise enough for rails such as AI and high-volume email, where one
real operation can cost a fraction of a cent.

Rounding every operation upward to one cent is not a conservative accounting fix. It
changes the economics. A `$0.0009` email would become `$0.01`, more than 11 times the
marginal provider amount. Cheap AI turns have the same problem.

Rounding downward is worse: Klinikos silently fronts cost and margin reports become
optimistic.

The required property is therefore:

> reserve real customer-backed whole cents before vendor execution, but consume those
> cents internally in micro-USD so many cheap operations share the same backing.

One U.S. cent equals exactly `10,000` micro-USD.

## Goals

1. No production variable vendor call executes without enough authorized economic backing.
2. Provider cost remains exact at the finest supported internal unit.
3. Customer usage is not rounded up independently on every sub-cent operation.
4. In-flight calls cannot consume backing reserved for another call.
5. Provider rejection releases its micro reservation.
6. Actual cost above the reservation may consume spare backed capacity, but never another
   call's protected reservation.
7. Any amount above all backed capacity is an explicit unfunded overrun and blocks more
   variable-cost execution until reviewed/funded.
8. Full cents settle in aggregate. Fractional completed cost carries forward while still
   backed by at least one reserved cent.
9. Provider cost, customer charge, included-plan consumption and accounting allocation
   remain separate concepts.
10. Existing whole-cent consumers do not need to migrate to the micro path merely because
    the new path exists.

## Non-goals

- This RFC does not alter public plan prices.
- It does not turn a provider estimate into invoice truth.
- It does not weaken payment, PHI, consent, licensing, clinical or tenant policy.
- It does not claim a provider is production connected.
- It does not implement a Prisma migration in this branch.
- It does not decide tax/accounting treatment; financial reporting still requires the
  appropriate accounting policy.

## Core arithmetic

`src/lib/commercial/micro-funding-math.ts` defines the pure state:

```text
backingCents
reservedMicroUsd
consumedMicroUsd
```

Invariant:

```text
reservedMicroUsd + consumedMicroUsd <= backingCents * 10,000
```

Before a new provider operation with estimate `E`:

```text
requiredBackingCents = ceil((reserved + consumed + E) / 10,000)
additionalBackingCents = max(0, requiredBackingCents - backingCents)
```

Only the additional whole cents need to be reserved from customer-backed sources.

### Completion

For an operation with its own reserved estimate:

1. protect all other in-flight micro reservations;
2. determine remaining backed capacity available to this operation;
3. fund actual micro-cost up to that amount;
4. release the operation's unused estimate automatically inside the pool;
5. record any remainder as `unfundedOverrunMicroUsd`.

### Aggregate settlement

Completed micro-cost is converted to cents only in aggregate:

```text
settleCents = floor(consumedMicroUsd / 10,000)
carryMicroUsd = consumedMicroUsd % 10,000
```

After settling those full cents, enough whole-cent backing remains to cover:

```text
reservedMicroUsd + carryMicroUsd
```

Any additional backing is releasable.

Example:

```text
pre-funded maximum turn: 250,000 micro-USD = 25¢
actual AI cost:             23,456 micro-USD = 2.3456¢
settle now:                  2¢
carry:                       3,456 micro-USD
backing required for carry:  1¢
unused backing released:    22¢
```

The customer is not charged 3¢ merely because one turn happened, and Klinikos is not
fronting the 0.3456¢ remainder because one backed cent remains reserved behind it.

## Proposed persistence model

Do **not** apply this schema without fresh + populated PostgreSQL migration tests, current
main type/lint/test/build gates, and concurrency journeys.

A production implementation should use two new server-owned concepts.

### 1. `commercial_micro_usage_pools`

One aggregate funding pool per organization / commercial period / cost bucket.

Suggested fields:

```text
id
organizationId
billingPeriodKey
bucket
currency                         default USD
includedBackedCents
prepaidBackedCents
overageBackedCents
reservedMicroUsd
consumedMicroUsd
blockedAt
blockReason
createdAt
updatedAt
```

Required constraints:

```text
all numeric values >= 0
includedBackedCents + prepaidBackedCents + overageBackedCents = backingCents
reservedMicroUsd + consumedMicroUsd <= backingCents * 10,000
unique(organizationId, billingPeriodKey, bucket)
```

`backingCents` may be computed rather than stored.

### 2. `commercial_micro_usage_reservations`

One idempotent record per external operation.

Suggested fields:

```text
id
poolId
organizationId
capability
idempotencyKey
provider
service
estimatedMicroUsd
actualMicroUsd nullable
fundedActualMicroUsd nullable
unfundedOverrunMicroUsd default 0
providerReference nullable
status: reserved | accepted_pending_cost | released | completed | completed_with_overrun
metadata bounded JSON
createdAt
acceptedAt
completedAt
releasedAt
```

Required uniqueness:

```text
unique(organizationId, idempotencyKey)
```

The idempotency key is a server/caller-owned operation ID. It must not be derived from
message text, patient content or other PHI.

## Backing-source acquisition

The repository transaction that creates/expands a micro pool must lock the same funding
state already used by the whole-cent commercial ledger:

1. organization;
2. paid subscription;
3. current allowance row;
4. funding account;
5. micro pool;
6. existing operation reservation by idempotency key.

When additional backing cents are required, allocate in the same order as the current
commercial policy:

```text
included allowance -> prepaid balance -> authorized overage
```

Then atomically increment both:

- the source's whole-cent reserved counter; and
- the pool's matching `*BackedCents` value.

No provider call occurs before that transaction commits.

## Settlement-source order

When aggregate completed micro-cost produces whole `settleCents`, consume backed sources
in the original funding priority:

```text
included -> prepaid -> authorized overage
```

When excess backing becomes releasable, release in reverse order:

```text
authorized overage -> prepaid -> included
```

This minimizes avoidable customer overage/prepaid consumption while preserving the plan
allowance as the first intended funding source.

## Provider acceptance versus actual cost

These are different facts.

A successful HTTP response/provider reference can establish that the external service
accepted an operation. It generally cannot establish the final invoice amount.

State transition:

```text
reserved
  -> released                      provider rejected / execution failed
  -> accepted_pending_cost         provider accepted, final cost not yet trustworthy
  -> completed                     actual cost reconciled inside backing
  -> completed_with_overrun        actual cost exceeded all backed capacity
```

Do not write estimated cost into `actualMicroUsd`.

## Reconciliation sources

Examples of acceptable actual-cost evidence include:

- provider-returned token/tool usage multiplied by the explicitly configured current rate
  when that pricing contract is actually deterministic;
- provider usage export;
- provider invoice/billing API;
- an independently reconciled monthly provider statement.

Shared credits/free tiers must not be assigned to individual tenants unless a documented
allocation policy intentionally does so.

## AI integration

Zumi already records exact `costMicroUsd` per invocation and has a maximum turn budget.
The eventual funded execution flow should be:

```text
Zumi auth / tenant / entitlement / PHI / redaction policy
-> determine maximum permitted turn micro-budget
-> ensure micro pool has backing for that budget
-> reserve turn micro-budget under invocation id
-> run bounded cognition
-> record actual ProviderResult.costMicroUsd
-> complete micro reservation
-> aggregate settlement/release
-> record reservation/pool references on Zumi invocation/audit metadata
```

Important: safety/redaction authorization still runs before economic reservation so a
policy-blocked request does not hold customer money.

For a multi-pass deep turn, the entire bounded turn budget should normally be one micro
reservation. The cognition loop can still stop itself earlier based on actual accumulated
cost.

## Email integration

Current Resend economics can be sub-cent per incremental email and also include a fixed
monthly plan. Do not call fixed monthly plan cost a per-message invoice amount.

Recommended split:

- provider marginal/overage micro-cost -> micro usage pool;
- shared fixed monthly platform plan -> separate cost allocation/COGS policy;
- tenant customer charge -> plan allowance / prepaid / authorized overage policy, not a
  fabricated provider invoice.

Batch provider reconciliation can complete many accepted message reservations at once.

## Billing-period rollover

Fractional carry requires source-aware treatment.

### Included plan allowance

Included allowance is already funded by subscription revenue. At period close, a
fractional micro carry backed only by included allowance may be conservatively consumed
against at most one included cent for allowance bookkeeping, while exact provider COGS
remains in micro-USD. This does not create an extra customer invoice.

### Prepaid / authorized overage

Do not consume a whole customer cent solely because a period ended with a fractional
provider cost. Carry the micro remainder and its backed cent into the next compatible
pool/accounting period until aggregate cost reaches a full cent or the customer/account is
closed and a final reconciliation policy applies.

This rollover rule needs explicit database/journey tests before implementation.

## Concurrency requirements

The database-backed implementation must prove:

1. two simultaneous cheap calls cannot reserve the same unbacked capacity;
2. an actual-cost overrun cannot consume micro capacity protected by another in-flight
   reservation;
3. an idempotency retry cannot execute the provider side effect twice merely because the
   funding reservation already exists;
4. settlement and release cannot drive any whole-cent source reserved counter negative;
5. pool `reserved + consumed` never exceeds backed micro capacity except as an explicit
   overrun record that blocks further execution;
6. period rollover cannot duplicate backing or consume a carry twice.

## Migration acceptance gate

Before any schema implementation is mergeable, run against:

- a fresh PostgreSQL database with every migration;
- a populated legacy/demo database;
- concurrent reservation/settlement tests;
- existing paid activation journey;
- Zumi journey;
- Grid financial journey;
- full TypeScript/lint/test/security/build/start gate.

GitHub Actions account-level runner failure (`steps: null`) is not execution evidence.
Use an environment where the actual gate runs.

## Commercial result

This primitive gives Klinikos one reusable answer for low-unit-cost COGS:

- AI tokens and hosted tools;
- high-volume email;
- future sub-cent API calls;
- any provider where exact usage is finer than the customer ledger's whole-cent unit.

It protects gross margin **without** making the customer economics dishonest.
