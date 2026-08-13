# Klinikos feature status

This file is the implementation-truth index. If something is labelled **BUILT** here and the corresponding path does not actually work, the defect is in both the product and this document.

Last verified application baseline: `main` at `0299240e71d81cab9c885f4225925b1173fc8058` after PR #66.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| **BUILT** | Implemented and verified against real internal state. |
| **PARTIALLY BUILT** | A useful path works; named gaps remain. |
| **MANUAL FALLBACK** | The workflow is real, but a human performs the external step. |
| **ADAPTER READY** | Internal interface/safety/failure behavior exists; external production connection is not verified. |
| **PENDING CONNECTION** | Code may be ready, but credentials, vendor enrollment, contract, BAA, or production approval is missing. |
| **BLOCKED** | Cannot truthfully proceed until an external dependency is resolved. |
| **NOT BUILT** | Does not exist yet. |

## Verification baseline

The exact PR #66 candidate passed:

| Check | Result |
| --- | --- |
| Prisma schema validation | Green |
| Prisma client generation | Green |
| Fresh PostgreSQL migrations | 50/50 applied successfully |
| TypeScript | Green |
| ESLint | Green |
| Unit/integration test suite | 547 tests across 71 files, all passing |
| DB-backed MVP journeys | 10/10 passing |
| Production Next.js build | Green |
| Production startup smoke | Green |
| Exact Render deploy-contract | Green |

Repository checks prove the candidate tree. They do not alone prove the newest commit has completed deployment on the external production host.

## Public / commercial entry

| Capability | Status | Notes |
| --- | --- | --- |
| Canonical public brand: Klinikos | **BUILT** | `Clinicos` remains only in legacy repository/migration/compatibility identifiers. |
| Canonical public identity: `https://klinikos.io` | **BUILT** | Render hostname is infrastructure only. External deployment must still be verified independently. |
| Outcome-first public landing | **BUILT** | Editorial/spacious structure; backend architecture is not dumped on visitors. |
| Public `/start` routing | **BUILT** | Evaluation/access language no longer pretends there is an unrestricted free production account. |
| Public Grid entry | **BUILT** | Browse/join paths exist. |
| Public Klinikos EDU entry | **BUILT** | EDU is exposed as a first-class product surface. |
| Clinic Operating Analysis checkout launch | **BUILT** | Server-owned $500 intent is created before the configured GoDaddy paylink opens. |
| $1,500 / $8,000+ flexible commercial flows | **PARTIALLY BUILT** | Product definitions and intake/review boundaries exist; they are not incorrectly routed through the $500 paylink. |
| Browser redirect marks payment paid | **NOT BUILT BY DESIGN** | Redirect state is never payment evidence. |

## Payments, activation, and access

| Capability | Status | Notes |
| --- | --- | --- |
| Server-owned commercial product and amount | **BUILT** | Browser cannot choose the trusted price. |
| Checkout intent ledger | **BUILT** | Intent precedes external checkout. |
| Payment evidence separated from entitlement | **BUILT** | Verification source is recorded independently of activation. |
| GoDaddy paylink launch | **BUILT** | Current checkout rail for Clinic Operating Analysis. |
| Manual payment reconciliation | **MANUAL FALLBACK** | Authorized reconciliation is valid when evidence is recorded truthfully. |
| Paid clinic activation/provisioning journey | **BUILT** | Automated DB-backed journey covers buyer → payment evidence → subscription → organization provisioning → first useful entry. |
| Stripe direct settlement | **ADAPTER READY** | Environment/config surfaces exist; not the current verified rail. |
| Marketplace payouts | **PENDING CONNECTION** | Requires a real payout rail/credentials/terms; internal ledger state must not be presented as money moved. |
| Customer-funded variable usage policy | **BUILT** | Product/commercial policy exists for included allowance, prepaid funds, or bounded authorized overage. |

## Living Home and frontend system

