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

## 2026-08-18 — Post-PR #128 design-route QA delta

Scope: newly merged Klinikos Browser, governed Route registry, Ecosystem surface, account/theme/sign-out wiring, public conversion bridge, and Grid design convergence.

### Findings and corrections

- The `clinic-monetize-capacity` Route step `Publication readiness` links to `/grid/trust`.
- `/grid/trust` is a real authenticated App Router route under `src/app/(platform)/grid/trust/page.tsx`; an initial direct-file probe that omitted the `(platform)` route-group directory incorrectly looked like a 404. The route itself was never absent.
- The actual defect was semantic: `/grid/trust` presented only post-transaction disputes/safety governance, while the Route Engine described it as a pre-publication readiness step.
- `/grid/trust` is now a combined **Grid Trust & Readiness** surface. It adds a truthful pre-publication sequence for resource definition, real availability, required review, and transaction-state separation while preserving the existing dispute/safety workspace and its settlement-hold boundaries.
- `/grid/resources` remains the source-of-truth owner console for creating, reviewing, pausing, and managing real Grid resources/capacity. Its page-level entry treatment is aligned to the current Klinikos rose/ink visual language; underlying resource actions and policy/review behavior are unchanged.
- `tests/path-route-existence.test.ts` now walks the actual `src/app/**/page.tsx` tree, removes Next.js route-group/parallel-route segments, understands dynamic route segments, strips query/hash suffixes, and asserts that every internal governed Path node href resolves to a real application page.
- The same test explicitly locks `clinic-monetize-capacity:readiness` to the real `/grid/trust` governance surface.

### Verification truth

- Repository-level route/auth/design contracts were inspected directly against the merged `main` implementation.
- Independent production browser/device QA is **not yet proven from this tool environment** because the sandbox resolver could not reach `klinikos.io` during the pass. Do not upgrade this audit to production visual/runtime proof until the deployed domain is exercised successfully.
- GitHub Actions has recently been refusing `verify` / `deploy-contract` jobs before step 1 because of the repository/account runner-billing condition. A zero-step/no-log Actions result is infrastructure refusal, not a passing or failing repository command. Rerun the exact-head gates when runner availability is restored.
