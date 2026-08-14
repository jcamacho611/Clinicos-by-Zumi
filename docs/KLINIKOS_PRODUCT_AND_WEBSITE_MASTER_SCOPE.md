# Klinikos Product and Website Master Scope

Date: 2026-08-13  
Status: `AUTHORITATIVE SPECIALIST SCOPE`  
Repository baseline inspected: `main@a8821523d60f11ad863572df5493d84a6a944410`

This document organizes the complete current Klinikos product and website scope into one navigable plan. It inherits `docs/SOURCE_OF_TRUTH.md`. When implementation status is in question, the repository and `docs/FEATURE_STATUS.md` govern. This document governs how the pieces should form one product experience.

## Product definition

**Klinikos is a living healthcare operating ecosystem.**

A person states a goal. Klinikos Intelligence understands the request within permitted context. Klinikos assembles a safe, resumable Path across Clinic OS, Grid, Network, EDU, commercial activation, and shared platform engines. Users should not have to understand the module graph.

Klinikos is not reducible to an EHR, CRM, medical-spa app, staffing marketplace, job board, chatbot, or course platform. Those are compositions inside the ecosystem.

The public product and company name is **Klinikos**. **Zumi** is Klinikos Intelligence inside Klinikos. `Clinicos` remains only where legacy compatibility makes renaming unsafe.

## North-star experience

The customer experience follows:

`IDENTITY → INTENT → PERMISSION-AWARE CONTEXT → SAFE NEXT ACTION → VISIBLE PROGRESS → RESULT → CONTINUE`

The primary prompt is “What needs to happen?” Klinikos may present three plain-language states:

- **Ask** — begin or refine a goal.
- **Continue** — resume an active Path.
- **Moving** — see work already underway, completed, or blocked.

“Path,” engines, registries, state machines, and entitlement internals are architecture language. Ordinary users see goals, actions, progress, evidence, blockers, and outcomes.

## Experience law

- Whitespace-led, editorial, calm, premium, and fast.
- Modern Aegean influence through light, stone, sea, geometry, rhythm, and courtyard-like space—not tourist motifs.
- Living Home is an adaptive operational briefing, not a generic dashboard.
- Cards are supporting containers, not the default information architecture.
- Prefer timelines, queues, split panes, maps, calendars, tables, ledgers, and focused drawers according to the work.
- One meaningful question or decision at a time.
- Role-aware discovery and navigation; discoverability never widens access.
- Mobile is task-first. Map is optional; list and action remain complete.
- Status comes from evidence. No fake integrations, demand, availability, automation, metrics, price, or urgency.
- Motion explains state change and honors reduced-motion preference.
- Every important flow is resumable, accessible, and operable without a mouse.

## Website and product information architecture

Current routes are implementation anchors, not permanent navigation labels.

