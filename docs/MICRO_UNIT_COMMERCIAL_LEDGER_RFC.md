# RFC: Micro-Unit Customer Funding for Variable COGS

Status: `DESIGN + PURE ARITHMETIC ONLY — NO DATABASE MIGRATION YET`
Date: 2026-08-20 America/New_York
Baseline: `main@986f1d5eaeb4e014317fd79f613a9580f647e8f5`

## Why this exists

Current main now measures known Zumi provider cost per organization and truthfully returns
an insufficient-evidence verdict when the rest of clinic cost-to-serve is unknown. That
solves measurement truth. It does not yet solve pre-execution customer funding.

The existing commercial funding ledger is intentionally whole-cent. It supports included
allowances, prepaid balance, bounded overage, reservations, release, settlement and
blocking on overrun. That is correct for cost units of one cent or more.

AI and some communications rails are finer-grained. One real operation may cost a
fraction of a cent. Rounding each operation up to one cent changes customer economics;
rounding down makes Klinikos silently front COGS.

Required invariant:

> Customer-backed whole cents are reserved before provider execution, while many cheap
> operations consume that backing internally in micro-USD.

`1 cent = 10,000 micro-USD` exactly.

## Pure contract implemented in this branch

`src/lib/commercial/micro-funding-math.ts` models:

```text
backingCents
reservedMicroUsd
consumedMicroUsd
```

Hard invariant:

```text
reservedMicroUsd + consumedMicroUsd <= backingCents * 10,000
```

Before reserving an operation with estimate `E`:

```text
requiredBackingCents = ceil((reserved + consumed + E) / 10,000)
additionalBackingCents = max(0, requiredBackingCents - backingCents)
```

Only those additional whole cents need to be acquired from customer-backed sources.

### Completion

For an operation with a known reserved estimate:

1. Protect every other in-flight reservation.
2. Use any spare backed capacity if actual cost exceeds this operation's estimate.
3. Move funded actual cost from reserved to consumed micro-USD.
4. Make unused estimate available to the pool immediately.
5. Return any cost above all backed capacity as an explicit unfunded overrun.

### Aggregate settlement

Completed micro-cost settles only when it reaches full cents:

```text
settleCents = floor(consumedMicroUsd / 10,000)
carryMicroUsd = consumedMicroUsd % 10,000
```

A fractional carry remains backed. Extra whole-cent backing becomes releasable.

Example:

```text
turn maximum reserved       250,000 micro-USD = 25¢
actual provider cost         23,456 micro-USD = 2.3456¢
settle                         2¢
carry                          3,456 micro-USD
backing retained for carry     1¢
unused backing released       22¢
```

The customer is not charged 3¢ just because one turn occurred, and Klinikos does not
front the 0.3456¢ remainder.

## What the tests prove

The pure suite proves:

- one `$0.0009` event does not become a one-cent charge;
- twelve `$0.0009` events aggregate to `1.08¢`, not `12¢`;
- a 25-cent AI turn reservation releases unused backing after actual cost is known;
- one over-budget operation cannot consume micro capacity protected by another in-flight
  reservation;
- failed provider execution releases its micro reservation;
- a reservation is refused when whole-cent backing is insufficient;
- malformed/under-backed state fails rather than being silently repaired.

## Proposed persistence model

Do not implement or merge a migration until it passes fresh + populated PostgreSQL,
concurrency journeys, existing commercial journeys, and the full release gate.

### `commercial_micro_usage_pools`

One aggregate pool per organization / billing period / cost bucket.

Suggested fields:

```text
id
organizationId
billingPeriodKey
bucket
currency
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
backingCents = includedBackedCents + prepaidBackedCents + overageBackedCents
reservedMicroUsd + consumedMicroUsd <= backingCents * 10,000
unique(organizationId, billingPeriodKey, bucket)
```

### `commercial_micro_usage_reservations`

