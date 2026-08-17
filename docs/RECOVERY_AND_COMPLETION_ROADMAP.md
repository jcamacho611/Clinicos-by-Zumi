# KLINIKOS — RECOVERY & COMPLETION ROADMAP

Version: `2026-08-17.2`
Status: `ACTIVE EXECUTION ROADMAP — REMOTE AGENT RECOVERY CLOSED`
Canonical base: `main@cc6162c9349e2ade8ec8a27cdd08a05296fb70a2`

## 1. Recovery outcome

- Correct repository and remote remain `jcamacho611/Clinicos-by-Zumi`.
- No LWA/IWA history is part of the Klinikos convergence.
- Historical branches and known local preservation refs remain preserved; no force-push, stash destruction, or mass merge was used.
- Repository/source hierarchy, design authority, specialist canons, branch ledger, external-dependency truth, and production-environment truth exist and are authoritative.
- PR #110 merged Cloudflare model/privacy hardening.
- PR #111 merged neutral universal professional enrollment corrections.
- PR #112 merged the approved Living Home visual/reference lock.
- PR #113 merged the authoritative production-environment truth index.
- PR #114 merged MapLibre + OpenFreeMap as the primary Grid map while preserving explicit browser geolocation, deterministic Haversine/radius matching, privacy-reduced public coordinates, and OSM fallback.
- PR #117 merged the authoritative direct Stripe customer-payment rail through the shared Financial OS, including hosted Checkout, signed live webhook evidence, explicit live/test separation, amount/currency/tenant/session/PaymentIntent correlation, async failure/success truth, refunds, migration 53, and a DB-backed Stripe journey.
- PR #119 merged restricted-key Twilio outbound SMS and Verify adapters after reconciling the Stripe/environment changes.
- PR #120 merged the valuable Claude operating/routing behavior without reviving the stale Claude visual rewrite: role-authorized destinations, real persisted task/Grid/escalation counts, null opportunity when nothing real is waiting, launchpad deduplication, and suppression of the old role-template Opportunity surface.
- Closed PR #116 is preserved as a superseded Stripe variant; PR #117 is authoritative.
- Closed PR #115 is preserved as the original Twilio branch; PR #119 is authoritative.
- Closed PR #118 and historical `claude/whop-portal-grid-marketplace-wdw811` are preserved as provenance; PR #120 is authoritative for recovered behavior.
- There are no remote whole-branch recovery candidates authorized for merge after this closeout. Future historical recovery begins only from a named current-main failing journey or gap.

## 2. Verification state

PR #114 completed the repository `verify` and `deploy-contract` GitHub Actions successfully before the account-level Actions block appeared.

The Stripe PR #117 recorded successful exact-candidate local validation before merge, including TypeScript, Prisma validation, focused Stripe/commercial tests, the complete repository test suite, lint, production dependency audit, diff/secret scans, and populated-legacy migration/journey evidence.

Afterward, GitHub Actions jobs for the post-convergence branches were refused **before startup** because of the GitHub account billing/spending-limit state. That is an infrastructure blocker, not a failing code step. Restore Actions billing/allowance and rerun the current-main quality/deploy gates as the first engineering verification task.

## 3. Repository audit scorecard

| Dimension | Score | State | Evidence |
| --- | ---: | --- | --- |
| Structure | 7/10 | YELLOW | Strong Next.js/Prisma/domain organization and extensive tests; breadth, large schema, raw-SQL Grid models and many historical branches still raise navigation cost. |
| Agent architecture | 7.5/10 | YELLOW | Zumi has provider-neutral gateway, redaction/admission/entitlement/audit boundaries and current external-tool readiness. Formal reasoning-quality evaluation remains incomplete. |
| Scope and complexity | 4.5/10 | RED | The product still spans clinic operations, Grid, EDU, portals, finance, AI, network, credentials and many integrations. Product completion risk is breadth, not absence of architecture. |
| Context hygiene | 8.5/10 | GREEN | Source precedence, production-environment truth, external dependency matrix, branch ledger, specialist canons and recovery disposition are explicit and current after convergence. |
| Safety and truth | 8.5/10 | GREEN | Tenant/RBAC, PHI egress, payment evidence, deterministic Grid eligibility, audit, replay/idempotency and no-fake-state invariants are strong. Real-PHI infrastructure/vendor approval remains external. |
| Workflow and verification | 7.5/10 | YELLOW | Clean-room gates and DB journeys are strong, but current-main GitHub Actions rerun is temporarily blocked by account billing before job startup. |