| Surface | Current anchors | Audience | Responsibility | Primary outcome |
| --- | --- | --- | --- | --- |
| Public Home | `/` | All visitors | Explain Klinikos in plain language; reveal Clinic, Grid, EDU, Network/intelligence outcomes without dumping modules. | Choose a relevant door or state a goal. |
| Story and trust | `/about`, `/capabilities` | Buyers, participants, partners | Explain why Klinikos exists, what it coordinates, truthful status, safety boundaries, and differentiation. | Build enough understanding to continue. |
| Qualification and sales | `/start`, `/sales`, `/founding-clinic`, `/private-demo`, `/demo` | Clinic owners and partners | Qualify intent, set expectations, capture operational context, schedule/continue a reviewed commercial path. | Begin a real evaluation or implementation conversation. |
| Pricing and activation | `/pricing`, `/activate`, `/access` | Buyers and invited users | Explain purchase, immediate outcome, implementation, recurring access, usage, and current payment/activation truth. | Create a server-owned commercial intent or activate from verified evidence. |
| Identity and portal entry | `/login`, `/portal`, `/portal/login` | Staff, providers, patients, learners | Authenticate and route to the correct organization and role without exposing tenancy internals. | Enter the correct permitted workspace. |
| Public Grid | `/grid`, `/grid/browse`, `/grid/browse/[listingId]`, `/grid/join`, `/grid/join/location`, `/grid/join/seller`, `/grid/pricing`, `/grid/resources/browse` | Demand and supply participants | Understand Grid, discover governed resources, inspect evidence/economics, and begin enrollment or a transaction. | Find, offer, join, or continue. |
| Public EDU | `/edu` | Students, educators, institutions, clinics | Explain virtual-clinic learning, evidence, competency direction, and placement/readiness relationships. | Enter learning or begin institutional interest. |
| Living Home | `/dashboard` | Authenticated users | Adaptive briefing: what needs attention, what Klinikos handled, what is next, and where to continue. | Complete the next useful action. |
| Clinic OS | `/patients`, `/appointments`, `/encounters`, `/cases`, `/front-desk`, `/provider`, revenue/referral/document/form/lab/imaging/medication/task surfaces | Clinic owners, staff, providers | Run patient, schedule, encounter, clinical-support, document, revenue, and operational workflows within role and scope. | Deliver and operate care truthfully. |
| Authenticated Grid | `/grid/workspace`, `/grid/opportunities`, `/grid/availability`, `/grid/locations`, `/grid/providers`, `/grid/services`, `/grid/requests`, `/grid/payouts`, `/grid/transactions`, `/grid/trust`, resource, need, match, offer, and handoff routes | Buyers, sellers, providers, organizations | Manage readiness, supply, demand, offers, reservations, fulfillment, obligations, and problems. | Complete a governed exchange. |
| Network | `/network/directory`, `/network/map`, `/network/handoffs` and related capacity/referral surfaces | Organizations and authorized participants | Manage relationships, capacity, referrals, handoffs, minimum-necessary exchange, and fallback status. | Complete a governed connection or handoff. |
| Authenticated EDU | `/edu/dashboard`, `/edu/courses`, `/edu/cohorts`, `/edu/scenarios`, `/edu/lab/[assignmentId]`, `/edu/grading`, `/edu/competencies`, `/edu/settings` | Students, educators, institutions, preceptors | Deliver synthetic virtual-clinic learning, submission, grading, cohort, evidence, and readiness workflows. | Produce or review learning evidence. |
| Klinikos Intelligence | Living Home and contextual assistance surfaces; governed APIs/tools | Every permitted role | Interpret goals, retrieve authorized context, research when allowed, propose next actions, draft, cross-check, and explain. | Reduce work without becoming the source of clinical, security, financial, or credential truth. |
| Patient experience | Portal and patient-facing records/action surfaces | Patients and authorized delegates | Provide minimum-necessary access to appointments, documents, forms, messages/actions, and released information. | Understand and complete the next patient action. |
| Operator and admin | `/admin/commercial`, `/admin/grid`, `/admin/grid/finance`, `/admin/grid/resources`, `/admin/grid/trust`, `/admin/network`, `/admin/edu`, `/admin/readiness`, `/admin/sales`, `/admin/sales/audit` | Authorized operators | Review, reconcile, configure, approve, hold, investigate, recover, and audit. | Keep automation truthful and recoverable. |
| Legal, privacy, status, and support | Public/footer/support and policy surfaces | All audiences | Explain terms, privacy, security posture, limitations, external dependency truth, contact, and incident/support paths. | Let users make an informed, supported decision. |

## Audience workspaces

