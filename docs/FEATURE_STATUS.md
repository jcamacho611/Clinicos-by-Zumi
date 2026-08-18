# Klinikos Feature Status

Status: `IMPLEMENTATION TRUTH INDEX`
Current audited main: `main@a111ae4ec4c5dfc02bd2b4d376a5a1a60acffdc9`
Latest local candidate: Production-safe one-time Stripe Checkout and signed live-webhook evidence through the shared Financial OS, with strict amount/currency/tenant/session/mode checks, byte-identical replay enforcement, payment-failure/refund truth, and GoDaddy fallback; Prisma generation/schema validation, type-check, lint, 56 focused commercial/Stripe tests, all 675 repository tests, and zero production dependency audit findings are green; the new PostgreSQL-backed Stripe journey and fresh exact-head CI remain pending.
Audited: 2026-08-17 America/New_York

If something is labeled **BUILT** here and the corresponding path does not actually work, the defect is in both the product and this document.

Repository verification does not by itself prove that the same commit is already deployed on the external production host.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| **BUILT** | Implemented and verified against real internal state. |
| **PARTIALLY BUILT** | A useful path works; named gaps remain. |
| **MANUAL FALLBACK** | Workflow is real, but a human performs the external step. |
| **ADAPTER READY** | Internal interface/safety/failure behavior exists; external production connection is not verified. |
| **PENDING CONNECTION** | Credentials, vendor enrollment, contract, BAA, or production approval is missing/unverified. |
| **BLOCKED** | Cannot truthfully proceed until an external condition is resolved. |
| **NOT BUILT** | Does not exist yet. |
| **NOT BUILT BY DESIGN** | Intentionally prohibited because it would create false/unsafe product state. |

## Verification baseline

The exact final candidate for PR #74 passed before merge:

| Check | Result |
| --- | --- |
| Prisma schema validation | Green |
| Prisma client generation | Green |
| Fresh PostgreSQL migrations | **51/51** applied successfully |
| TypeScript | Green |
| ESLint | Green |
| Automated tests | Green |
| DB-backed MVP journeys | **10/10** passing |
| Production Next.js build | Green |
| Production startup smoke | Green |
| Exact Render deploy-contract | Green |

PR #72’s exact final head also passed the same Quality gate before merge.

PR #96's exact final head passed Prisma generation/validation, all 51 fresh PostgreSQL migrations, TypeScript, lint, 604 automated tests, all 10 DB-backed journeys, production build/start smoke, and the exact Render deploy contract before merging as current main. The merge commit's push Quality gate also completed successfully.

PR #109's exact final head passed Prisma generation/validation, all 52 fresh PostgreSQL migrations, TypeScript, lint, 636 automated tests, all 10 DB-backed journeys, production build/start smoke, and the exact Render deploy contract before merging as `075ff39`.

PR #108's stored billing truth and PR #110's Zumi/Cloudflare privacy hardening passed their exact-head Quality and deploy-contract gates before merging as `76b24e1` and `18175ee` respectively.

PR #111's Grid Marble/map and universal professional-intake corrections passed Prisma generation/validation, all 52 fresh PostgreSQL migrations, TypeScript, lint, 641 automated tests, all 10 DB-backed journeys, production build/start smoke, and the exact Render deploy contract before merging as `d62bc92`.

PR #112's approved Living Home reference lock passed type-check, lint, 643 automated tests, all 10 DB-backed journeys, production build/start smoke, and the exact Render deploy contract before merging as `527110d` alongside the production-environment truth index from PR #113.

PR #114's OpenFreeMap primary Grid mapping release passed exact-head verification and merged as `a111ae4`; the current Stripe candidate is rebased on that map/geolocation work rather than replacing or duplicating it.

## Public / customer entry

