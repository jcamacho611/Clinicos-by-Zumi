# KLINIKOS — CURRENT SOURCE OF TRUTH

Version: `2026-08-30.1`
Status: `PREDECESSOR REFERENCE — SUBORDINATE TO docs/KLINIKOS_MASTER_CANON.md`

This document is a current-state navigation and reference map. It records where Klinikos stands and where to look, not what Klinikos must be. Permanent intended company/product law belongs to `docs/KLINIKOS_MASTER_CANON.md`; where this document and the Master Canon disagree, the Master Canon governs. Implementation truth remains current code/schema/migrations/tests/CI/runtime evidence. Capability status belongs in `docs/FEATURE_STATUS.md`; external connection truth belongs in `docs/EXTERNAL_DEPENDENCY_MATRIX.md`.

## 1. Current product definition

The master public brand is **Klinikos**. `Clinicos` is legacy technical spelling only. **Zumi is Klinikos Intelligence**, a subsystem, not the parent brand. **Grid** is the generalized healthcare resource/opportunity/capacity exchange. **Klinikos EDU** is first-class.

Klinikos is the operating and opportunity infrastructure for the healthcare lifecycle. It connects education, careers, clinical operations, patient demand, workforce, facilities, resources, business ownership, networks, transactions, financial truth, and intelligence through one persistent identity and governed ecosystem.

It is not reducible to an EHR, CRM, clinic app, staffing marketplace, education product, patient portal, billing product, or AI assistant.

The detailed newest ecosystem model is authoritative in `docs/KLINIKOS_ECOSYSTEM_CANON.md`.

The newest accepted cross-domain translation of expert, operator, clinical, billing, interface/integration, security, commercial, implementation, and user-research knowledge into reusable architecture is authoritative in `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`. The ledger sits below this Source of Truth and current implementation/runtime truth, but it outranks older/narrower architecture when it records an explicit newer accepted cross-domain correction. It does not by itself change `FEATURE_STATUS` or external-connection truth.

Current universal frontend and user-outcome law is authoritative in:

- `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`;
- `docs/FRONTEND_EXPERIENCE_CANON.md`;
- `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md` where not superseded by newer explicit frontend/product-clarity law.

Specialist law is defined in:

- `docs/GRID_CANON.md`;
- `docs/ZUMI_CANON.md`;
- `docs/EDU_CANON.md`;
- `docs/CLINIC_OS_CANON.md`;
- `docs/PORTAL_AND_ROLE_CANON.md`;
- `docs/FINANCIAL_OS_CANON.md`;
- `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`;
- `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`;
- `docs/KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md` when present on the active candidate branch.

Repository-history and recovery decisions are recorded in `docs/BRANCH_LEDGER.md`; roadmap state is recorded in `docs/RECOVERY_AND_COMPLETION_ROADMAP.md`.

## 2. Wiring law

In Klinikos, wiring does not merely mean links or API calls.

The required chain is:

`VISIBLE UI → USER ACTION → IDENTITY / ACTIVE CONTEXT → INTENT → ROUTE → AUTHORIZATION / ELIGIBILITY → RELEVANT ENGINE(S) → REAL DATA / WORKFLOW → PERSISTENCE / EVENT → TRUTHFUL RESULT → AUDIT / FINANCIAL STATE WHEN REQUIRED → NEXT USEFUL ROUTE`

A feature is not wired if a consequential part of that chain is fake, disconnected, unauthorized, non-persistent when persistence is required, or unable to produce a truthful next step.

Pages are implementation surfaces. **Routes are the product journeys.** Klinikos Intelligence should reason about current state, desired state, missing requirements, available routes, authorized actions, and next best step rather than merely choosing a URL.

For confidential/proprietary execution, the implementation boundary is:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

The browser receives approved operational truth and permitted actions, not the confidential machinery used to derive them.

## 3. Persistent identity and lifecycle

One identity may hold multiple roles and evolve through the ecosystem.

Representative lifecycle:

`STUDENT → EDU → TRAINING → COMPETENCY → PLACEMENT → CREDENTIAL → GRID ELIGIBILITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC OWNER → CLINIC OS → MULTI-SITE / NETWORK → EDUCATOR / EMPLOYER / PRECEPTOR`

Organizations also evolve:

`NEW PRACTICE → CLINIC OS → OPERATIONAL MATURITY → REVENUE OPTIMIZATION → GRID PARTICIPATION → MORE CAPACITY → SECOND LOCATION → MULTI-SITE → NETWORK → ENTERPRISE`

The UI adapts to active role, organization, task, and permissions without requiring separate identities or disconnected products.

Profession, assignment, effective dates, capability, credential/privilege state, location, purpose, supervision/delegation, and other governed context may further constrain authority. A generic `provider` label is never sufficient to grant regulated capability.

## 4. Core ecosystem engines

Major engines include:

- Living Home;
- Klinikos Intelligence / Zumi;
- Clinic OS;
- Grid;
- EDU;
- Care;
- Current Visit;
- Patient experience;
- Provider experience;
- Billing / Financial OS / Revenue Integrity;
- Insights;
- Network / Capacity / Referrals;
- Identity / Organizations / Roles;
- Credentials / Eligibility / Trust;
- Enterprise / Configuration;
- Integration Hub;
- Events / Audit / Provenance;
- Memory / Knowledge.

These engines must interoperate through shared domain truth, adapters, events, and governed routes rather than becoming isolated application silos.

The shared substrate must progressively support profession/authority, multi-location assignments, configuration, patient/coverage/financial-case separation, scheduling/capacity, clinical change, evidence, orders/results, integration reconciliation, terminology, revenue integrity, learning/competency, and memory/knowledge without rebuilding those concerns independently inside each engine.

## 5. Living Home

Living Home is the primary adaptive operating surface, not a marketing page, static KPI dashboard, category wizard, architecture diagram, or module catalog.

The core question is:

> **WHAT NEEDS TO HAPPEN?**

When the user submits ordinary language:

1. keep the user on the same continuous screen when possible;
2. place the request into the active thread;
3. begin truthful intelligence/interface progress;
4. infer the objective without forcing category selection;
5. retrieve only authorized context;
6. resolve the relevant route(s)/engine(s);
7. ask a short clarification only if a consequential fact truly blocks the next governed step;
8. display useful data, action, or workspace directly on the surface;
9. keep the composer available;
10. provide a deeper workspace only when it adds value.

Dynamic workspaces may host/adapt Patients, Clinic OS operations, Grid, Care, Billing, Insights, EDU, Network, commercial activation, credential/setup, and enterprise states.

Authenticated Home should normally prioritize one primary priority or all-clear state, approximately 2–4 meaningful attention items, a small contextual opportunity/insight area when real, and Ask Klinikos. Do not lead with metrics that do not change what the person should do.

## 6. Current design truth — clinical professionalism first

The current operational frontend direction is governed by `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md` and `docs/FRONTEND_EXPERIENCE_CANON.md`.

### 6.1 Operational visual law

The normal operational Klinikos experience is **light-first, healthcare-first, spacious, clinically professional, trustworthy, minimal, natural, and calm**.

Primary foundations use:

- white / pearl / mist clinical canvases;
- graphite / deep clinical slate typography;
- restrained healthcare teal, sage, and medical-blue accents for interaction/information;
- precise success/attention/risk states;
- strong negative space;
- exceptional typography and hierarchy;
- subtle borders/elevation only where meaningful;
- the real Klinikos wordmark/orbital mark as restrained institutional signatures.

Oxblood, dusty rose, rose ash, ember, and muted/antique gold remain Klinikos brand signatures, but they are accents rather than the mandatory fill of every operational screen.

### 6.2 Dark / cinematic law

Obsidian/black-cherry/oxblood styling remains available for optional dark mode, public brand moments, investor/system presentations, selected premium surfaces, and deliberate System X-Ray architecture views.

It is **not** the mandatory default for normal healthcare operations and must not become neon, cyberpunk, video-game, control-room, glowing-network, or architecture-poster UI.

Historical cinematic references and rose treatments are reference material, not permanent product identity. Product clarity outranks decorative atmosphere.

### 6.3 Retired visual assumptions

Do not treat any of the following as current product law:

- dark-first clinical work;
- a giant glowing ecosystem orb as the authenticated Home;
- five-plane diagrams as normal user navigation;
- constellation/network backgrounds on routine operational screens;
- neon plane colors;
- KPI-card walls;
- mandatory rose/flower imagery;
- architecture visualization as the product experience;
- generic hospital-blue enterprise SaaS styling.