| Role | Living Home should prioritize | Must not expose by default |
| --- | --- | --- |
| Clinic owner/operator | capacity, revenue exceptions, staffing/resource needs, activation, implementation, risk, coming decisions | raw engine/configuration internals |
| Front desk/operations | today’s schedule, readiness, callbacks/tasks, missing items, handoffs, next patient action | irrelevant executive/admin controls |
| Provider/clinician | assigned schedule, patient/encounter preparation, results/tasks, availability, relevant Grid work | other providers’ scoped work or unsupported AI authority |
| Grid buyer | active needs, qualified results, offers, reservations, fulfillment, spend/obligations, incidents | private seller evidence beyond minimum necessary |
| Grid provider/seller | readiness gaps, availability, listings, opportunities, offers, work, fulfillment evidence, earnings/obligations | buyer-protected data not needed for the transaction |
| Patient/delegate | appointments, forms, released information, instructions, requested actions, support | internal clinical notes or organization data without authorization |
| Student | assigned course/scenario, due work, feedback, competency evidence, placement/readiness direction | real patient data |
| Educator/preceptor | cohort progress, grading queue, evidence, exceptions, release decisions | unrelated clinic/participant data |
| Platform operator | holds, failed automation, review queues, reconciliation, external connection health, audit | no bypass of customer consent, tenant, or role policy |

## Shared platform engines

The website and applications compose a common foundation:

1. identity, sessions, organizations, memberships, and role routing;
2. authorization, policy, consent, delegation, and minimum necessary;
3. events, audit, provenance, evidence, and status;
4. documents/object storage and controlled release;
5. search, discovery, indexing, and location context;
6. workflows, tasks, queues, notifications, retries, holds, and recovery;
7. Grid resources, demand, eligibility, matching, offers, reservations, fulfillment, incidents, and reputation;
8. financial intents, obligations, evidence, subscriptions, entitlements, reconciliation, and usage funding;
9. communications and connector runtime;
10. Klinikos Intelligence gateway, model routing, retrieval, research, tools, redaction, cost, and human review;
11. analytics and operational intelligence downstream of source truth;
12. configuration, feature entitlements, observability, reliability, and security governance.

A domain may create specialized views. It should not create a second identity, payment truth, credential truth, or audit universe.

## Complete core journeys

### Clinic purchase and activation

`OUTCOME/Pricing → SERVER-OWNED OFFER/INTENT → EXTERNAL PAYMENT ATTEMPT → VERIFIED EVIDENCE → ENTITLEMENT → ORGANIZATION PROVISIONING → OWNER IDENTITY → RESUMABLE ONBOARDING → LIVING HOME`

The user must always know what was purchased, what happens now, who performs implementation, what repeats, and what remains blocked.

### Daily clinic operation

`LIVING HOME → PRIORITY/GOAL → AUTHORIZED PATIENT OR OPERATIONAL CONTEXT → ACTION → EVENT → FOLLOW-UP/EXCEPTION → AUDIT → CONTINUE`

### Grid demand

`INTENT → INTERPRETED CONSTRAINTS → PERMITTED SUPPLY → HARD ELIGIBILITY → EXPLAINED RANKING → DOSSIER → OFFER/APPLICATION → RESERVATION → OBLIGATION/FUNDING → FULFILLMENT → EVIDENCE → CLOSE/DISPUTE`

### Grid supply

`IDENTITY/ORGANIZATION → RESOURCE TYPE → READINESS → EVIDENCE → AVAILABILITY/LOCATION/ECONOMICS → REVIEW → PUBLISH → RESPOND → FULFILL → EVIDENCE/REPUTATION`

### Network handoff

`RELATIONSHIP → PURPOSE/CONSENT → MINIMUM-NECESSARY PACKAGE → RECIPIENT/DELIVERY METHOD → ACCEPT/DECLINE/FAIL → RECOVERY → AUDIT`

### EDU learning

`COURSE/COHORT → SYNTHETIC SCENARIO → LEARNER ACTION → SUBMISSION/EVIDENCE → GRADING/FEEDBACK → COMPETENCY/READINESS → RELEASE/CONTINUE`

### Governed intelligence

