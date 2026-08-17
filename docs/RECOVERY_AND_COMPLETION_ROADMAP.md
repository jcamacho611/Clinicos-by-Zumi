# KLINIKOS — RECOVERY & COMPLETION ROADMAP

Version: `2026-08-16.3`
Status: `ACTIVE EXECUTION ROADMAP`
Canonical base: `main@075ff39deca80c08c1d726425c05632568e16b3d`

## 1. Recovery outcome so far

- Correct repository and remote verified: `jcamacho611/Clinicos-by-Zumi`.
- No LWA/IWA files were inspected, edited, copied, or merged.
- Stale local Grid merge was aborted safely; local commits and stash remain preserved.
- PR #74 was confirmed already merged; its local divergent commits were not force-pushed.
- PR #95 was independently reviewed, verified against the provider contract, and merged.
- PR #96 was corrected, updated with latest main, connected to the actual design archive, passed the full gate, and merged.
- Current main is `cf4130b3ce4db5effde76d61d368b135da01c715`, including independently merged native scheduling, stored-truth telemedicine, governed task creation, Grid map/location continuity, and native internal messaging through PR #105.
- Current main's `verify` and `deploy-contract` checks completed successfully.
- Every remote branch present during the audit is classified in `docs/BRANCH_LEDGER.md`.
- PR #97's commercial and federal-evidence blockers were remediated in focused follow-up PR #100 and are now on main.
- PR #105's native internal-messaging work merged independently and was reconciled without duplication.
- Production domain and Render health returned HTTP 200 on 2026-08-16; health truth is `mode: demo`, database configured, live integrations false.

## 2. Repository audit scorecard

| Dimension | Score | State | Evidence |
| --- | ---: | --- | --- |
| Structure | 6.5/10 | YELLOW | Clear Next.js/Prisma/domain layout and tests, but 73 pages, 186 API routes, a 4,000+ line schema, additive raw-SQL Grid models, and overlapping docs raise navigation cost. |
| Agent architecture | 7/10 | YELLOW | Zumi has a governed provider-neutral gateway, redaction, admission, entitlements, and audit. Custom orchestration is intentional but broad, and formal reasoning-quality evaluation is absent. |
| Reusable skill/operating guidance | 5/10 | YELLOW | Repository `AGENTS.md` and canons are strong; no repo-scoped reusable maintenance skills exist for branch recovery, release verification, or truth-index updates. |
| Scope and complexity | 4/10 | RED | The product spans 45 logical engines, healthcare operations, Grid, EDU, portals, finance, AI, network, and 100+ historical branches. Completion risk is dominated by breadth and integration debt. |
| Context hygiene | 7/10 | YELLOW | Source precedence and status vocabulary are explicit, but the feature/external baselines were stale and specialist canons/branch ledger were missing before this recovery. |
| Safety and truth | 8/10 | GREEN | Tenant/RBAC, PHI-egress, payment truth, eligibility, concurrency, audit, and adversarial journeys are unusually strong. Real-PHI posture and external vendor approval remain external gates. |
| Workflow and verification | 8.5/10 | GREEN | CI validates fresh migrations plus type, lint, DB-backed journeys, production build/start, and the exact Render contract; the current candidate contains 52 migrations and local verification covers 636 tests. Browser/device QA and deploy-SHA evidence remain gaps. |

Overall: **6.6/10 — YELLOW.** The application has real governed depth and strong verification. The highest risk is not missing concept work; it is breadth, branch drift, stale truth indexes, and partially connected end-user journeys.

## 3. Current capability map

| Area | Current truth | Next blocking gap |
| --- | --- | --- |
| Universal Grid core | Built/partial: demand, resource, policy, matching, offers, reservations, obligations, fulfillment, trust, opt-in geolocation, keyless map. | Same-surface operating UX, structured time/recurrence, richer origin/map focus, readiness convergence, real supply. |
| Provider/participant enrollment | Built/partial: future-role credential-aware professional path, generalized external participant/resource enrollment, and neutral role-labeled contractor fixtures. | Remove approved-network-code dependence for independent production enrollment, unify readiness/status UX, and connect external verification. |
| Location/resource owner | Built/partial: capacity/resource intake, review, availability, public browse, request/offer path. | Stronger publication/readiness guidance, richer map/origin UX, real pilot inventory. |
| Organization demand | Built/partial: need creation, matching/offers, transaction state. | Effortless same-surface demand completion and auto/recurring match behavior. |
| Grid money | Built internal truth: fee policy, obligations, fulfillment holds, manual payment evidence, payout state rules. | Regulated processor/connected-account onboarding and settlement evidence. |
| Zumi | Gateway, safety, Cloudflare/OpenAI/self-hosted adapter architecture built. | Production non-PHI provider activation, quality evaluation, streaming/latency UX. |
| Clinic OS | Broad real internal workflows; partial specialty/operator depth. | External clinical/claims/communications connections and focused sellable journey polish. |
| EDU | Foundation, scenarios, submissions, grading/release rules built/partial. | Instructor UX, competency/certificate write path, placement composition, institutional/legal gates. |
| Portals/roles | Staff/patient separation, role routing, tenant isolation, safe return flow built. | Multi-role context switching and consistent role-native home experience. |
| Production | Health live in demo mode; database configured. | Exact deploy SHA exposure, live integration verification, browser/mobile release evidence, PHI/security approval. |

