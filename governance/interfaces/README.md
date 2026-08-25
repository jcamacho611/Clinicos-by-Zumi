# Klinikos Cross-System Interface Contracts

Status: GOVERNING INTERFACE INDEX

Read the relevant contracts whenever a change crosses domain boundaries.

| Contract | Purpose |
|---|---|
| `DOMAIN_EVENT_REGISTRY.md` | canonical business-event semantics |
| `COMMAND_REGISTRY.md` | owning-domain command boundaries |
| `DATA_AUTHORITY_MATRIX.md` | source-of-truth ownership |
| `PERMISSION_AND_AUTHORITY_MATRIX.md` | contextual authorization dimensions |
| `ZUMI_TOOL_AND_AUTONOMY_REGISTRY.md` | AI tool permissions/autonomy ceilings |
| `INTEGRATION_LIFECYCLE_REGISTRY.md` | external adapter truth and lifecycle |
| `MONEY_FLOW_REGISTRY.md` | payment/revenue/transaction truth |
| `OFFER_AND_ENTITLEMENT_REGISTRY.md` | pricing/offers/paid-feature authority |

## Rule

When an implementation cannot identify its owning domain, command, event, data authority, permission rule and money/integration boundary, the design is incomplete and should be clarified before code is merged.