| Capability | Status | Notes |
| --- | --- | --- |
| Canonical public brand: Klinikos | **BUILT** | `Clinicos` remains only where legacy compatibility/operational identifiers justify it. |
| Canonical public identity: `https://klinikos.io` | **BUILT** | Product identity is canonical; newest external deployment still requires independent verification. |
| Conversation-first public Living Home | **BUILT IN CURRENT CANDIDATE** | Approved 1402 × 1122 reference composition is implemented with exact production brand/rose assets, continuous multi-turn intent handling, and progressively surfaced destinations. |
| Truthful Living Home progress | **BUILT** | Understanding → Preparing the next move → Ready describes deterministic interface processing, not external completion. |
| Public follow-up context | **BUILT** | Safe prior resolution can inform short follow-ups without introducing authenticated Path IDs. |
| Accessible progress/focus behavior | **BUILT** | Live status is outside the busy region, reduced motion respected, composer remains usable/refocused. |
| Public `/start` clinic path | **BUILT** | Commercial/start path exists without implying unrestricted free production access. |
| Public Grid entry | **BUILT** | Browse, Exchange Field, detail and join/enrollment paths exist. |
| Public Klinikos EDU entry | **BUILT** | EDU remains first-class. |
| Separate patient sign-in | **BUILT** | Patient session remains separate from clinic/staff session. |

## Commercial / payments / activation

Redirect state is never payment evidence.

| Capability | Status | Notes |
| --- | --- | --- |
| Server-owned commercial products/amounts | **BUILT** | Browser cannot choose trusted price. |
| Clinic Operating Analysis `$500` checkout intent | **BUILT** | Product, amount, currency, organization and mode are server-owned before either payment rail opens. |
| Implementation Blueprint `$1,500` / Founding implementation `$8,000+` definitions | **BUILT / PARTIAL** | Product definitions and intake/review boundaries exist; not forced through the `$500` link. |
| GoDaddy checkout launch | **BUILT** | Current configured rail for Clinic Operating Analysis. |
| Stripe-hosted one-time Checkout | **BUILT IN CURRENT CANDIDATE** | Preferred only when both the live key and live signing secret are configured; otherwise the existing GoDaddy path remains active. Dynamic payment methods remain Dashboard-controlled and async completion/failure stays inside the same evidence boundary. |
| Stripe raw-body signature verification | **BUILT IN CURRENT CANDIDATE / PENDING CONNECTION** | Live-only `POST /api/webhooks/stripe` supports synchronous/pending/async Checkout completion, payment failure and refunds; production endpoint registration/signing secret remain external. |
| Stripe amount/currency/tenant/mode correlation | **BUILT IN CURRENT CANDIDATE** | Signed events must match one open opaque server-owned intent and its exact amount, currency, organization, Checkout Session and live/test mode. |
| Stripe failure/refund truth | **BUILT IN CURRENT CANDIDATE** | Failure never becomes paid; full/partial refund evidence is distinct and auditable. Refund recording does not trigger a Grid payout. |
| Browser redirect marks payment paid | **NOT BUILT BY DESIGN** | Redirect never establishes payment evidence. |
| Payment evidence separated from entitlement | **BUILT** | Verification source/state is independent from activation. |
| Manual reconciliation | **MANUAL FALLBACK** | Valid when authorized and evidence is recorded truthfully. |
| Paid clinic activation/provisioning journey | **BUILT** | DB-backed journey covers buyer → evidence → subscription → organization provisioning → first useful entry. |
| Stripe live customer-payment verification | **BUILT / OPERATOR-REPORTED KEY CONFIGURED / PENDING CONNECTION** | Repository evidence path is built in the current candidate; webhook secret, deployed endpoint registration and an intentional live-mode payment are still required before `VERIFIED LIVE`. This is not Stripe Connect settlement or payout proof. |
| Marketplace payout movement | **PENDING CONNECTION** | Internal financial state does not mean external money moved. |
| Customer-funded variable-usage policy | **BUILT** | Included allowance/prepaid/bounded-overage policy exists. |

## Living Home / frontend system

| Capability | Status | Notes |
| --- | --- | --- |
| Authenticated role-aware Living Home | **BUILT** | Goal/next-action briefing rather than module wall. |
| Progressive authenticated navigation | **BUILT** | Deeper areas remain available without dominating immediate work. |
| Backend-vocabulary suppression | **BUILT** | Customer home avoids Path/capability/orchestration jargon. |
| Aegean design foundation | **BUILT** | Shared design tokens/primitives and atmosphere system. |
| Public Living Home appearance-control suppression | **BUILT** | Root conversation owns the screen; atmosphere behavior remains elsewhere. |
| Local Living Home responsive/interaction QA | **BUILT IN CURRENT CANDIDATE** | No horizontal overflow at 390, 768, 1024, 1440 or 1920 pixels; desktop reference geometry, mobile hierarchy, Enter submission and governed Grid resolution were verified in-browser. |
| Full post-deploy desktop/mobile visual QA of newest `main` | **VERIFY EXTERNALLY** | Repository/UI tests are not a substitute for checking the actual deployed browser experience. |

