# Klinikos Route and Action Audit

This document tracks exposed application routes and their major actions. It is intentionally operational: every user-visible route and control should be either working, clearly demo, vendor-blocked, intentionally disabled, or removed.

| Route | Surface | Status | Auth | RBAC | Tenant scoped | Demo/live truth | Major action notes |
|---|---|---|---|---|---|---|---|
| `/patients` | Patient index | Partially working | Yes | Yes | Yes | Needs demo-state review | Add patient backend exists; visible button wiring still pending |
| `/patients/new` | Patient creation | Working | Yes | Yes | Yes | Synthetic-only until production gates complete | Validated, audited tenant-scoped create flow |
| `/front-desk` | Front desk | Partially working | Yes | Yes | Data reads scoped | Contains synthetic/static callback and focus content | Several visible controls still need wiring/removal |
| `/schedule` | Scheduling | Security review required | Yes | Review | Review | Review | Audit create/book/edit controls and route integrity |
| `/encounters` | Encounters | Security review required | Yes | Review | Review | Review | Audit note create/edit/sign/addendum actions |
| `/billing` | Billing | Demo | Yes | Review | Review | Demo/live labeling required | Audit claim/payment/denial actions before production use |
| `/insurance` | Insurance | Demo | Yes | Review | Review | Demo/live labeling required | Eligibility and auth integrations not yet live |
| `/network` | Network command | Partially working | Yes | Yes | Yes | Explicit synthetic demo today | Redesign card-heavy layout and remove legacy copy |
| `/grid` | GRID | Partially working | Yes | Review | Review | Synthetic credential workflow | Mapping/provider verification integrations pending |
| `/grid/join` | GRID enrollment | Demo | Public controlled flow | N/A | Organization target review | Explicit synthetic-only | Preserve human credential review and no-autonomous approval |
| `/labs` | Labs | Demo / manual fallback | Yes | Yes | Review complete for list route; mutations require pass | Must remain explicit about vendor connection status | Audit every result/release/order mutation |
| `/imaging` | Imaging | Demo / manual fallback | Yes | Review | Review | Must remain vendor-truthful | Audit order/report/release actions |
| `/documents` | Documents | Partially working | Yes | Review | Review | Review | Audit upload/download/release/security semantics |
| `/messages` | Messages | Demo / adapter pending | Yes | Review | Review | Communications provider not live | Disable or label outbound actions until connector approved |
| `/tasks` | Tasks | Partially working | Yes | Review | Review | Review | Audit transitions/ownership/escalation |
| `/integrations` | Integration roadmap | Partially working | Yes | Admin/system roles preferred | Tenant scoped | Should surface true connection state only | Simplify jargon for normal users |
| `/system-health` | System health | Working foundation | Yes | Yes | Yes | Live tenant-scoped operational state | Existing audit/retry patterns should be reused elsewhere |
| `/feature-registry` | Internal product registry | Working internal | Yes | Yes | N/A | Internal implementation status | Hide from ordinary clinic staff navigation |
| `/capabilities` | Public capability registry | Public | N/A | N/A | N/A | Status-oriented but commercial CTA stale | Replace Start free with qualification CTA |
| `/` | Public landing | Public | N/A | N/A | N/A | Commercial messaging needs correction | Remove free/self-service language and align to qualification funnel |

## Required route checks

For each protected route:

1. Authentication is required.
2. Role authorization matches the minimum necessary workflow.
3. Tenant identity is derived from the authenticated session.
4. ID-based resources are queried within the session tenant.
5. Foreign-tenant and nonexistent objects do not reveal distinguishable sensitive existence.
6. Mutations use strict validation.
7. Sensitive mutations create audit receipts.
8. PHI responses use private/no-store where appropriate.
9. Demo/static content is labeled or removed.
10. Every exposed action is wired, intentionally disabled with a reason, or removed.
