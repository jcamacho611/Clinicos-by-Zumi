# KLINIKOS — CURRENT SOURCE OF TRUTH

Version: `2026-08-16.3`
Status: `AUTHORITATIVE`

This document defines current Klinikos product, ecosystem, experience, design, wiring, security, Grid, intelligence, commercial, and engineering law. Implementation truth remains current code/schema/migrations/tests/CI. Capability status belongs in `docs/FEATURE_STATUS.md`; external connection truth belongs in `docs/EXTERNAL_DEPENDENCY_MATRIX.md`.

## 1. Current product definition

The master public brand is **Klinikos**. `Clinicos` is legacy technical spelling only. **Zumi is Klinikos Intelligence**, a subsystem, not the parent brand. **Grid** is the generalized healthcare resource/opportunity/capacity exchange. **Klinikos EDU** is first-class.

Klinikos is the operating and opportunity infrastructure for the healthcare lifecycle. It connects education, careers, clinical operations, patient demand, workforce, facilities, resources, business ownership, networks, transactions, financial truth, and intelligence through one persistent identity and governed ecosystem.

It is not reducible to an EHR, CRM, clinic app, staffing marketplace, education product, patient portal, billing product, or AI assistant.

The detailed newest ecosystem model is authoritative in `docs/KLINIKOS_ECOSYSTEM_CANON.md`.

Specialist law is defined in:

- `docs/GRID_CANON.md`;
- `docs/ZUMI_CANON.md`;
- `docs/EDU_CANON.md`;
- `docs/CLINIC_OS_CANON.md`;
- `docs/PORTAL_AND_ROLE_CANON.md`;
- `docs/FINANCIAL_OS_CANON.md`.

Repository-history and recovery decisions are recorded in `docs/BRANCH_LEDGER.md`; roadmap state is recorded in `docs/RECOVERY_AND_COMPLETION_ROADMAP.md`.

## 2. Wiring law

In Klinikos, wiring does **not** merely mean links or API calls.

The required chain is:

`VISIBLE UI → USER ACTION → IDENTITY / ACTIVE CONTEXT → INTENT → ROUTE → AUTHORIZATION / ELIGIBILITY → RELEVANT ENGINE(S) → REAL DATA / WORKFLOW → PERSISTENCE / EVENT → TRUTHFUL RESULT → AUDIT / FINANCIAL STATE WHEN REQUIRED → NEXT USEFUL ROUTE`

A feature is not wired if a consequential part of that chain is fake, disconnected, unauthorized, non-persistent when persistence is required, or unable to produce a truthful next step.

Pages are implementation surfaces. **Routes are the product journeys.** Klinikos Intelligence should reason about current state, desired state, missing requirements, available routes, authorized actions and next best step rather than merely choosing a URL.

## 3. Persistent identity and lifecycle

One identity may hold multiple roles and evolve through the ecosystem.

Representative lifecycle:

`STUDENT → EDU → TRAINING → COMPETENCY → PLACEMENT → CREDENTIAL → GRID ELIGIBILITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC OWNER → CLINIC OS → MULTI-SITE / NETWORK → EDUCATOR / EMPLOYER / PRECEPTOR`

Organizations also evolve:

`NEW PRACTICE → CLINIC OS → OPERATIONAL MATURITY → REVENUE OPTIMIZATION → GRID PARTICIPATION → MORE CAPACITY → SECOND LOCATION → MULTI-SITE → NETWORK → ENTERPRISE`

The UI adapts to active role, organization, task and permissions without requiring separate identities or disconnected products.

## 4. Core ecosystem engines

Major engines include:

- Living Home
- Klinikos Intelligence / Zumi
- Clinic OS
- Grid
- EDU
- Care
- Billing / Financial OS
- Insights
- Network / Capacity
- Identity / Organizations / Roles
- Credentials / Eligibility / Trust
- Events / Audit / Provenance