## 4. Highest-value recoverable implementation

The freshest recoverable work is `origin/claude/whop-portal-grid-marketplace-wdw811@f22a5c4`.

It contains:

- a composer-first authenticated Living Home;
- a truthful phase rail driven by real milestones rather than timers;
- role-authorized operating destinations;
- real task/Grid/escalation counts with no fabricated opportunity;
- inline appointment/workspace focus;
- truthful intelligence availability;
- centralized environment-provider registration;
- focused tests.

Recovery rule: create a current-main implementation branch, compare each changed file with main, neutralize fixture/user naming, preserve current design/canon/security, run the full gate, and open a new PR. Do not merge the stale branch directly.

## 5. Next ten execution items

1. **Completed:** repository-truth convergence merged through PR #98.
2. **Completed:** PR #97 safe wiring reached main and its exact-price, connector-bound/cache, no-clearance-language remediation merged through focused follow-up PR #100.
3. **Recover Living Home operating-surface work** from `f22a5c4` file-by-file, including the provider-registry correction and real operating rail.
4. **Completed and merged through PR #109:** person-specific Grid contractor/applicant fixtures and tests now use neutral provider-role labels without weakening synthetic-data evidence or relationships.
5. **Complete the remaining manual-origin map UX**: pin/list focus, shared browser-location radius results, and selected-resource request continuity are complete; manual city/ZIP/place origin and privacy-safe interactive bounds remain.
6. **Add deterministic time and recurrence interpretation**: weekday/time initialization, recurring demand/resource compatibility, and truthful missing-field prompts.
7. **Converge participant readiness** across provider, organization, location owner, seller/service provider, education participant, and non-clinical business service classes using shared status language and policy-specific requirements. The current candidate removes the nurse-only professional-role allow-list but does not yet remove the controlled pilot's approved-network-code dependency.
8. **Prove two end-to-end Grid transactions through the same engine**: one regulated workforce/space composition and one non-clinical business-service engagement, both operator-assisted and auditable.
9. **Connect/evaluate approved external rails**: processor/payout evidence when approved and non-PHI Zumi with spend, latency, error, and quality controls. Keep manual fallback until then.
10. **Prepare a controlled pilot release**: exact deploy SHA in health/observability, production browser/mobile QA, backup/restore evidence, security/compliance sign-off, real pilot supply, support/runbook, and rollback.

## 6. Grid milestone proof required

### First transaction

`AUTHORIZED OPERATOR → ELIGIBLE PROVIDER → AVAILABILITY → APPROVED LOCATION/CAPACITY → DEMAND → ELIGIBLE MATCH → OFFER → ACCEPTANCE → ATOMIC RESERVATION → VERIFIED PAYMENT CONDITION → BOOKING → FULFILLMENT → PROVIDER/FACILITY/PLATFORM OBLIGATIONS → PAYOUT EVIDENCE → RECONCILIATION`

### Second non-clinical transaction

`ORGANIZATION NEEDS BUSINESS SERVICE → POLICY-APPROPRIATE SERVICE PROVIDER → MATCH → OFFER/AGREEMENT → PAYMENT CONDITION → FULFILLMENT → PLATFORM FEE → RECONCILIATION`

Both must use the same generalized demand/resource/offer/reservation/financial primitives with different policy classes.

## 7. External blockers

- production processor and marketplace payout platform approval/configuration;
- external license and malpractice verification sources;
- PHI-approved AI/vendor posture where any PHI workload is intended;
- communications, geocoding/routing, claims, lab, imaging, eRx, storage, observability, and institutional rails as listed in `EXTERNAL_DEPENDENCY_MATRIX.md`;
- legal/compliance/contract review for real regulated transactions and EDU institutions;
- verified marketplace supply/demand and operator support capacity;
- exact deployed SHA and real-device release evidence.

## 8. Local engineering blockers

The local data volume remains at 100% capacity. The current production build passed, but its optional `.next/cache` grew to roughly 587 MB and left about 136 MB free. Only that exact regenerable cache was cleared after verification, restoring roughly 725 MB free. Do not delete unrelated user data; continue relying on GitHub clean-room verification for exact-head release evidence.

## 9. Pilot verdict

- **Controlled demo/internal workflow pilot: YES**, with synthetic data, manual external steps, and truthful labels.
- **Real regulated marketplace/payment/payout pilot: NO**, until the exact external, legal, security, supply, and settlement gates above are closed.