## Patient portal

| Capability | Status | Notes |
| --- | --- | --- |
| Separate patient auth/session | **BUILT** | Patient identity cannot become clinic staff session. |
| Aegean patient sign-in/portal experience | **BUILT** | Converged with Klinikos design without widening access. |
| One `Next for you` priority state | **BUILT** | Patient-owned actionable forms → upcoming appointment → visible balance → all-clear. |
| Staff/provider-owned or submitted form treated as patient action | **NOT BUILT BY DESIGN** | Those states are excluded from `Needs you`. |
| Released clinical records visibility | **BUILT** | All returned released/patient-visible records remain accessible. |
| Portal messages visibility | **BUILT** | All returned approved/inbound messages remain readable without hidden line clamping. |
| Patient privacy/release copy | **BUILT** | Wording distinguishes patient-bound operational data from explicit clinical release gates. |

## Grid discovery and exchange

| Capability | Status | Notes |
| --- | --- | --- |
| Generalized Grid resource/transaction model | **BUILT** | Demand/resource/offer/reservation/financial/fulfillment/trust primitives exist. |
| Universal I NEED / I HAVE Exchange Field | **BUILT** | Deterministic routing across work, provider, space, product, equipment, service, network, education, organization and referral lanes. |
| Manual direction override | **BUILT** | Explicit need/offer selection survives subsequent typing. |
| All-term public discovery | **BUILT** | Meaningful query terms are applied rather than only the first token. |
| State name/code matching | **BUILT** | Public discovery can match e.g. California ↔ CA. |
| Query-matched map/resource-ledger consistency | **BUILT** | Universal-resource map and ledger receive the same filtered result set. |
| Public provider/location/resource browse | **BUILT / PARTIAL** | Real reviewed/published inventory only; supply density depends on actual participants. |
| Public professional enrollment | **BUILT / PARTIAL** | The existing credential-aware path accepts future healthcare role and credential labels into pending human review without a nurse-only allow-list; the controlled pilot still requires an approved network/organization code. |
| Public space/seller/service enrollment | **BUILT** | Space, organization capacity, permitted product, equipment, business-service, education, and referral lanes create a participant account plus a governed pending-review resource through the shared universal resource engine. |
| Grid Marble map/enrollment contrast | **BUILT IN CURRENT CANDIDATE** | Geographic discovery and public enrollment remain intentionally light and restore scoped ink, forms, ledgers, borders, and accents inside the global Obsidian shell. |
| Truthful provider-listing request action | **BUILT** | Generic request is labeled generic when selected listing is not yet bound into the transaction workflow. |
| Same-origin sign-in continuation | **BUILT** | External redirect targets are not trusted. |
| Explicit opt-in browser geolocation | **BUILT** | Location is requested only after visitor action. |
| Keyless OpenStreetMap fallback | **BUILT** | Interactive map context works without Google credentials. |
| Optional Google map-provider path | **ADAPTER READY** | Requires actual key/map ID/configuration to claim connected. |
| Exact coordinate-radius matching | **BUILT** | Real Haversine distance; radius is authoritative when a real origin/radius exists, including across state boundaries. |
| Public distance-radius map filtering | **BUILT** | After explicit browser location permission, mapped pins and the adjacent result ledger share the same 5/10/25/50/100-mile or any-distance set; unpinned inventory is excluded rather than assigned fake distance. |
| Coordinate integrity constraints | **BUILT** | Database rejects half-null/out-of-range coordinate pairs. |
| Public coordinate minimization | **BUILT** | Public precision reduced; governed server-side matching retains stored values. |
| Fake nearby inventory | **NOT BUILT BY DESIGN** | Empty market remains empty/truthful. |
| Structured weekday/time interpretation into availability filters | **NOT BUILT** | Free-text handling exists; deterministic weekday initialization is a named next convergence target. |
| Pin/ledger selected-result synchronization | **BUILT** | Result selection centers the map; connected Google markers focus the matching ledger row; the selected resource ID continues through sign-in into the governed request. |
| Manual city/ZIP/place origin + richer Search-this-area behavior | **PARTIALLY BUILT** | City/state discovery exists; complete map-origin UX remains future convergence. |