`QUESTION/GOAL → REDACTION/PERMISSION → AUTHORIZED CONTEXT → UNKNOWN IDENTIFICATION → TOOL/RESEARCH PLAN → EVIDENCE → CROSS-CHECK → HUMAN REVIEW WHEN REQUIRED → ANSWER/ACTION DRAFT → AUDIT`

## Product-surface requirements

### Living Home

Living Home is the heart of Klinikos. It should contain only what is useful now:

- a human greeting and current operational state;
- exceptions and decisions needing attention;
- what Klinikos already handled;
- what is coming up;
- one clear Continue path;
- contextual capacity, revenue, Grid, Network, or EDU information when relevant;
- a goal field that can begin a new Path.

It must not become a tile directory, feature registry, architecture tour, or dense KPI wall.

### Clinic OS

MVP clinic operations must preserve deterministic tenant and patient truth across patients, appointments, encounters, tasks, documents/forms, results, cases/referrals, and revenue actions. Automation may prepare or route work. Consequential clinical actions require the correct human authority and evidence.

### Grid

Grid is the governed exchange layer, not a job board. Its web experience must converge on the Exchange Field defined in `docs/MARKETPLACE_DESIGN_RESEARCH.md` and the geolocation/MVP contract in `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`.

### Network

Network should make relationships and handoffs legible. A directory, map, capacity signal, or referral is not proof of external delivery. Connected, prepared, queued, accepted, delivered, failed, and recovered remain distinct.

### EDU

EDU’s current foundation is courses, cohorts, synthetic scenarios, submissions, grading, and competency direction. Real patient data must never enter learner scenarios. LTI, institutional SSO, FERPA operating program, credential issuance, and production placements remain separate status claims until built and approved.

### Klinikos Intelligence

Zumi is contextual and quiet. It may interpret, retrieve, research, draft, coordinate, challenge, and explain. It cannot create authentication, role, consent, credential, clinical authority, payment, settlement, or record-release truth.

## Data, privacy, and security boundaries

- Server-side identity, tenant, role, resource, and relationship checks own access.
- Browser navigation and hidden UI are not authorization.
- PHI redaction occurs before any unapproved planner, router, memory, model, tool, or provider consumer.
- Public marketplace records contain only deliberately published fields.
- Exact visitor location is not persisted by default.
- Provider residential location is private by default; expose service area or approved practice location.
- Patient data does not become Grid, EDU, analytics, or AI context without explicit purpose, permission, and minimum-necessary controls.
- Uploaded documents, web content, connector responses, and model output are untrusted input.
- Every external action has a prepared/attempted/accepted/delivered-or-failed evidence chain.
- Retention, archive, export, legal hold, anonymization, and deletion are deliberate policy—not cascade convenience.

## Commercial scope

The current clinic anchors remain server-owned in `src/lib/commercial/klinikos-commercial.ts`:

| Offer | Anchor | Immediate truthful outcome |
| --- | --- | --- |
| Clinic Operating Analysis | $500 one time | A server-owned analysis checkout intent and, after verified payment, the defined analysis delivery path. |
| Implementation Blueprint | $1,500 one time | Reviewed implementation-planning scope; not silently routed through the $500 link. |
| Founding Clinic Implementation | from $8,000 | Qualification and scoped implementation, not instant generic SaaS activation. |
| Klinikos Core | $995/mo | Recurring access according to verified entitlement and implementation state. |
| Klinikos Growth | $1,995/mo | Same truth boundaries with the server-owned Growth definition. |
| Klinikos Scale | $3,995/mo | Same truth boundaries with the server-owned Scale definition. |
| Enterprise | Custom | Reviewed scope, dependencies, and commercial terms. |

Maps, AI, messaging, voice, verification, and other variable-cost services require allowance, prepaid funding, or bounded authorized overage. Pricing copy must distinguish setup, recurring access, included usage, connectors, and externally charged services.

## Current truth versus next MVP

