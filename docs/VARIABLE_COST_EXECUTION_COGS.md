# Variable-cost execution and COGS ownership

Status: active economic policy; not provider-connectivity proof.

Every external operation that can create marginal vendor cost needs an explicit economic owner and accounting path before it is allowed to scale.

## Core rule

```text
product / privacy / auth / consent / credential / legal policy
  -> economic owner
  -> applicable funding/accounting authority
  -> provider side effect
  -> provider evidence / measured cost
  -> reconcile / settle / release
```

Payment or funding never widens clinical, privacy, credential, eligibility, consent, tenant, or legal authority.

## Economic owners

- `tenant`: usage created for a paying organization's operation.
- `platform`: Klinikos acquisition, security, or platform-level expense that cannot truthfully be assigned to a tenant.
- `transaction`: processor/payout economics attached to a verified transaction rather than a feature allowance.
- `unknown`: ownership is unresolved; paid execution must not silently choose a payer.

## Micro-unit rule

Sub-cent or pooled provider economics use the aggregate micro-unit architecture in `src/lib/commercial/micro-funding-math.ts` and `docs/MICRO_UNIT_COMMERCIAL_LEDGER_RFC.md`.

Do not reserve or charge a whole cent for every cheap operation. Do not round a non-zero sub-cent cost to zero and silently subsidize it either.

Tenant variable spend requiring `micro_pool_reservation` or `meter_then_micro_reconcile` is not funding-ready until a durable database-backed pool/reservation/reconciliation implementation exists. Pure arithmetic or provider metering alone does not satisfy that requirement.

## Zumi split

Public anonymous Zumi is a platform acquisition/product-comprehension expense. It has no identified tenant to charge. Paid public inference is separately protected by the durable public quota contract and must fail closed when that authority is unavailable.

Authenticated tenant Zumi may eventually consume tenant-backed AI allowance/prepaid/overage economics, but measured provider cost is not the same thing as a completed customer-funded reservation. The durable micro-pool must bridge those two facts.

## Communications split

Patient SMS and patient follow-up email are tenant operating usage, but economics come after the applicable communications safety policy. Consent, STOP suppression, PHI/body restrictions, sender/routing verification, time-window rules, and authorization must run before commercial reservation.

The old whole-cent-per-message reservation model must not be revived. Messaging becomes economically executable only after the current communications architecture and durable micro-unit funding persistence are both in place.

Phone-possession verification remains `unknown` ownership until its concrete use case establishes whether it is platform security/onboarding cost or tenant workflow usage. Unknown ownership fails closed economically.

## Transaction rails

Stripe customer-payment fees and Grid payout costs belong to transaction economics. They are not feature-usage allowances and never prove that a payment, payout, Grid fee, or settlement occurred. Persisted provider/server evidence remains authoritative.

## Readiness language

`variableCostRailPolicies` describes economic policy only. It must never be used as proof that:

- a provider is configured or live;
- a BAA or PHI approval exists;
- consent exists;
- credentials or eligibility are verified;
- a transaction is lawful;
- a customer has paid;
- a side effect executed;
- actual vendor COGS has been measured.

Those truths stay in their respective governed systems.