## Grid transaction / trust

| Capability | Status | Notes |
| --- | --- | --- |
| Demand → offer → accept → reservation | **BUILT** | DB-backed journey verified. |
| Scarce-capacity concurrency protection | **BUILT** | One winner; no partial loser state. |
| Financial obligations in integer cents | **BUILT** | Server-owned internal financial state. |
| Fulfillment event lifecycle | **BUILT** | Internal evidence/state path exists. |
| Dispute vs safety incident separation | **BUILT** | Separate problem types and governed holds/resolution. |
| External provider-license verification | **PENDING CONNECTION** | Requires real authority/vendor access. |
| External malpractice verification | **PENDING CONNECTION** | Internal review is not external verification. |
| CMS NPPES public NPI/taxonomy evidence | **BUILT** | Authenticated credentialing users can run a bounded, time-limited public lookup; result evidence never establishes licensure, malpractice, privileges, or Grid eligibility. |
| HHS OIG LEIE exact-NPI pre-screen | **BUILT** | Authenticated credentialing users can run a size-bounded, cached public dataset screen with source freshness and audit evidence; no-candidate results are not exclusion clearance. |
| External marketplace payout settlement | **PENDING CONNECTION** | Internal ledger must not be represented as money moved. |

## Klinikos EDU

| Capability | Status | Notes |
| --- | --- | --- |
| EDU foundation/data model | **BUILT** | Core models/migration exist. |
| Public EDU entry | **BUILT** | First-class public/authenticated surface. |
| Synthetic safety/data boundaries | **BUILT** | Student projections exclude answer-key/private instructor material. |
| Student scenario console | **BUILT** | Start, actions/evidence, hand-in. |
| Submission lifecycle | **BUILT** | Ownership/lateness/evidence rules. |
| Grading/release API | **BUILT** | Student cannot release own grade; unreleased grade remains hidden. |
| Instructor grading UI | **PARTIALLY BUILT** | Server path stronger than full operator UX. |
| Competency/certificate write path | **NOT BUILT** | Direction/models exist. |
| EDU AI | **ADAPTER READY** | Requires governed/approved intelligence path. |
| LTI / institutional SSO | **PENDING CONNECTION** | Requires institution credentials/agreement. |
| FERPA institutional/legal review | **BLOCKED** | External legal/institutional condition, not solved by repository code. |

## Klinikos Intelligence / Zumi

| Capability | Status | Notes |
| --- | --- | --- |
| Provider-neutral governed gateway | **BUILT** | Admission/provider abstraction exists. |
| Tenant/RBAC/entitlement admission | **BUILT** | AI cannot widen access. |
| Prohibited-capability policy | **BUILT** | Deterministic refusal before provider use where applicable. |
| PHI/sensitive redaction before planner/router/memory/tool/provider consumption | **BUILT** | Regression coverage enforces ordering. |
| Signed conversation continuity | **BUILT** | Bound to server-side identity/context. |
| Founder conversation profile | **BUILT / PARTIAL** | Broader authorized context without bypassing policy. |
| Direct/research/deeper reasoning routing | **BUILT / PARTIAL** | Architecture exists; real quality depends on connected provider/tools. |
| Prompt-injection/tool-exfiltration boundaries | **BUILT / PARTIAL** | Core controls exist; adversarial testing remains ongoing work. |
| Usage/audit ledger | **BUILT** | Provider/usage paths are recorded without using raw prompt/output as the billing ledger. |
| Production general model provider | **PENDING CONNECTION** | Exact environment/provider/contract/config must be verified. |
| PHI-capable external model use | **BLOCKED until approved** | Requires exact provider approval, BAA/contract, config and deployment approval. |
| Streaming UX | **NOT BUILT** | |
| Formal reasoning-quality eval harness | **NOT BUILT** | Safety/structure tests do not prove answer quality. |

## Clinic OS / operations

