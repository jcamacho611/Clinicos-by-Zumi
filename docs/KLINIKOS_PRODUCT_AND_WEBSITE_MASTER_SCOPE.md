# KLINIKOS Product and Website Master Scope

Date: 2026-08-14  
Status: `AUTHORITATIVE PRODUCT MAP`  
Implementation truth: `docs/FEATURE_STATUS.md`  
Operating law: `docs/SOURCE_OF_TRUTH.md`

## Product definition

Klinikos is a healthcare operating ecosystem: clinic operations, healthcare resource exchange, network/referral coordination, education, governed intelligence, commercial activation, and patient access presented through one coherent product.

It is not positioned as a generic dashboard, a staffing-only marketplace, a chatbot, or a claim of being a certified EHR.

The user experience should feel smaller than the backend. Users state goals, see what needs attention, understand what happens next, and progressively enter only the workspace relevant to that goal.

## Master surface map

### Public / pre-auth

- `/` — conversation-first Living Home. One dominant composer, continuous thread, truthful state progression, context-aware next destination.
- `/pricing` and commercial information — server-owned offers and truthful checkout/activation language.
- `/start` — clinic/customer start and commercial activation path.
- `/grid` — Grid entry and buyer/seller orientation.
- `/grid/browse` — Exchange Field, generalized discovery, map/ledger.
- Grid detail/join paths — provider, location, seller/resource enrollment with role-specific requirements.
- `/edu` — first-class Klinikos EDU entry.
- `/portal/login` — separate patient identity boundary.
- `/login` — clinic/staff identity boundary.
- legal/privacy/Grid terms and explanatory pages required by exposed transactions.

### Authenticated clinic/customer

- Living Home — role-aware operating briefing and next action.
- owner/operator work — activation, readiness, organizational status, revenue/operations overview, approvals and blockers.
- front desk — patients, appointments, intake, forms, follow-up, communication preparation, referrals, tasks.
- provider — schedule, encounters, relevant clinical work, results/forms/tasks, governed approvals.
- administrative/support roles — only the resources/actions their RBAC permits.

### Clinic OS

The backend domain includes patient identity, appointments, encounters, documents, forms/e-sign, labs, imaging, medications, tasks, cases, referrals, operational actions, revenue/coding/claim readiness, membership/payment state, and supporting audit/security controls.

External clinical rails are separate from internal capability. No page may imply Quest/Labcorp/clearinghouse/payer/eRx/fax/other production connectivity without verified evidence.

### Grid

Grid is a universal governed healthcare exchange for:

- people/providers/contractors;
- shifts/work/opportunities;
- rooms/chairs/clinics/facilities;
- business and operational services;
- equipment;
- lawful products/supplies where policy permits;
- organizations and network capacity;
- education/preceptor/placement capacity;
- referral/consultation/diagnostic capacity.

Shared primitives include demand, resource, availability, requirement/policy, match, offer, reservation, financial obligation, fulfillment, dispute, incident, and objective reputation/evidence.

Public discovery uses the Exchange Field and an evidence-backed map/ledger experience. Transaction and safety truth remains deterministic.

### Network / handoffs

- partner directory and relationship state;
- referral/care handoff preparation;
- consent, purpose-of-use and minimum-necessary boundaries;
- human decision where required;
- in-product recipient delivery where both sides are authorized;
- manual/external fallback when external delivery rails are not verified.

### Klinikos EDU

- public entry;
- courses/cohorts/scenarios;
- student scenario workspace;
- evidence/submission lifecycle;
- grading and release boundaries;
- instructor/administrative expansion;
- future competency/certificate and institutional/LTI connections.

EDU must remain clearly synthetic/educational where applicable and must not let hidden answer-key/instructor fields leak into student projections.

### Patient experience

The patient portal uses its own session boundary and patient-scoped repository access. It presents one clear next step and patient-visible appointments/forms/account information plus clinical content that has actually met the applicable release/visibility rule.

The patient experience is not the clinic staff workspace and cannot be promoted into a clinic session.

### Klinikos Intelligence / Zumi

