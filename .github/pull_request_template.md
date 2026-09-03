## Purpose

Describe the coherent product/engineering outcome this PR delivers.

## Truthful implementation status

- What is actually built now?
- What remains pending/external/manual?
- What exact evidence proves the current state?

## Execution traceability

- **Requirement IDs:**
- **Canon references:**
- **Code disposition** (`REUSE / EXTEND / GENERALIZE / CONNECT / PARTNER / BUILD NEW`):
- **Implementation-state change:**
- **Commercial consequence** (or `N/A`):
- **Authority / security / legal consequence** (or `N/A`):
- **Expected evidence:**

These fields are review context, not checkbox theater. Any applicable consequence omitted here must be resolved before merge.

## Frontend confidentiality / trade-secret boundary

Read `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` before completing this section for any frontend, API, Zumi, Grid, Assurance/Quality, pricing, analytics, admin, integration, or client-visible change.

Confirm or explain N/A:

- [ ] Confidential/proprietary decision logic remains server-side unless an explicit reviewed disclosure is required.
- [ ] No secrets/credentials are exposed through `NEXT_PUBLIC_*`, API responses, client bundles, static assets, logs, telemetry, errors, source maps, or browser storage.
- [ ] Client Components receive minimum-necessary DTO/view-model props rather than broad raw ORM/domain/session objects.
- [ ] API responses are deliberately projected; raw sensitive entities are not serialized for convenience.
- [ ] Zumi hidden prompts/directives/private orchestration/internal reasoning are not returned to the browser.
- [ ] Rules & Evidence / Quality / Assurance client payloads do not expose confidential rule packages, private evidence refs, hidden scoring, or licensed content beyond permitted display.
- [ ] Grid / Expert Grid client payloads do not expose private ranking weights, trust/anti-gaming logic, rejected-candidate internals, hidden economics, or unauthorized patient/organization data.
- [ ] Frontend visibility/feature flags are not being used as authorization or confidentiality controls.
- [ ] Tenant/RBAC/resource authorization is enforced server-side.
- [ ] Sensitive responses use appropriate private/no-store behavior and cannot cross user/tenant cache boundaries.
- [ ] User-facing errors do not expose stack traces, SQL/schema details, private paths, prompts, secrets, provider payloads, or infrastructure internals.
- [ ] Third-party analytics/telemetry/session replay does not receive unnecessary PHI/PII or confidential Klinikos proprietary information.
- [ ] Production browser/client output was inspected for accidental sensitive/proprietary disclosure where risk warrants it.

Any unchecked applicable item is a merge blocker unless the exception is explicitly documented and reviewed.

## Security / governance

- [ ] Tenant isolation preserved.
- [ ] RBAC/authorization preserved.
- [ ] Minimum-necessary data access preserved.
- [ ] AI does not widen authority or establish deterministic clinical/compliance/payment/credential truth.
- [ ] External integration/payment/payout/verification status is represented truthfully.

## Verification

Record exact-head evidence as applicable:

- [ ] Prisma/schema/migrations
- [ ] TypeScript
- [ ] lint
- [ ] unit/integration tests
- [ ] journey tests
- [ ] production build/startup smoke
- [ ] browser/mobile QA
- [ ] client/server DTO and browser-disclosure review
- [ ] secret/public-env/static-asset review

If CI did not execute, state the exact blocker. Do not mark the PR verified-green merely because GitHub reports it mergeable.

## Remaining risks / next slice

List known remaining risks and the highest-value next implementation slice.
