# Commercial event target

Suggested canonical event families, mapped to the existing event/audit architecture rather than a parallel bus:
- commercial.analysis.purchased
- commercial.blueprint.purchased
- commercial.implementation.purchased
- commercial.subscription.activated
- commercial.subscription.changed
- commercial.subscription.suspended
- commercial.entitlement.granted
- commercial.allowance.granted
- commercial.usage.reserved
- commercial.usage.reconciled
- commercial.usage.blocked_unfunded
- commercial.prepaid.purchased
- commercial.overage.authorized
- commercial.capacity.changed
- commercial.connector.purchased
- commercial.connector.ready
- commercial.connector.blocked
- grid.fee.calculated
- grid.fee.settled
- grid.refund.recorded

Every consequential event should include organization scope, actor/system provenance, commercial policy/version reference where applicable, and auditable money values in minor units.