The repository already contains substantial models, routes, services, workflows, tests, and truthful fallbacks. The next MVP is **experience and operational convergence**, not a rewrite.

| Area | Current truth | MVP convergence target |
| --- | --- | --- |
| Public site | Major product, sales, pricing, Grid, and EDU entries exist. | Every page answers who it is for, what outcome it enables, what happens next, and which claims are current. |
| Living Home | Adaptive briefing implementation exists. | Verify every role receives useful real state, safe next actions, empty/degraded states, and no dead controls. |
| Clinic OS | Broad production-oriented workflows exist. | Harden the sellable clinic journey, onboarding, support, data import/manual fallback, and production verification. |
| Grid | Generalized backend and many surfaces exist; discovery is split and location interaction is partial. | One Exchange Field, explicit location consent, synchronized ledger/map, explainable eligibility, dossier, converged enrollment, and complete transaction continuation. |
| Network | Relationship and governed handoff foundations exist. | Make delivery/fallback status, capacity, recipient, consent, and recovery obvious. |
| EDU | Course/cohort/scenario/submission/grading foundation exists. | Complete the coherent learner and educator loops with synthetic data and truthful institutional-integration status. |
| Zumi | Governed reasoning/egress foundations exist. | Make contextual assistance useful in the above journeys without widening authority or leaking internal language. |
| Commercial | Server-owned intent/payment/activation boundaries exist. | Prove end-to-end sell, reconcile, provision, onboard, support, renew, and deactivate paths. |
| Operations | Admin surfaces and journey tests exist. | Consolidate review/hold/failure/reconciliation queues and prove operator recovery. |

## MVP release boundary

A Klinikos MVP candidate is reviewable only when all of the following are true:

- public identity and product hierarchy are consistent;
- a buyer can understand and start a truthful commercial path;
- verified evidence—not a redirect—drives payment and activation;
- a user lands in the correct role-aware Living Home;
- at least one clinic journey completes from intent through audited result;
- Grid completes discovery, qualification, offer, reservation, obligation, fulfillment, and dispute/recovery with real internal state;
- Grid location denial and map failure still permit useful discovery;
- Network completes a consented handoff with connected or clearly labeled fallback delivery;
- EDU completes a synthetic assignment-to-feedback journey;
- Zumi operates inside permission, redaction, evidence, tool, cost, and human-review boundaries;
- tenant isolation and resource authorization are adversarially tested;
- dead controls and unlabeled synthetic values are absent from release surfaces;
- responsive, keyboard, screen-reader, reduced-motion, empty, loading, denied, degraded, and error states are tested;
- schema, migrations, type-check, lint, tests, MVP journeys, production build, startup smoke, and deploy contract pass on the exact candidate;
- external production deployment is verified separately.

## Deliberate pre-MVP non-goals

- claiming certified EHR or completed HIPAA compliance;
- claiming live lab, payer, clearinghouse, e-prescribing, credential-board, malpractice, payout, LTI, or other external rails without evidence;
- fully automated consequential clinical, credential, dispute, refund, or safety decisions;
- publishing synthetic marketplace inventory;
- building a separate app/design system for every resource type;
- broad international expansion before policy, payments, licensing, location, and support boundaries are defined;
- perfect automation where an explicit, recoverable manual fallback can truthfully deliver the first customer outcome.

## Repository organization and maintenance

The canonical reading order is:

1. `docs/SOURCE_OF_TRUTH.md`
2. this document
3. relevant specialist specs, especially marketplace/geolocation
4. current implementation, schema, migrations, tests, and journeys
5. `docs/FEATURE_STATUS.md` and `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
6. Constitution and Master Canon for deeper permanent scope not superseded above

When a decision changes:

- update Source of Truth for governing law;
- update this file for product/website organization;
- update the specialist document for detailed behavior;
- update Feature Status only after implementation evidence changes;
- add or update acceptance journeys;
- preserve old truth in git history rather than relabeling roadmap as built.