Overall: **7.3/10 — YELLOW trending GREEN.** Remote agent/repository drift is no longer the primary risk. The largest remaining risks are external runtime connection, real-PHI infrastructure approval, broad product surface area, and final user-journey polish.

## 4. Current capability map

| Area | Current truth | Next blocking gap |
| --- | --- | --- |
| Universal Grid core | Built/partial: generalized demand/resource/policy/matching/offers/reservations/obligations/fulfillment/trust, explicit geolocation, MapLibre/OpenFreeMap primary map, OSM fallback, deterministic radius matching. | Manual city/ZIP/place origin, structured time/recurrence, readiness convergence, richer real supply and release QA. |
| Provider/participant enrollment | Built/partial generalized professional path and neutral role architecture. | Reduce pilot-only enrollment dependencies, unify readiness/status UX, connect external verification. |
| Location/resource owner | Built/partial capacity/resource intake, review, availability, public browse, request/offer path. | Stronger publication/readiness guidance, real pilot inventory, optional address/routing enrichment when useful. |
| Organization demand | Built/partial need creation, matching/offers and transaction state. | More effortless same-surface completion and recurring/automatic match behavior. |
| Grid money | Shared Financial OS, fee/obligation/fulfillment/payout truth built; verified Stripe customer-payment implementation merged. | Live Stripe webhook connection/proof; separate Stripe Connect connected-account/payout onboarding and legal policy. |
| Commercial checkout | Stripe hosted one-time Checkout merged with GoDaddy/manual fallback. | Register live webhook, configure signing secret, controlled payment/refund proof, then later recurring Stripe subscription lifecycle if desired. |
| Communications | Restricted-key Twilio SMS + Verify adapters merged; Resend adapter exists. | `MG` Messaging Service/US sender readiness, `VA` Verify service, non-PHI runtime proofs, email-domain setup; PHI messaging remains separately gated. |
| Zumi | Governed provider-neutral gateway and Cloudflare adapter built; Cloudflare credentials operator-reported configured. | Deliberate production non-PHI inference proof, quality evaluation, streaming/latency UX, shared rate limiting at scale. |
| Clinic OS | Broad real internal workflows. | External communications/claims/clinical networks and focused sellable-journey polish. |
| EDU | Foundation/scenarios/submissions/grading/release rules built/partial. | Instructor UX, competency/certificate write path, placement composition and institutional/legal connections. |
| Living Home / routing | Approved visual reference merged; real server-owned operating rail and role-authorized routing recovered. | Continue replacing any remaining template-only signals with persisted state as they are found; production browser/mobile visual QA. |
| Portals/roles | Staff/patient separation, role routing, tenant isolation and safe return flows built. | Multi-role context switching and consistent role-native lifecycle experience. |
| Production | Render/domain previously healthy in demo mode. | Newest deployed SHA proof, Actions rerun, browser/mobile release evidence, backup/restore proof, storage/observability, PHI/security approval. |

## 5. Remote recovery verdict

Remote Codex/Claude convergence is **closed** for the known active candidates.

Current authority:

- Grid mapping: PR #114
- Stripe customer payment: PR #117
- Twilio communications/Verify: PR #119
- Claude operating/routing recovery: PR #120
- Living Home visual reference: PR #112

Closed/superseded historical branches remain preserved but are not pending work. Do not mass-merge them. See `docs/BRANCH_LEDGER.md`.

Known local-only refs/stash cannot be inspected through the GitHub connector. Preserve them. If a local-only commit is later pushed or supplied and a current-main journey demonstrates missing behavior, compare that exact patch surgically; do not overwrite current main merely because the local commit is newer by date.

## 6. Next ten execution items