One idempotent external operation.

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
status
metadata
createdAt
acceptedAt
completedAt
releasedAt
```

Suggested statuses:

```text
reserved
accepted_pending_cost
released
completed
completed_with_overrun
```

Required uniqueness:

```text
unique(organizationId, idempotencyKey)
```

Never derive idempotency from message text, patient data or PHI.

## Backing acquisition

A production repository should lock, in one transaction:

1. organization;
2. paid subscription;
3. current allowance;
4. funding account;
5. micro pool;
6. existing operation reservation.

When new backing is required, allocate in current commercial priority:

```text
included allowance -> prepaid -> authorized overage
```

Increment both the existing whole-cent reserved counters and the pool's matching backing
source before the provider call is permitted.

## Settlement and release order

When full cents become consumable, settle in original funding priority:

```text
included -> prepaid -> authorized overage
```

When backing is no longer needed, release in reverse order:

```text
authorized overage -> prepaid -> included
```

This avoids unnecessary overage/prepaid consumption while preserving the included plan
allowance as the intended first source.

## Provider acceptance is not final cost

A provider reference can prove a request was accepted. It usually does not prove the
final invoice amount.

Correct state flow:

```text
reserved
  -> released
  -> accepted_pending_cost
  -> completed
  -> completed_with_overrun
```

Never write an estimate into a field named `actualMicroUsd`.

Acceptable actual-cost evidence can include:

- provider-reported token/tool usage under an explicit deterministic rate contract;
- provider usage export;
- provider billing API;
- reconciled invoice/statement.

Free tiers and account-wide credits remain shared economics unless a documented allocation
policy intentionally attributes them to tenants.

## Zumi integration target

Current Zumi already has tenant/auth/entitlement policy, redaction/PHI boundaries,
provider cost in micro-USD, and a bounded per-turn maximum.

The target flow is:

```text
Zumi auth / tenant / entitlement / PHI / redaction policy
-> determine bounded maximum turn micro-budget
-> acquire any required whole-cent backing
-> reserve the turn budget under a server-owned invocation/operation ID
-> run bounded cognition
-> record ProviderResult.costMicroUsd
-> complete the micro reservation
-> settle aggregate whole cents / retain fractional carry / release unused backing
-> write pool + reservation references to invocation/audit metadata
```

Safety and PHI policy must run before the economic hold so a prohibited request does not
reserve customer money.

For deep cognition, one reservation should normally cover the whole bounded turn, not one
reservation per planner/critic pass.

## Email integration target

Sub-cent marginal email and fixed monthly provider plan economics must stay separate.

Recommended split:

- marginal/overage usage -> micro pool;
- shared fixed provider plan -> platform COGS allocation policy;
- customer commercial policy -> allowance/prepaid/overage;
- provider invoice -> reconciliation evidence, not a fabricated per-message cost.

Batch reconciliation may complete many accepted message reservations together.

## Period rollover

Source-aware rollover is required.

### Included allowance

Included usage is already funded by subscription revenue. At period close, fractional
carry backed only by included allowance may be conservatively consumed against at most
one included cent for allowance bookkeeping while exact provider COGS remains micro-USD.
This does not create an extra customer invoice.

### Prepaid / overage

Do not consume a whole customer cent solely because a period ended with fractional cost.
Carry the remainder and its backing into the next compatible pool until aggregate cost
reaches a full cent or an explicit account-close reconciliation policy applies.

This must be proven with DB-backed rollover tests before implementation.

## Concurrency acceptance requirements

The eventual repository must prove:

1. simultaneous cheap operations cannot reserve the same unbacked capacity;
2. actual overrun cannot consume another operation's protected reservation;
3. idempotency retry cannot execute a provider side effect twice merely because a funding
   record already exists;
4. settle/release never drives source reserved counters negative;
5. pool reserved + consumed never exceeds backing except as an explicit overrun state;
6. rollover cannot duplicate backing or consume fractional carry twice.

## Migration gate

Before schema work is mergeable, run:

- every migration on a fresh PostgreSQL database;
- migration against populated legacy/demo state;
- concurrent reservation/completion/settlement tests;
- paid clinic activation journey;
- Zumi journey;
- Grid financial journey;
- TypeScript;
- lint;
- all tests;
- security checks;
- production build/start;
- deploy contract.

A GitHub Actions run with `steps: null` is still an account/runner failure, not code
execution evidence.

## Commercial outcome

This gives Klinikos one reusable primitive for low-unit-cost COGS:

- AI model/tool usage;
- high-volume email;
- future sub-cent APIs;
- any provider whose actual billing unit is finer than the customer ledger's whole-cent
  unit.

It protects gross margin **without falsifying customer economics**.