| Capability | Status | Notes |
| --- | --- | --- |
| Staff auth/sessions/RBAC/tenant scope | **BUILT** | Core authorization contract exists. |
| Patients / appointments / encounters | **BUILT / PARTIAL** | Real PostgreSQL-backed workflows; specialty breadth continues. |
| Documents / forms / e-sign | **BUILT / PARTIAL** | Internal governed lifecycle exists. |
| Labs / imaging / medications | **BUILT / PARTIAL** | Internal lifecycle/readiness exists; external rails are not implied live. |
| Tasks / operational actions / follow-up | **BUILT** | DB-backed risk → work → resolution/audit journey. |
| Referrals / Network handoffs | **BUILT / PARTIAL** | Governed internal lifecycle; external delivery varies by verified connector/fallback. |
| Revenue/coding/claim readiness | **BUILT / PARTIAL** | Preparation/readiness exists; no autonomous clearinghouse-submission claim. |
| No-fault / workers’ comp case workflows | **BUILT / PARTIAL** | Internal case/packet/readiness; external carrier/legal delivery separate. |
| Production external clinical connections | **PENDING CONNECTION** | Labs, clearinghouse, payer, eRx/EPCS and similar rails require exact vendor approval/credentials. |
| Certified EHR claim | **NOT BUILT BY DESIGN** | Repository does not establish certification. |

## Network

| Capability | Status | Notes |
| --- | --- | --- |
| Partner directory/relationships | **BUILT** | Relationship-aware internal model. |
| Governed handoff lifecycle | **BUILT** | Consent, purpose, minimum necessary and human decision boundaries. |
| In-product authorized recipient delivery | **BUILT** | Means visibility inside authorized Klinikos workspace only. |
| Fax / Direct / external exchange | **MANUAL FALLBACK / PENDING CONNECTION** | Do not claim vendor delivery without evidence. |
| Cross-tenant isolation | **BUILT** | Adversarial journey coverage. |

## Deployment / reliability

| Capability | Status | Notes |
| --- | --- | --- |
| Fresh empty-DB migration gate | **BUILT** | Current candidate contains 53 additive migrations; exact-head CI must apply all 53 to fresh PostgreSQL before merge. |
| Repository Node pin | **BUILT** | `.node-version` resolves CI/runtime contract to Node 20.19.4. |
| Render build contract | **BUILT** | `npm ci --include=dev --ignore-scripts && npm run render:build`. |
| Runtime start contract | **BUILT** | `npm start`; no build/migrations every wake. |
| Missing `.next` preflight | **BUILT** | Startup fails with actionable contract message. |
| Exact deploy-contract CI | **BUILT** | Production install/build/start path runs before merge. |
| External production service health | **VERIFIED LIVE — DEMO MODE** | On 2026-08-16, `www.klinikos.io/api/health` and `zumi.onrender.com/api/health` returned HTTP 200. Payload reported `mode: demo`, `databaseConfigured: true`, `liveIntegrations: false`. |
| Exact deployed commit equals newest `main` | **VERIFY EXTERNALLY** | Health does not expose a deploy SHA; repository/GitHub success is not proof Render is serving the same commit. |

## External infrastructure truth

| Capability | Status | Notes |
| --- | --- | --- |
| Production database migrations after Aug 12 incident | **RECOVERED** | Failed Grid migration record was rolled back and corrected migration subsequently applied. |
| Neon HIPAA project mode | **NOT VERIFIED AS ENABLED** | Last infrastructure inspection reported `hipaa: false`; do not infer legal compliance from code. |
| Production service availability | **VERIFIED LIVE — DEMO MODE** | Domain and Render health returned HTTP 200 on 2026-08-16. |
| Production app exact latest release | **VERIFY EXTERNALLY** | No deployment SHA was exposed by the health contract. |

## Claims Klinikos does not make

The repository alone does **not** prove:

- certified EHR status;
- HIPAA compliance as a legal/compliance program;
- live lab/clearinghouse/payer/eRx/fax/email/voice/credential/payment/payout connections without production evidence;
- external provider license or malpractice verification without a real authority/vendor response;
- payment because a browser returned from checkout;
- payout because a Grid ledger entry exists;
- marketplace endorsement merely because a listing is published;
- AI authority to diagnose, prescribe, release records, approve credentials, bypass consent or widen authorization.

See `docs/EXTERNAL_DEPENDENCY_MATRIX.md`, `docs/MVP_JOURNEYS.md`, `docs/SOURCE_OF_TRUTH.md`, and the current specialist specifications for deeper truth.
