# KLINIKOS — CURRENT-MAIN COMPLETION ROADMAP

Version: `2026-08-18.1`
Status: `BRANCH RECOVERY CLOSED / CURRENT-MAIN EXECUTION ONLY`
Current main at start of this completion slice: `main@69d8ebdf5d542b53e99591e88f21e9723562726c`
Current native-completion candidate: `feat/current-main-native-completion-2026-08-18`

## 1. Recovery is finished

Historical Codex, Claude and agent branches are no longer a Klinikos work queue.

All known remote branch work has been resolved into one of three final states:

- valuable implementation is already on `main`;
- valuable implementation was rebuilt/reconciled onto a newer current-main branch and merged;
- the branch is superseded or out of scope and owns no remaining implementation requirement.

The old compliance-gating branch is superseded by current access verification, audit/security, legal/compliance, environment, tenant/RBAC and migration systems. The emergency Stripe implementation is superseded by merged PR #117. The original Twilio implementation is superseded by merged PR #119. The historical Claude home/marketplace line is superseded by current main after PRs #54 and #120.

See `docs/BRANCH_LEDGER.md`. It intentionally contains no active preservation/recovery status.

## 2. Current merged convergence

- PR #110: active Cloudflare model + AI Gateway payload-logging hardening.
- PR #111: generalized professional intake and Grid Marble correction.
- PR #112: approved Living Home reference implementation.
- PR #113: production-environment truth index.
- PR #114: MapLibre + OpenFreeMap primary Grid map; Google no longer required for core mapping.
- PR #117: authoritative Stripe customer-payment rail through the shared Financial OS.
- PR #119: restricted-key Twilio outbound SMS + Verify adapters reconciled after Stripe.
- PR #120: Claude server-owned home/operating truth recovered without reverting the approved Living Home design.
- PR #124: persistent governed Zumi conversation workspace across the authenticated shell.
- PR #126: live Stripe customer-payment webhook endpoint existence/event configuration recorded as external evidence without storing its signing secret.

There were zero open pull requests when the 2026-08-18 native-completion slice began.

## 3. Current verification truth

The most recent post-convergence GitHub Actions jobs were blocked **before startup** by the GitHub account billing/spending-limit state. This is an external CI infrastructure failure, not a failing code step.

PR #117 recorded successful exact-candidate local TypeScript, Prisma validation, focused Stripe/commercial tests, complete repository tests, lint, dependency audit, diff/secret checks and populated migration/journey validation before merge.

The current native-completion candidate adds tests and expands the real PostgreSQL Grid journey, but those changes must still pass the exact-head Quality + deploy-contract gates before they may be called verified or merged.

The next clean-room engineering proof remains: restore GitHub Actions allowance and run the complete current-candidate/current-main verification contract.

## 4. What remains is current product work, not preserved work

| Area | Current truth | Current-main completion target |
| --- | --- | --- |
| Living Home / routing | Approved visual reference + server-owned role-authorized operating rail + persistent Zumi workspace merged. | Production browser/mobile proof and continue removing any newly discovered template-only signal. |
| Grid map | MapLibre/OpenFreeMap + opt-in browser location + deterministic radius truth merged. | Manual city/ZIP/place origin and privacy-safe interactive map bounds where a real geocoding source is justified. Google remains optional. |
| Grid intent/time | **CURRENT CANDIDATE:** deterministic temporal interpreter separates weekday/today/tomorrow/time-range/recurrence language from ordinary text search; marketplace weekday filtering is initialized from interpreted language. | Pass exact-head tests. Durable recurring-demand persistence/compatibility remains a separate model-level completion target; parsed recurrence must not be represented as a booked recurring series. |
| Grid transaction | Demand → eligibility → offer → reservation → payment condition → fulfillment → obligations/trust exists. **CURRENT CANDIDATE:** the PostgreSQL journey now exercises both provider capacity and healthcare-space capacity using the same offer/reservation primitives, with real space availability policy. | Run the expanded DB-backed journey and keep both generalized transaction classes green; external payout activation remains later. |
| Stripe customer payment | Direct hosted Checkout + signed webhook/evidence/refund implementation merged. Live Stripe endpoint is externally verified as enabled for the exact supported events. | Store the live endpoint signing secret in Render, deploy/restart, then perform controlled payment + refund runtime proof. Never infer proof from endpoint registration alone. |
| Grid payouts | Internal payout/obligation state exists. | Stripe Connect or equivalent external connected-account/payout proof; never infer it from customer payment. |
| Twilio | Restricted-key SMS + Verify code merged. | `MG` Messaging Service/sender, `VA` Verify service, applicable A2P, Render configuration and controlled non-PHI runtime proof. |
| Zumi | Governed provider-neutral gateway + Cloudflare rail + persistent conversation surface built. | Deliberate non-PHI production inference, spend/latency/error/quality evidence; formal quality evals remain valuable before broad automation. |
| Clinic OS | Broad tenant-scoped internal workflow stack exists. | Focus sellable journeys and connect only external clinical/claims rails justified by real customers. |
| EDU | Foundation/scenario/assessment/readiness work exists. | Finish instructor/competency/certificate/placement experience where current code still lacks the write path. |
| Production | Render/domain previously healthy in truthful demo mode. | Exact newest deploy SHA, Actions rerun, real-device QA, backup/restore, storage/observability and PHI-readiness decision. |