| Capability | Status | Notes |
| --- | --- | --- |
| Role-aware Living Home | **BUILT** | Goal-first entry with plain next-step language. |
| Progressive authenticated navigation | **BUILT** | Immediate work is visible; deeper product areas collapse until needed. |
| Backend vocabulary suppression | **BUILT** | Home avoids exposing Path/capability/orchestration jargon as customer language. |
| Aegean atmosphere system | **BUILT** | Auto follows browser-local Dawn/Day/Golden/Night; manual preference persists locally. |
| Appearance changes permissions/product behavior | **NOT BUILT BY DESIGN** | Presentation only. |
| Full browser/mobile production visual QA | **PARTIALLY BUILT** | Responsive implementation exists; independent post-deploy visual verification remains an operating gate after each major release. |

## Grid

| Capability | Status | Notes |
| --- | --- | --- |
| Generalized resource model | **BUILT** | Universal resource/demand/offer/reservation/financial primitives exist. |
| Public marketplace discovery | **BUILT** | Browse/detail/filter paths exist. |
| Public map can center on visitor location | **BUILT** | Requires browser permission. |
| Fake nearby inventory to populate empty map | **NOT BUILT BY DESIGN** | Empty market remains truthful. |
| Professional/provider participation | **BUILT / PARTIAL** | Core enrollment, profile, availability, internal review, offers and transactions exist; some role-specific onboarding paths remain incomplete. |
| Spaces / rooms / chairs | **BUILT / PARTIAL** | Resource model and marketplace representation exist; production supply depends on real published inventory. |
| Services / other resource classes | **BUILT / PARTIAL** | Generalized backend supports broader classes; not every specialized UX is complete. |
| Offer → accept → reservation | **BUILT** | DB-backed journey verified. |
| Concurrency protection | **BUILT** | Competing reservations leave one winner and no partial loser state. |
| Disputes / safety incidents / holds | **BUILT** | Separate trust/problem records and governed resolution states exist. |
| Integer-cent financial obligations | **BUILT** | Financial state is deterministic and server-owned. |
| Provider license verification against external authorities | **PENDING CONNECTION** | Requires board/vendor access. |
| Malpractice verification against external source | **PENDING CONNECTION** | Internal review is not external verification. |
| Marketplace payout movement | **PENDING CONNECTION** | Internal financial state does not claim funds moved. |
| Maps/geocoding/routing vendor | **ADAPTER READY** | Public/client boundaries exist; production key/vendor configuration remains external. |

## Klinikos EDU

| Capability | Status | Notes |
| --- | --- | --- |
| EDU foundation/data model | **BUILT** | Migration and core models exist. |
| Public EDU landing/entry | **BUILT** | First-class path in public and authenticated experience. |
| Synthetic-data/safety boundaries | **BUILT** | Student projections exclude answer-key/private instructor fields. |
| Student scenario run console | **BUILT** | Start, actions/evidence, hand-in. |
| Submission lifecycle | **BUILT** | Ownership/lateness/evidence behavior enforced. |
| Grading API and release rules | **BUILT** | Student cannot write/release grades; unreleased grade stays hidden. |
| Instructor grading UI | **PARTIALLY BUILT** | Server path works; full instructor UX remains incomplete. |
| Competency/certificate write path | **NOT BUILT** | Models/direction exist. |
| EDU AI | **ADAPTER READY** | Inert until governed Zumi provider path is available for the approved use. |
| LTI 1.3 / institutional SSO | **PENDING CONNECTION** | Needs school credentials/agreement. |
| FERPA institutional/legal review | **BLOCKED** | Outside repository code. |

## Zumi / Klinikos Intelligence

| Capability | Status | Notes |
| --- | --- | --- |
| Provider-neutral gateway | **BUILT** | Governed admission and provider abstraction exist. |
| Prohibited capability policy | **BUILT** | Deterministic refusal before provider use. |
| Tenant/RBAC/entitlement admission | **BUILT** | AI cannot widen access. |
| PHI/sensitive egress redaction before planner/router/provider consumption | **BUILT** | Regression coverage enforces the ordering. |
| Signed conversation continuity | **BUILT** | Bound to server-side identity/context. |
| Founder conversation profile | **BUILT / PARTIAL** | Broader authorized product context without bypassing data/action policy. |
| Direct / research / deeper reasoning classification | **BUILT / PARTIAL** | Routing architecture exists; quality depends on connected provider/tool capability. |
| Prompt-injection/tool-exfiltration boundaries | **BUILT / PARTIAL** | Core controls exist; ongoing adversarial testing remains required. |
| Usage/audit ledger | **BUILT** | Provider/usage paths are recorded without storing raw prompt/output as the ledger payload. |
| Production model provider for general Zumi use | **PENDING CONNECTION** | Exact live provider/config/contract status must be verified per environment. |
| PHI-capable model use | **BLOCKED until approved** | Requires exact provider approval, contract/BAA, configuration, and explicit deployment approval. |
| Streaming UX | **NOT BUILT** | |
| Live provider health probing | **PARTIALLY BUILT** | Health-state concepts exist; complete production probing/observability is not universal. |
| Formal reasoning-quality evaluation harness | **NOT BUILT** | Structural/safety tests are not a substitute for answer-quality evals. |