Zumi is Klinikos Intelligence inside the product. It may interpret, explain, research, plan, select permitted tools, preserve context, and assist human work.

Deterministic Klinikos systems own authorization, tenant isolation, credential/eligibility, payment/settlement, clinical release, and safety state. Conversation breadth never grants access.

PHI/sensitive redaction must occur before planner/router/memory/tool/provider consumption. External PHI use remains separately gated by exact provider/configuration/contract/BAA/approval.

### Commercial activation

Customer journey target:

`PUBLIC INTENT → SERVER-OWNED OFFER/CHECKOUT INTENT → EXTERNAL CHECKOUT → VERIFIED EVIDENCE/RECONCILIATION → ENTITLEMENT → ORGANIZATION PROVISIONING → FIRST LOGIN → LIVING HOME → FIRST OPERATIONAL VALUE`

Browser redirect is never payment proof. Manual reconciliation may be truthful when authorized and recorded.

## Experience law

### Conversation-first where intent is primary

The public Living Home reserves the screen for the user’s goal and the conversation. It does not require a user to choose “run care / find work / learn / get care” before receiving help.

Known intent may surface Clinic OS, Grid, EDU, patient access, referrals, or staffing. Unknown intent still receives a useful response rather than a dead-end classifier.

### Progressive disclosure

Do not expose the complete product catalog simply because it exists. Bring forward the workspace, action, or evidence relevant to the user’s current task. Deeper areas remain reachable without dominating the first screen.

### Backend vocabulary stays backend

Customer copy should not require understanding Path IDs, capability registries, entitlement engines, orchestration, policy engines, state machines, migration names, or internal service boundaries.

### Design direction

Klinikos is spacious, editorial, calm, premium, architectural, and responsive. The Aegean/obsidian/cyan/gold identity is expressed through composition, typography, state, and meaningful motion rather than generic SaaS card walls, excessive pills, random gradients, or stock-healthcare imagery.

### Truthful state

Every action is real, intentionally disabled/explained, or absent. Never fake:

- inventory;
- availability;
- distance/ETA;
- external verification;
- payment or payout;
- integration completion;
- record release;
- clinical completion;
- transaction settlement.

## Role model

Different users share a system, not a generic dashboard:

- clinic owner/operator — activation, readiness, operations, revenue, staff/system blockers;
- front desk — patient flow, schedule, intake, tasks, referrals/follow-up;
- provider — care work and required approvals/evidence;
- patient — own portal information and released content;
- Grid buyer/organization — need, results, offers, reservations, spend/issues;
- Grid provider/seller — readiness, listings, availability, offers, obligations;
- student/educator — learning, evidence, grading/release;
- platform operator/founder — configuration, reconciliation, review, disputes, dependency/readiness truth.

Role breadth never widens authorization beyond RBAC/resource policy.

## Revenue and MVP order

Prefer work that converts existing product value into paid/customer value:

1. deployability and production proof;
2. commercial conversion and activation;
3. first-login clarity and recurring operational value;
4. Grid supply/demand and transaction volume;
5. margin/cost controls;
6. evidence/proof and customer supportability;
7. external connections that unlock already-built value;
8. only then new scope that does not unlock an existing customer journey.

Manual-but-truthful operations are acceptable while low-volume. Fake automation is not.

## Current 2026-08-14 convergence state

Merged into `main` today:

- patient portal Aegean/Living-Home convergence;
- public conversation-first Living Home with multi-turn context and accessible/truthful progress;
- Grid Exchange Field and real opt-in geolocation slice with OSM fallback, radius matching, query consistency, and corrected coordinate integrity.

Still requiring independent external verification: the latest production deployment, exact production model/provider state, regulated external health rails, external credential/malpractice sources, and payment/payout movement.

## Next product convergence

The strongest next implementation layer is commercial/activation and the broader Clinic OS customer experience: ensure a paying clinic reaches a coherent first-login operating environment, can perform valuable recurring work without backend jargon, and sees external blockers/status truth clearly. After that, deepen Grid transaction continuity/evidence, EDU operator UX, and the intelligence/tool layer based on customer value and verified dependencies.