## 5. Ordered completion sequence

1. finish and verify the current native Grid completion candidate against current main;
2. restore GitHub Actions billing/allowance and run exact current-head quality + deploy-contract checks;
3. verify Render deployed the exact merged main and the production domain/login/health/browser paths are healthy;
4. store/activate the Stripe live signing secret and prove one controlled payment + refund;
5. connect and prove Twilio non-PHI SMS + Verify;
6. prove Cloudflare/Zumi non-PHI production inference and begin repeatable quality/cost/latency measurement;
7. finish only the remaining Grid location/recurrence UX that is justified by real supply and a reviewed geocoding strategy;
8. connect Stripe Connect only after legal/commercial payout policy and fulfillment gates are ready;
9. close production storage/backup/observability/security/compliance requirements;
10. finish EDU competency/certificate/placement write paths and Grid linkage without treating education as licensure;
11. launch controlled paying clinic + Grid pilots and measure time-to-value, conversion, retention, liquidity and gross margin.

## 6. External dependencies that code cannot truthfully eliminate

- Stripe live signing-secret deployment and real processor event proof;
- Stripe Connect platform/connected-account/payout configuration;
- sender registration, phone/Verify services and carrier rules;
- authoritative licensure/malpractice and regulated credential sources;
- BAAs/contracts/vendor/security approval for PHI-capable third parties;
- clearinghouse/payer enrollment and production healthcare transaction credentials;
- lab, imaging, eRx/EPCS, PDMP and institutional integrations;
- secure production storage, monitoring, backup/restore and real-PHI hosting posture;
- legal review of regulated marketplace/referral/fee-splitting/professional-practice economics;
- real marketplace supply/demand;
- optional address geocoding/routing when the product actually needs city/ZIP/place-to-coordinate resolution.

Those are **external completion gates**, not hidden branch work. Klinikos must expose truthful pending/manual states until each exact gate is proven.

## 7. Pilot truth

- Synthetic/internal workflow pilot: **READY** under current truth labels.
- Direct Stripe customer-payment code: **BUILT; LIVE ENDPOINT VERIFIED; RUNTIME SIGNING SECRET + PAYMENT/REFUND PROOF PENDING**.
- Twilio SMS/Verify code: **BUILT; SERVICE/RUNTIME PROOF PENDING**.
- Cloudflare/Zumi: **BUILT/OPERATOR-REPORTED CONFIGURED; NON-PHI RUNTIME PROOF PENDING**.
- Grid generalized transaction code: **BUILT; SECOND-CLASS DB JOURNEY ADDED IN CURRENT CANDIDATE; EXACT-HEAD VERIFICATION PENDING**.
- Regulated Grid fulfillment + external payout + real PHI: **BLOCKED UNTIL THE SPECIFIC EXTERNAL/LEGAL/SECURITY GATES ARE CLOSED**.

## 8. Permanent repository law

From this point forward, a historical branch is never a reason to delay current-main development.

`LATEST MAIN → PROVE GAP → IMPLEMENT FRESH → TEST → MERGE → CURRENT MAIN`

No preservation lane exists in the development workflow.