### 6.4 Approved assets

Where present, use deliberately:

- `public/klinikos-orbital-k-transparent.png`;
- `public/klinikos-wordmark-transparent.png`;
- `public/klinikos-rose-wide-transparent.png`;
- `public/klinikos-rose-centered-transparent.png`.

Do not substitute opaque black-box images, generic text wordmarks, CSS roses, screenshot slices, or unrelated approximations when an approved asset exists.

## 7. Universal frontend and user-outcome law

`docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md` is the detailed role/route/surface contract for the entire product.

Core rules include:

- normal persistent navigation generally stays within 4–7 destinations;
- the shell is role-derived but server authorization remains authoritative;
- full capability is progressively disclosed through context, routes, Explore Klinikos, and expert administration;
- each major route defines user goal, successful outcome, primary action, required server state, minimum data, permission/error/loading/empty states, mobile behavior, accessibility behavior, ambient Zumi context, and next route;
- Current Visit is the provider-facing clinical convergence surface;
- Grid enters through **I NEED / I HAVE** and eligibility precedes ranking;
- EDU feels like progression rather than LMS navigation;
- Money/Billing leads with exact actionable blockers, not accounting dashboard theater;
- patient experience is dramatically simpler than staff/enterprise software;
- normal users never need to understand the five-plane architecture.

Representative role defaults include:

- Clinic owner: `Home · Today · Money · Grid · Team`;
- Front desk: `Home · Today · Patients · Follow-up · Tasks`;
- Provider: `Home · Today · Patients · Care · Results`;
- Biller: `Home · Money · Readiness · Follow-up · Tasks`;
- Quality: `Home · Quality · Patients · Review · Referrals`;
- Patient: `Home · Appointments · Forms · Messages · Account`;
- Learner: `Home · Learn · Practice · Progress · Opportunities`.

These are presentation defaults, not authority shortcuts.

## 8. Cross-engine ecosystem law

Clinic OS can create governed Grid demand/supply from staffing gaps, unused capacity, referral leakage, service needs, and other supported operational signals.

Grid outcomes can return to Clinic OS as booking, assignment, operational follow-up, fulfillment, issue, and financial/audit state.

EDU can produce competency/placement/credential evidence that contributes to future eligibility only when policy permits.

Patient/Care demand may use Grid capacity only with appropriate permission, progressive disclosure, and minimum-necessary privacy.

Insights consumes operational truth and should produce useful next routes, not dashboard theater.

Cross-domain expert insight that changes one engine must be checked against the others through the Knowledge-to-Architecture Ledger rather than implemented as a local one-off assumption.

## 9. Grid law

Grid is the healthcare resource orchestration network for people, work, capacity, space, permitted equipment/resources, services, organizations, education capacity, referrals, and future policy-governed resource classes.

Universal expression:

**I NEED** → demand  
**I HAVE** → resource/supply

Grid may compose multi-party opportunities rather than assuming buyer/seller or employer/worker sides.

Core concepts include participant, capability, resource, demand, requirement/policy, availability, match, offer, agreement, reservation/booking, financial obligation, fulfillment, dispute, incident, and reputation/evidence.

Hard eligibility precedes ranking. AI may interpret intent and explain matches; deterministic policy decides eligibility. No invented marketplace inventory, distances, or fake empty-market markers. Browser geolocation requires explicit user action. Public coordinates remain precision-reduced while governed exact coordinates stay server-side.

Internal Grid ranking weights, anti-gaming logic, trust/risk heuristics, proprietary matching rules, hidden marketplace economics, and other confidential competitive logic stay server-side by default. The browser receives only the minimum approved match/result projection.

## 10. Financial and payment law

Economic routes converge on shared financial truth:

`OPPORTUNITY → AGREEMENT → BOOKING / RESERVATION → FULFILLMENT → FINANCIAL OBLIGATION → PAYMENT EVIDENCE → PAYOUT / RECONCILIATION → REPORTING`

Use integer cents for financial state.

**REDIRECT ≠ PAYMENT.**

Browser redirect/return state does not establish payment. Payment evidence is recorded separately from entitlement. Browser return state cannot create entitlement, settlement, or payout truth.