These engines must interoperate through shared domain truth, adapters, events and governed routes rather than becoming isolated application silos.

## 5. Living Home

Living Home is the primary adaptive operating surface, not a marketing page, static dashboard, category wizard or module catalog.

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
8. display useful data, action or workspace directly on the surface;
9. keep the composer available;
10. provide a deeper workspace only when it adds value.

Dynamic workspaces may host/adapt Patients, Clinic OS operations, Grid, Care, Billing, Insights, EDU, Network, commercial activation and credential/setup states.

## 6. Reference-locked design truth

The approved cinematic Klinikos reference is the authoritative design destination for the converted experience. It is not a mood board.

The uploaded design package authority is recorded in `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md`. The detailed experience law is in `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md`.

### Visual system

Use:

- obsidian / near-black foundations;
- black cherry and deep oxblood structural surfaces;
- warm ivory typography;
- dusty rose, muted coral, ember pink and rose-gray accents;
- the approved cinematic rose as the Living Home visual world;
- restrained intelligence/state glow;
- editorial composition and generous negative space.

Converted product surfaces must not drift back to cyan/teal-dominant generic SaaS styling.

### Approved production assets

Where present, use:

- `public/klinikos-orbital-k-transparent.png`
- `public/klinikos-wordmark-transparent.png`
- `public/klinikos-rose-wide-transparent.png`
- `public/klinikos-rose-centered-transparent.png`

Do not substitute opaque black-box images, generic text wordmarks, CSS roses, screenshot slices or unrelated approximations when the approved asset exists.

## 7. Functional reference shell

Primary header destinations:

**DASHBOARDS · GRID · CARE · EDU · INTELLIGENCE · PROFILE/AUTH**

Operating rail:

**PATIENTS · GRID · CARE · BILLING · INSIGHTS**

Intelligence rail:

**LISTENING → UNDERSTANDING → CONNECTING → PREPARING → READY**

CONNECTING only appears for real retrieval/tool/connector work. READY only appears when a usable result exists. Waiting, blocked, review-required and error states must be truthful when applicable.

Operational cards:

**TODAY'S PRIORITIES · REVENUE OPPORTUNITIES · TEAM WORKFLOW · GRID NETWORK**

These use real data or truthful empty/unavailable state only. Never invent counts, revenue, distance, supply, bookings or completion.

## 8. Cross-engine ecosystem law

Clinic OS can create governed Grid demand/supply from staffing gaps, unused capacity, referral leakage, service needs and other supported operational signals.

Grid outcomes can return to Clinic OS as booking, assignment, operational follow-up, fulfillment, issue and financial/audit state.

EDU can produce competency/placement/credential evidence that contributes to future eligibility only when policy permits.

Patient/Care demand may use Grid capacity only with appropriate permission, progressive disclosure and minimum-necessary privacy.

Insights consumes operational truth and should produce useful next routes, not dashboard theater.

## 9. Grid law

Grid is the healthcare resource orchestration network for people, work, capacity, space, permitted equipment/resources, services, organizations, education capacity, referrals and future policy-governed resource classes.

Universal expression:

**I NEED** → demand
**I HAVE** → resource/supply

Grid may compose multi-party opportunities rather than assuming buyer/seller or employer/worker sides.

Core concepts include participant, capability, resource, demand, requirement/policy, availability, match, offer, agreement, reservation/booking, financial obligation, fulfillment, dispute, incident and reputation/evidence.

Hard eligibility precedes ranking. AI may interpret intent and explain matches; deterministic policy decides eligibility. No invented marketplace inventory, distances or fake empty-market markers. Browser geolocation requires explicit user action. Public coordinates remain precision-reduced while governed exact coordinates stay server-side.

## 10. Financial and payment law

Economic routes should converge on shared financial truth:

`OPPORTUNITY → AGREEMENT → BOOKING / RESERVATION → FULFILLMENT → FINANCIAL OBLIGATION → PAYMENT EVIDENCE → PAYOUT / RECONCILIATION → REPORTING`

