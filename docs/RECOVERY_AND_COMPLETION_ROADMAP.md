# KLINIKOS — CURRENT-MAIN COMPLETION ROADMAP

Version: `2026-08-17.3`
Status: `BRANCH RECOVERY CLOSED / CURRENT-MAIN EXECUTION ONLY`
Canonical base before this closeout PR: `main@cc6162c9349e2ade8ec8a27cdd08a05296fb70a2`

## 1. Recovery is finished

Historical Codex, Claude and agent branches are no longer a Klinikos work queue.

All known remote branch work has been resolved into one of three final states:

- valuable implementation is already on `main`;
- valuable implementation was rebuilt/reconciled onto a newer current-main branch and merged;
- the branch is superseded or out of scope and owns no remaining implementation requirement.

The last useful unique PR #83 material was current implementation-status accuracy for the 45-engine registry. Those corrections are ported into the current closeout branch. The old large canon rewrite does not become an alternate architecture.

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

There are zero open pull requests at the start of this closeout.

## 3. Current verification truth

The most recent post-convergence GitHub Actions jobs have been blocked **before startup** by the GitHub account billing/spending-limit state. This is an external CI infrastructure failure, not a failing code step.

PR #117 recorded successful exact-candidate local TypeScript, Prisma validation, focused Stripe/commercial tests, complete repository tests, lint, dependency audit, diff/secret checks and populated migration/journey validation before merge.

The next clean-room engineering proof is to restore GitHub Actions allowance and rerun the complete current-main verification/deploy contract.

## 4. What remains is current product work, not preserved work

| Area | Current truth | Current-main completion target |
| --- | --- | --- |
| Living Home / routing | Approved visual reference + server-owned role-authorized operating rail merged. | Production browser/mobile proof and continue removing any newly discovered template-only signal. |
| Grid map | MapLibre/OpenFreeMap + opt-in browser location + deterministic radius truth merged. | Manual city/ZIP/place origin and privacy-safe interactive map bounds if still absent on current main. |
| Grid intent/time | Universal I NEED/I HAVE and saved demand exist. | Structured weekday/time/recurrence interpretation and recurring compatibility where still absent. |
| Grid transaction | Demand → eligibility → offer → reservation → payment condition → fulfillment → obligations/trust exists. | Controlled proof across two generalized transaction classes and external payout activation later. |
| Stripe customer payment | Direct hosted Checkout + signed webhook/evidence/refund implementation merged. | Live endpoint/secret registration and controlled payment/refund runtime proof. |
| Grid payouts | Internal payout/obligation state exists. | Stripe Connect or equivalent external connected-account/payout proof; never infer it from customer payment. |
| Twilio | Restricted-key SMS + Verify code merged. | `MG` Messaging Service/sender, `VA` Verify service, applicable A2P, Render configuration and controlled non-PHI runtime proof. |
| Zumi | Governed provider-neutral gateway + Cloudflare rail built. | Deliberate non-PHI production inference, spend/latency/error/quality evidence. |
| Clinic OS | Broad tenant-scoped internal workflow stack exists. | Focus sellable journeys and connect only external clinical/claims rails justified by real customers. |
| EDU | Foundation/scenario/assessment/readiness work exists. | Finish instructor/competency/certificate/placement experience where current code still lacks the write path. |
| Production | Render/domain previously healthy in truthful demo mode. | Exact newest deploy SHA, Actions rerun, real-device QA, backup/restore, storage/observability and PHI-readiness decision. |

## 5. Ordered completion sequence

1. restore GitHub Actions billing/allowance and run exact current-main quality + deploy-contract checks;
2. verify Render deployed the exact current main and the production domain/login/health/browser paths are healthy;
3. connect and prove Stripe live webhook + controlled payment/refund;
4. connect and prove Twilio non-PHI SMS + Verify;
5. prove Cloudflare/Zumi non-PHI production inference;
6. close remaining native Grid discovery/time/readiness UX gaps verified against current main;
7. run two generalized Grid transaction pilots through the same primitives;
8. connect Stripe Connect only after legal/commercial payout policy and fulfillment gates are ready;
9. close production storage/backup/observability/security/compliance requirements;
10. launch controlled paying clinic + Grid pilots and measure time-to-value, conversion, retention, liquidity and gross margin.

## 6. External dependencies that code cannot truthfully eliminate

- processor account/webhook/payout-platform configuration;
- sender registration, phone/Verify services and carrier rules;
- authoritative licensure/malpractice and regulated credential sources;
- BAAs/contracts/vendor/security approval for PHI-capable third parties;
- clearinghouse/payer enrollment and production healthcare transaction credentials;
- lab, imaging, eRx/EPCS, PDMP and institutional integrations;
- secure production storage, monitoring, backup/restore and real-PHI hosting posture;
- legal review of regulated marketplace/referral/fee-splitting/professional-practice economics;
- real marketplace supply/demand.

Those are **external completion gates**, not hidden branch work. Klinikos must expose truthful pending/manual states until each exact gate is proven.

## 7. Pilot truth

- Synthetic/internal workflow pilot: **READY** under current truth labels.
- Direct Stripe customer-payment code: **BUILT; LIVE RUNTIME PROOF PENDING**.
- Twilio SMS/Verify code: **BUILT; SERVICE/RUNTIME PROOF PENDING**.
- Cloudflare/Zumi: **BUILT/OPERATOR-REPORTED CONFIGURED; NON-PHI RUNTIME PROOF PENDING**.
- Regulated Grid fulfillment + external payout + real PHI: **BLOCKED UNTIL THE SPECIFIC EXTERNAL/LEGAL/SECURITY GATES ARE CLOSED**.

## 8. Permanent repository law

From this point forward, a historical branch is never a reason to delay current-main development.

`LATEST MAIN → PROVE GAP → IMPLEMENT FRESH → TEST → MERGE → CURRENT MAIN`

No preservation lane exists in the development workflow.