Private pricing formulas, margin logic, settlement rules, fraud/risk signals, and internal commercial economics are server-confidential unless intentionally published.

## 11. Pricing and monetization law

The current detailed commercial canon is `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`.

Primary revenue routes include:

- paid operational analysis / workflow review;
- paid implementation / onboarding;
- recurring Clinic OS;
- Grid professional/organization/transaction economics where lawful;
- EDU individual/institutional economics;
- multi-location/network/enterprise contracts;
- customer-funded variable add-ons and external usage.

Customer-funded variable usage should generally follow:

`CUSTOMER PAYMENT / PLAN → ENTITLEMENT → INCLUDED ALLOWANCE → EXTERNAL USAGE → COST LEDGER → OVERAGE / LIMIT → MARGIN`

Do not finance unbounded AI, messaging, voice, maps, verification, or external API usage before customer revenue exists.

Historical planning estimates are not production cost truth. Measure real vendor bills and real customer usage.

Known current Operational Audit checkout destination:

`https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/`

The app must preserve workflow context around checkout and still verify payment evidence separately.

## 12. Klinikos Intelligence / Zumi law

Zumi may understand, retrieve authorized context, research safe public information, identify unknowns, compare, summarize, prepare, and coordinate routes.

It is not authority for authentication, tenant access, RBAC, clinical release, credential eligibility, payment, transaction state, or safety.

PHI/sensitive redaction must occur before unrestricted external planners/tools/providers receive content. Public web research is not a private-data destination.

Zumi hidden prompts, system directives, security/policy prompts, proprietary orchestration logic, internal reasoning, private canonical context, connector credentials, and other confidential implementation details are server-confidential. Client-visible Zumi output must be a safe projection of answer, sources, permitted next actions, blockers, and user-relevant state.

Zumi should progressively reason over structured Klinikos truth — authority, evidence, clinical change, execution state, financial state, Grid state, learning/competency, and governed memory — rather than inventing domain truth inside a model response.

Zumi is ambient intelligence, not a normal destination users must open before asking for help.

## 13. Product truth, security, confidentiality, and trade-secret boundary

No design or ecosystem convergence may weaken:

- authentication;
- tenant isolation;
- RBAC/resource authorization;
- minimum necessary access;
- patient release rules;
- credential/eligibility gates;
- payment/settlement truth;
- auditability/provenance;
- safety holds;
- clinical governance;
- same-origin redirect rules;
- Grid location privacy;
- AI egress controls;
- server/client confidentiality boundaries;
- proprietary implementation secrecy.

`docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` is authoritative repository-wide law.

Assume everything delivered to the browser can be inspected and retained. Minification, obfuscation, hidden elements, disabled UI, client feature flags, private routes, and a private repository are not secrecy controls.

If information must remain confidential, it remains server-side. This includes, unless explicitly reviewed for disclosure:

- secrets/credentials;
- Zumi hidden prompts and private orchestration;
- proprietary rules/evidence logic;
- Grid/Expert Grid ranking and trust algorithms;
- risk/anti-abuse/fraud heuristics;
- private pricing/margin logic;
- unreleased strategy/roadmap/business data;
- privileged security and infrastructure details;
- unnecessary PHI/PII and private operational state.

The browser receives deliberate minimum-necessary DTO/view-model projections, never broad raw database/domain objects by default. Values passed from Server Components into Client Components count as browser disclosure. API responses, static assets, source maps, public env values, client logs, browser storage, telemetry, and errors are all disclosure surfaces.

Frontend authorization is UX only. Server-side repositories/APIs enforce identity, tenant, role, permission, purpose, resource scope, and minimum necessary access.

Demo data is acceptable only in explicit demo/sandbox contexts. Production surfaces prefer real state and truthful empty states.

## 14. Clinical convergence law

Current Visit is the provider-facing convergence surface.

The target sequence is:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

Structured longitudinal change is deterministic clinical truth. AI may summarize it but may not invent it.

Staff handoff is encounter-specific and role-governed. Patient-reported, staff-captured, unresolved, and provider-review-required information should be distinguishable.

Result visibility does not equal review or order closure. Corrected/amended results can reopen review.

Specialist evidence received does not automatically equal provider adoption or referral closure.