Use integer cents for financial state.

**REDIRECT ≠ PAYMENT.**

Browser redirect/return state does **not** establish payment.

Payment evidence is recorded separately from entitlement.

Browser return state cannot create entitlement, settlement or payout truth.

## 11. Pricing and monetization law

The current detailed commercial canon is `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`.

Primary revenue routes:

- paid operational analysis / workflow review;
- paid implementation / onboarding;
- recurring Clinic OS;
- Grid professional/organization/transaction economics where lawful;
- EDU individual/institutional economics;
- multi-location/network/enterprise contracts;
- customer-funded variable add-ons and external usage.

Customer-funded variable usage should generally follow:

`CUSTOMER PAYMENT / PLAN → ENTITLEMENT → INCLUDED ALLOWANCE → EXTERNAL USAGE → COST LEDGER → OVERAGE / LIMIT → MARGIN`

Do not finance unbounded AI, messaging, voice, maps, verification or external API usage before customer revenue exists.

Historical planning estimates are not production cost truth. Measure real vendor bills and real customer usage.

Known current Operational Audit checkout destination:

`https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/`

The app must preserve workflow context around checkout and still verify payment evidence separately.

## 12. Klinikos Intelligence / Zumi law

Zumi may understand, retrieve authorized context, research safe public information, identify unknowns, compare, summarize, prepare and coordinate routes.

It is not authority for authentication, tenant access, RBAC, clinical release, credential eligibility, payment, transaction state or safety.

PHI/sensitive redaction must occur before unrestricted external planners/tools/providers receive content. Public web research is not a private-data destination.

## 13. Product truth and security

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
- AI egress controls.

Demo data is acceptable only in explicit demo/sandbox contexts. Production surfaces prefer real state and truthful empty states.

## 14. Manual but truthful MVP law

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
- fake Grid supply/distance/availability.

## 15. Engineering law

Canonical public identity is `https://klinikos.io`. Render hostnames are infrastructure only.

When instructed to build, wire, finish or complete, the default stopping condition is **merge-ready**: current with main, implementation complete, meaningful tests, type/lint/test/journey/build gates green, relevant browser/mobile QA, review-clean and mergeable. When explicitly authorized, merge the exact verified head.

Concurrent work follows:

`FETCH → COMPARE → INSPECT → PRESERVE → RE-ANCHOR → TEST → REVIEW → MERGE`

Do not force stale branches or destroy concurrent work.

## 16. Migration/architecture law

Do not big-bang rewrite the repository to aesthetically match the target architecture.

Prefer adapters, shared services, policy modules, route definitions, events, composition and gradual migration. Preserve working models and generalize only where the ecosystem requires it.

## 17. Acceptance gate

The newest Klinikos vision is not complete merely because the homepage looks right or each module works alone. It is complete only when representative cross-engine journeys work truthfully, including:

- Clinic need → Grid route → eligible next action;
- EDU requirement → placement/capacity route;
- Clinic/Billing/Insights → supported revenue recovery;
- Grid fulfillment → operational + financial + audit consequences;
- identity/role/context changes → correct UI and permissions;
- Tenant A never receives Tenant B data through cross-engine routes;
- mobile, keyboard and accessibility behavior remain sound;
- external disconnected states remain truthful;
- CI/build/journey/browser evidence passes.

## 18. Business test

Before adding unrelated scope ask:

> If a real clinic owner arrived today with money ready, can they understand Klinikos, buy truthfully, activate, enter the new experience, accomplish useful work, and know what is real versus pending?

If no, fix the first failure before expanding scope.

## 19. North star

**Simple frontend. Powerful connected backend. One persistent identity. Many roles. Many routes. Shared governance. Shared financial truth. Shared trust. Shared events.**

Living Home asks what needs to happen. Klinikos coordinates the ecosystem underneath.
