# Commercial data model target

Persist or confirm equivalent existing concepts:
- Subscription: organization, plan, status, period, commercial source/evidence.
- Entitlement: module/capability access separate from subscription status.
- Allowance: billing period, cost bucket/capability, granted/remaining amount.
- PrepaidBalance: purchased/remaining amount, payment reference, expiration policy.
- UsageReservation: estimated maximum, allocations, idempotency key, state, expiry.
- UsageLedger: actual vendor usage/cost, customer-funded source, reconciliation state.
- AuthorizedOverage: bounded maximum and remaining authorization per billing period.
- CommercialCapacity: seats/providers/locations/storage/listings/other contracted quantity.
- CommercialPricePolicy: server-owned plan/add-on/transaction/resource-class configuration with effective dates.

Money uses integer minor units. Commercial state is tenant-scoped and auditable. External processor state is evidence, not the sole product entitlement source of truth.