Encounter signature does not automatically equal financial completion.

Clinical breadth should come from reusable versioned components/configuration rather than incompatible specialty forks.

## 15. Manual but truthful MVP law

Allowed:

- manual payment reconciliation;
- manual credential review;
- human dispute review;
- prepared communication when connector unavailable;
- manual implementation assistance;
- manual settlement evidence where clearly represented.

Not allowed:

- fake payment;
- fake message delivery;
- fake verification;
- fake payout;
- fake external API result;
- fake Grid supply/distance/availability;
- fake claim/result/referral/fulfillment completion.

## 16. Engineering law

Canonical public identity is `https://klinikos.io`. Render hostnames are infrastructure only.

When instructed to build, wire, finish, or complete, the default stopping condition is **merge-ready**: current with main, implementation complete, meaningful tests, type/lint/test/journey/build gates green, relevant browser/mobile QA, review-clean, and mergeable. When explicitly authorized, merge the exact verified head.

Concurrent work follows:

`FETCH → COMPARE → INSPECT → PRESERVE → RE-ANCHOR → TEST → REVIEW → MERGE`

Do not force stale branches or destroy concurrent work.

Material frontend/API/security changes additionally require, as applicable, response-minimization review, client/server DTO review, tenant/RBAC checks, cache/no-store verification, error sanitization, secret/public-env review, browser bundle/payload inspection, and third-party telemetry review.

## 17. Migration/architecture law

Do not big-bang rewrite the repository to aesthetically match the target architecture.

Prefer adapters, shared services, policy modules, route definitions, events, composition, and gradual migration. Preserve working models and generalize only where the ecosystem requires it.

Do not move confidential server authority into the frontend merely to simplify a refactor.

Every material expert/product insight that could change multiple engines should first be translated through `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` so shared primitives and dependencies are identified before local implementation.

## 18. Acceptance gate

The newest Klinikos vision is not complete merely because the homepage looks right or each module works alone. It is complete only when representative cross-engine and role-specific journeys work truthfully, including:

- patient → required action → appointment/form/message/payment/future care;
- front desk → arrival/blocker → resolution → staff handoff;
- MA/LPN/RN → role-appropriate intake/care → provider/escalation handoff;
- provider → Current Visit → What Changed → result/order/referral work → Close Visit;
- Clinic need → Grid route → eligible next action;
- EDU learning → evidence → human review → placement/capacity route;
- Clinic/Billing/Insights → supported revenue recovery;
- Grid fulfillment → operational + financial + audit consequences;
- identity/role/context changes → correct UI and permissions;
- enterprise/site exception → evidence → intervention route;
- Tenant A never receives Tenant B data through cross-engine routes;
- mobile, keyboard, accessibility, 200% zoom, and reduced-motion behavior remain sound;
- external disconnected states remain truthful;
- confidential proprietary logic is not unnecessarily delivered to the browser;
- sensitive browser-visible payloads are minimum necessary;
- CI/build/journey/browser evidence passes.

As these systems mature, representative acceptance must also prove profession/location/capability authority, patient/financial-case separation, scheduling eligibility/capacity, versioned clinical change, order/result correction and reconciliation, credential-readiness effects, and reference-environment negative-access cases.

## 19. Business test

Before adding unrelated scope ask:

> If a real clinic owner arrived today with money ready, can they understand Klinikos, buy truthfully, activate, enter the new experience, accomplish useful work, and know what is real versus pending?

If no, fix the first failure before expanding scope.

Also ask for every user class:

> Can this person understand where they are, what matters, what Klinikos handled, what still requires them, and what the next permitted action is without learning the architecture?

## 20. North star

**Simple clinical frontend. Powerful connected backend. One persistent identity. Many legitimate roles. Many governed routes. Shared truth. Shared trust. Shared financial/evidence state. Confidential intelligence stays server-side.**

Living Home asks what needs to happen. Klinikos coordinates the ecosystem underneath and returns only the approved result necessary for the user's authorized experience.

Important subject-matter learning is a product asset. It must be preserved as sourced, versioned, cross-domain architecture in the Knowledge-to-Architecture Ledger and then terminate in code, schema, configuration, UX, test, policy, commercial action, or an explicit defer/reject decision — never disappear as an orphan recommendation.