## Clinic OS / operations

| Capability | Status | Notes |
| --- | --- | --- |
| Auth, sessions, RBAC, tenant-scoped staff work | **BUILT** | Core authorization contract exists. |
| Patients / appointments / encounters | **BUILT / PARTIAL** | Real PostgreSQL-backed paths exist; broader specialty workflows continue expanding. |
| Documents / forms / labs / imaging / medications | **BUILT / PARTIAL** | Internal workflows and manual fallbacks exist; external rails are not implied live. |
| Tasks / operational actions / follow-up | **BUILT** | DB-backed operations journey verifies risk → work → resolution and audit. |
| Referrals / Network handoffs | **BUILT / PARTIAL** | Governed internal lifecycle exists; external delivery varies by connector/fallback. |
| Revenue/coding/claim readiness | **BUILT / PARTIAL** | Preparation/readiness logic exists; no autonomous clearinghouse submission claim. |
| No-fault / workers' comp case workflows | **BUILT / PARTIAL** | Internal cases/packets/readiness; external carrier/legal delivery remains separate. |
| Patient portal | **BUILT / PARTIAL** | Scoped portal auth/read experience exists; production activation remains deployment-dependent. |
| Production external clinical connections | **PENDING CONNECTION** | Labs, clearinghouse, payer, eRx/EPCS, etc. require exact vendor approval and credentials. |

## Network

| Capability | Status | Notes |
| --- | --- | --- |
| Partner directory/relationships | **BUILT** | Relationship-aware internal model. |
| Governed handoff composer/lifecycle | **BUILT** | Consent, purpose, minimum-necessary and human decision boundaries. |
| Connected in-product recipient delivery | **BUILT** | Means visibility inside the authorized Klinikos recipient workspace only. |
| Fax / Direct / external exchange | **MANUAL FALLBACK / PENDING CONNECTION** | Status must not claim vendor delivery without evidence. |
| Cross-tenant isolation | **BUILT** | Adversarial journey coverage. |

## Deployment and reliability

| Capability | Status | Notes |
| --- | --- | --- |
| Fresh empty-DB migration journey | **BUILT** | All 50 migrations verified in CI. |
| Render production build contract in repo | **BUILT** | `npm ci --include=dev --ignore-scripts && npm run render:build`. |
| Runtime start contract | **BUILT** | `npm start`; no build/migration on every wake. |
| Missing `.next` preflight | **BUILT** | Startup fails with an actionable deployment-contract error rather than opaque Next crash. |
| Exact deploy-contract CI job | **BUILT** | Install/build/start contract runs before merge. |
| External production deployment of latest main | **VERIFY EXTERNALLY** | Never inferred from repository green alone. |

## Claims Klinikos does not make

None of the following may be inferred merely from the repository:

- Klinikos is a certified EHR.
- Klinikos is HIPAA compliant by virtue of code alone.
- A lab, clearinghouse, eligibility, payer, e-prescribing, credentialing, payment, fax, email, voice, or other external integration is live without verified production evidence.
- A provider license or malpractice policy is externally verified unless a real authority/vendor response established that fact.
- A browser redirect verifies payment.
- A Grid ledger entry means money moved.
- A marketplace listing is a Klinikos endorsement.
- AI may diagnose, prescribe, release records, approve credentials, bypass consent, or widen authorization.

See `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external gates and `docs/MVP_JOURNEYS.md` for end-to-end proof contracts.