1. **Restore GitHub Actions billing/allowance and rerun current-main exact-head gates**: schema/migrations, type, lint, full tests, all DB-backed MVP journeys, production build/start and deploy contract.
2. **Verify the newest Render production deployment**: exact SHA, `klinikos.io`, login/auth, health, database migration 53, browser/mobile smoke and no console/runtime failures.
3. **Finish live Stripe external activation**: register `https://klinikos.io/api/webhooks/stripe` for the five supported events, store the live endpoint signing secret in Render, run one controlled real payment and refund, verify idempotent Financial OS evidence. Keep GoDaddy/manual fallback until proven.
4. **Finish Twilio external activation for non-PHI use**: ensure restricted `AC`/`SK` credentials are in Render, create/select `MG` Messaging Service and permitted sender, create `VA` Verify service, satisfy applicable US messaging/A2P requirements, run controlled SMS + Verify proofs. Keep PHI fail-closed.
5. **Prove Cloudflare/Zumi runtime** with an intentional non-PHI production inference, provider/model/failure/latency evidence and spend controls.
6. **Finish Grid manual-origin/location UX**: city/ZIP/place entry without Google dependency, privacy-safe interactive bounds, selected-resource/request continuity and optional Geoapify only if the enhancement is worth the variable cost.
7. **Add deterministic time and recurrence interpretation**: weekday/time initialization, recurring demand/resource compatibility, truthful missing-field prompts and no AI override of eligibility.
8. **Converge participant readiness** across provider, organization, location owner, seller/service provider, education participant and non-clinical business-service classes using shared status language and policy-specific requirements.
9. **Prove two real generalized Grid transaction classes in controlled pilot**: one regulated workforce/space composition and one non-clinical business-service engagement through the same demand/resource/offer/reservation/financial primitives; Stripe Connect payout proof remains a separate gate.
10. **Prepare controlled production pilot**: backup/restore evidence, secure object storage, observability, security/compliance sign-off, real pilot supply, support/runbook, rollback, legal transaction terms and PHI-ready infrastructure decision.

## 7. Grid milestone proof required

### Regulated composition

`AUTHORIZED OPERATOR → ELIGIBLE PROVIDER → AVAILABILITY → APPROVED LOCATION/CAPACITY → DEMAND → ELIGIBLE MATCH → OFFER → ACCEPTANCE → ATOMIC RESERVATION → VERIFIED PAYMENT CONDITION → BOOKING → FULFILLMENT → PROVIDER/FACILITY/PLATFORM OBLIGATIONS → PAYOUT EVIDENCE → RECONCILIATION`

### Non-clinical business-service composition

`ORGANIZATION NEED → POLICY-APPROPRIATE SERVICE PROVIDER → MATCH → OFFER/AGREEMENT → PAYMENT CONDITION → FULFILLMENT → PLATFORM ECONOMIC POLICY → RECONCILIATION`

Both must use the same generalized Grid primitives with different policy classes. Customer payment does not prove provider payout.

## 8. External blockers

- GitHub Actions account billing/spending-limit state;
- Stripe live endpoint/signing-secret/runtime payment proof and separate Connect onboarding/payout proof;
- Twilio Messaging Service/Verify/sender runtime setup and PHI contractual gate;
- external license/malpractice verification sources;
- PHI-approved AI/vendor posture where any PHI workload is intended;
- communications, optional routing/geocoding, claims, lab, imaging, eRx, storage, observability and institutional rails listed in `EXTERNAL_DEPENDENCY_MATRIX.md`;
- Neon/hosting/object-storage/monitoring decisions required for real-PHI production approval;
- legal/compliance/contract review for regulated Grid transactions and EDU institutions;
- verified marketplace supply/demand and operator support capacity;
- exact newest deployed SHA and real-device release evidence.

## 9. Pilot verdict

- **Controlled demo/internal workflow pilot: YES**, with synthetic data, manual external steps where needed, and truthful labels.
- **Controlled non-PHI commercial payment pilot: CODE READY / EXTERNAL ACTIVATION PENDING**, subject to live Stripe webhook/payment proof.
- **Controlled non-PHI SMS/verification pilot: CODE READY / EXTERNAL SERVICE SETUP PENDING**, subject to Twilio Messaging/Verify configuration and sender requirements.
- **Real regulated marketplace/payment/payout/PHI pilot: NO**, until the exact external, legal, security, infrastructure, supply and settlement gates above are closed.
