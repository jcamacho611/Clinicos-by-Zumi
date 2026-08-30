# Klinikos Living Universe Design

**Date:** 2026-08-30

**Status:** Founder-approved interaction architecture, pending implementation-plan approval

## 1. Purpose

Klinikos Living Universe is the universal interactive face of the governed healthcare operating ecosystem. It does not replace the existing product engines, routes, authority model, data model, or canonical five-plane architecture. It provides one React/Next.js interaction fabric that lets people operate the ecosystem through active objects, Paths, five-plane lenses, relationships, time, Zumi, and governed next actions.

The core product principle is:

> Do not make the person navigate the software. Recompose the software around the person's current objective, active object, authority, evidence, and next action.

The system must make Klinikos feel like one living operating environment rather than a collection of modules, dashboards, card walls, and unrelated route-specific designs.

## 2. Permanent Architecture Law

There are exactly five top-level Klinikos planes:

1. **Healthcare Universe Plane** — people, patients, caregivers, students, professionals, clinics, hospitals, schools, payers, labs, imaging, pharmacies, employers, vendors, regulators, partners, and other healthcare participants.
2. **Economic & Resource Plane** — jobs, services, shifts, rooms, chairs, equipment, ordinary goods, capacity, placements, referrals, contracts, claims, financial obligations, money/resources, and knowledge.
3. **Lifecycle Plane** — patient, student, professional, clinic/organization, claim/revenue, Grid transaction, relationship, resource, care, recurring care, integration, customer, and other governed lifecycles.
4. **Operating Infrastructure Plane** — identity/trust, organization/location, Experience Engine, Zumi/OpenAI, Grid, EDU, Care, Current Visit, Clinic OS, scheduling/capacity, Financial OS, RCM/billing, insurance, Network, insights, communications, documents, evidence/audit, memory/knowledge, config/rules, tasks/obligations, entitlements/access, admin/governance, integration hub, pricing/commercial entitlement, quality/expert escalation.
5. **Compounding Business Plane** — awareness/acquisition → free value → identity → verification → participation → activity → outcomes → revenue → retention → reputation/referrals → network effects → learning/evidence → better product → distribution → expansion → defensibility → enterprise value.

The canonical graph, Living Universe, Paths, lenses, maps, timelines, and relationship visualizations are connective/projection machinery. They are **not a sixth plane**.

Patient/Clinical/Financial/Workforce/EDU/Grid/Network/Enterprise views are experience lenses across the real five planes, not replacement plane definitions.

## 3. Existing Product Authority

Living Universe must reuse current Klinikos authority and runtime foundations wherever they exist, including but not limited to:

- authenticated `AppShell`;
- Living Home;
- role-aware navigation and Experience Engine projections;
- server-side Path catalog/runtime/persistence/guidance;
- Zumi request and execution gates;
- universal Person/relationship/organization context;
- Current Visit and clinical convergence kernels;
- Patient Record and Patient Portal;
- Scheduling/capacity;
- Billing/Revenue Integrity/claims/payment evidence;
- Grid discovery, demand/supply, eligibility, resource, and transaction truth;
- EDU/workforce/placement evidence;
- documents, tasks, notifications, audit, communications;
- existing repositories and minimum-necessary DTO boundaries.

Living Universe must not create a second identity system, second Path system, second Grid, second clinical editor, second billing engine, second Zumi, second relationship database, or second authority model.

## 4. Interaction Model

The universal interaction loop is:

`INTENT → ACTIVE CONTEXT → ACTIVE OBJECT → RELEVANT PATHS → FIVE-PLANE PROJECTION → BEFORE/NOW/NEXT → INSPECTOR → ZUMI → GOVERNED NEXT ACTION → EVIDENCE → UPDATED OBJECT → NEXT ACTION`

The dominant unit of interaction is the **Active Object**.

Consequential objects may include:

- Person
- Patient
- Provider/Professional
- Caregiver/Proxy relationship
- Organization
- Location
- Encounter
- Appointment / AppointmentSeries
- FinancialCase
- Claim
- Payment / Remittance / Reconciliation object
- ServiceOrder
- Result
- Referral
- Credential / Privilege / Payer enrollment decision
- Grid need / resource / opportunity / offer / assignment / transaction
- Job / shift / room / chair / equipment / capacity
- EDU learner / course / simulation / competency / placement
- Contract / subscription / entitlement
- Task / obligation / escalation
- Integration event / reconciliation exception
- Customer/commercial opportunity where appropriate

The browser never infers authority from object visibility. All consequential actions must be reauthorized server-side.

## 5. Universal React Experience Primitives

### 5.1 UniverseShell

The authenticated environment around all Living Universe surfaces. It consumes the existing Klinikos application shell and progressively replaces route-centric chrome with context-centric interaction.

Responsibilities:
- active organization/location/purpose presentation;
- role/profession-aware navigation projection;
- global search/explore;
- persistent Zumi affordance;
- active-object return/history stack;
- responsive/mobile workspace composition;
- theme/material handling;
- no authority decisions.

### 5.2 ObjectStage

The consequential object becomes the temporary center of the experience.

ObjectStage presents:
- object identity and bounded context;
- current status/truth state;
- before → now → next narrative;
- relevant Paths;
- exceptions/obligations;
- dominant next action;
- related evidence;
- Inspector entry;
- Zumi interaction;
- safe return to prior context.

Current Visit is an existing route-specific example of this concept and should be generalized rather than rebuilt.

### 5.3 PlaneLens

PlaneLens projects the same active object through the five real planes.

It answers questions such as:
- Who/what is connected to this object?
- What resources/economic obligations surround it?
- Where is it in its lifecycle?
- Which operating systems are relevant?
- What measurable value/retention/network effects result from it?

PlaneLens is a projection only. It cannot manufacture missing relationships, financial values, eligibility, authority, outcomes, or business traction.

### 5.4 PathConstellation

PathConstellation shows the governed Paths relevant to the active objective and object.

It must consume server-projected Path data from the canonical Path machinery. The browser must not ship or recreate proprietary Path selection/routing logic.

It may show:
- active Path;
- connected/next Paths;
- completed steps supported by evidence;
- blocked/pending steps;
- next governed action;
- safe destination links.

A Path is not a plane and a Path match does not grant authority.

### 5.5 NarrativeTimeline

One reusable temporal grammar supports multiple domains:

- Clinical: `INITIAL → PREVIOUS → TODAY → NEXT`
- Financial: `EXPECTED → ACTUAL → GAP → NEXT ACTION`
- Claim: `PERFORMED → CHARGED → CLAIMED → ADJUDICATED → PAID → RECONCILED`
- Grid: `NEED → AVAILABLE → ELIGIBLE → MATCH → FULFILLMENT`
- EDU: `LEARN → PRACTICE → EVIDENCE → COMPETENCY → PLACEMENT → WORK`
- Provider: `CLAIM → VERIFY → CREDENTIAL → PRIVILEGE → WORK`
- Patient: `NEED → DISCOVERY → APPOINTMENT → CARE → FOLLOW-UP`
- Business: `USER VALUE → EVIDENCE → REVENUE → RETENTION → NETWORK EFFECT`

Timeline data must be sourced from durable evidence where available. Missing events must not be inferred as completed/normal.

### 5.6 Inspector

Inspector answers:
- Why?
- What evidence supports this?
- What changed?
- Who/what is related?
- What authority applies?
- What happened historically?
- What is blocking the next action?

Suggested sections:
`WHY | EVIDENCE | CHANGED | RELATIONSHIPS | AUTHORITY | HISTORY`

Only authorized minimum-necessary information may be projected.

### 5.7 RelationshipGraph

RelationshipGraph visualizes server-projected relationships among authorized objects.

It must reuse existing relationship/org/provider/patient/Grid/network truth. It must not create a parallel relationship store.

Patient relationships remain private. Shared data is not globally public. Relationship existence does not create chart/disclosure authority.

### 5.8 SpatialView

SpatialView powers map/capacity experiences, especially Grid and enterprise operations.

It must reuse existing Grid/resource/location/geospatial truth and preserve:
- eligibility before ranking;
- reviewed coordinates only for exact map markers where required;
- private patient boundaries;
- regulated clinical inventory separation from ordinary public commerce;
- minimum-necessary disclosure;
- honest availability and verification states.

### 5.9 ZumiCommandSurface

Zumi becomes a command language for the operating environment, not merely a text chatbot.

Example interaction:

`USER QUESTION → GOVERNED ZUMI REQUEST → SERVER PLAN/PROJECTION → LIVING UNIVERSE RECOMPOSITION → HUMAN REVIEW/CONFIRMATION WHERE REQUIRED → AUTHORIZED ACTION → AUDIT`

Zumi may understand, explain, teach, identify, recommend, prepare, coordinate, execute when authorized, monitor, and escalate according to the existing execution-level policy.

Zumi does not become clinical, financial, credential, payment, security, or legal authority.

### 5.10 ActionDock

ActionDock exposes one dominant next action and a small bounded set of secondary actions.

Every consequential action must include:
- server-side authorization;
- current-object revalidation;
- state/version conflict protection where relevant;
- human confirmation where policy requires;
- audit/evidence consequence;
- truthful failure behavior.

Drag/drop and direct manipulation may prepare or request actions, but gesture completion never equals authority.

## 6. Universe Modes

Living Universe supports multiple projections of the same current context:

- **Stage** — active-object work;
- **Plane** — five-plane lens;
- **Path** — lifecycle/Path constellation;
- **Graph** — relationship topology;
- **Map** — spatial/resource view;
- **Time** — historical/longitudinal view;
- **Evidence** — provenance and supporting facts.

Modes do not duplicate source data. They project the same governed objects differently.

Normal healthcare work remains calm, readable, fast, and clinically professional. Advanced graph/3D/system-X-ray modes are optional views, not the default for routine clinical work.

## 7. Visual and Interaction Language

Living Universe uses the Black Label product law while preserving clinical usability:

- quiet power;
- luxury through restraint, typography, precision, behavior, and spacing;
- Marble light mode and Obsidian dark mode;
- oxblood/black cherry, dusty rose/ember, warm ivory/bone, restrained gold as brand materials;
- no generic healthcare-blue SaaS default;
- no cyberpunk/neon clinical UI;
- no permanent KPI-card walls;
- no five-plane architecture poster as the ordinary dashboard;
- scarce Living Edge as an attention signal;
- contemplative density for orientation/insight;
- operative density for care/billing/Grid/admin work;
- five depth levels: environment → workspace → active surface → context/Inspector → modal/critical decision.

The 2026-08-30 clinical-light guidance is interpreted as a usability constraint—spacious, calm, professional, trustworthy clinical work—not as authority to replace the Master Canon's brand/material system.

## 8. Server Projection Boundary

The permanent technical boundary is:

`DATABASE / DOMAIN ENGINE → SERVER AUTHORITY → MINIMUM-NECESSARY PROJECTION → LIVING UNIVERSE → USER INTERACTION → SERVER REVALIDATION → ACTION → AUDIT/EVIDENCE`

Confidential/proprietary selection, ranking, routing, pricing, risk, authorization, and policy logic stays server-side.

The browser receives explicit presentation/view contracts, not raw ORM/domain objects when those contain broader data than the surface needs.

Potential server projection contracts include:

- `LivingUniverseObjectView`
- `LivingUniversePlaneView`
- `LivingUniversePathView`
- `LivingUniverseTimelineView`
- `LivingUniverseRelationshipView`
- `LivingUniverseAuthorityView`
- `LivingUniverseActionView`

These must be defined from actual current repository types during implementation rather than invented as a parallel canonical model.

## 9. Truth and Safety Laws

Permanent distinctions remain enforced:

- CLAIM != VERIFICATION
- PAYMENT != AUTHORITY
- SUBSCRIPTION != ELIGIBILITY/CLINICAL AUTHORITY
- EDU != LICENSE
- RESUME != VERIFIED CREDENTIAL
- AI != AUTHORITY
- REPUTATION != ELIGIBILITY
- PROMOTION != ENTITLEMENT != AUTHORITY
- REDIRECT != PAYMENT
- RELATIONSHIP != DISCLOSURE AUTHORITY
- SIGNED != COMPLETE
- API KEY != LIVE INTEGRATION
- MERGED != DEPLOYED != CUSTOMER-VISIBLE

Eligibility precedes ranking.

Patients are private.

Regulated clinical inventory is not ordinary public Grid commerce.

Context switch is a security event.

No fake clinical facts, availability, eligibility, revenue, outcomes, customer traction, integrations, partnerships, compliance, PHI readiness, or production-readiness claims.

## 10. First Production Tranche

The first implementation tranche is intentionally narrow enough to verify and merge independently.

### Goal

Transform authenticated Living Home into the first Living Universe surface while reusing current data and authority.

### Included

- UniverseShell integration with current `AppShell`;
- one reusable ObjectStage foundation;
- server-projected active-object summary from existing Home context;
- PathConstellation using existing server-side Path data;
- five-plane Lens with truthful projections from already-loaded Home context;
- NarrativeTimeline using durable existing events only;
- Inspector with bounded why/evidence/change/authority sections derived from available data;
- persistent Zumi command entry using existing Zumi execution path;
- ActionDock linking/preparing only currently authorized actions;
- desktop/tablet/mobile composition;
- keyboard/screen-reader/focus/reduced-motion acceptance;
- no schema migration unless implementation proves an unavoidable durable-state gap and that change is separately reviewed.

### Explicitly Out of Scope for Tranche 1

- replacing every production route;
- new identity/relationship authority;
- new Grid engine;
- new clinical editor;
- new billing/claim authority;
- fake graph relationships;
- 3D clinical UI;
- full multiplayer editing;
- production PHI-readiness claims;
- broad schema changes;
- rewriting #370/#371 work.

## 11. Progressive Adoption Order

After the first tranche is verified and reconciled against the authority stack:

1. Living Home / global shell
2. Current Visit
3. Patient record / portal
4. Front Desk / scheduling
5. Provider workstage
6. Billing / Revenue Integrity
7. Grid spatial/relationship modes
8. EDU / placement/workforce
9. Network/referrals
10. Enterprise command center
11. Integration reconciliation / external operations
12. optional advanced collaboration / System X-Ray / 3D educational or topology views

Existing route-specific Black Label work is reused and generalized; it is not discarded merely to satisfy this adoption order.

## 12. Dependency and Merge Strategy

Living Universe work must stay isolated from the preserved local #367 worktree.

The authority stack remains:

`main → #367 → #370 → #371`

Living Universe may be designed and implemented on an isolated branch while that stack closes, but it must not merge ahead of unresolved Canon/graph/Person authority dependencies if doing so would create conflicting architecture or require duplicate authority.

Before Living Universe merge:

- rebase/reconcile to the then-current verified `main`;
- confirm Master Canon remains supreme intended truth;
- confirm exactly five planes;
- consume #370 graph contracts where applicable rather than duplicating them;
- consume #371 Person/relationship authority where applicable rather than inventing substitutes;
- run exact-head repository Quality/release verification;
- run browser QA;
- verify deployed SHA after eventual production release.

## 13. Testing and Acceptance

### Contract tests

Must lock at minimum:
- exactly five planes;
- graph/Living Universe not a sixth plane;
- patient projections private by default;
- eligibility before ranking;
- Zumi never authoritative;
- action projection cannot bypass server authorization;
- browser does not import confidential Path/ranking/authority internals;
- current route engines remain reused, not duplicated.

### Interaction tests

Must prove:
- active object can change without losing safe return context;
- PlaneLens changes projection without changing authority;
- PathConstellation uses server-projected Path state;
- Inspector shows only available/authorized evidence;
- missing data renders unknown/pending/not-available rather than fabricated completion;
- ActionDock revalidates actions server-side;
- Zumi can recompose the view without directly committing unauthorized actions.

### Accessibility

Must prove:
- keyboard operation;
- visible focus;
- screen-reader labels/landmarks;
- 44px consequential touch targets;
- reduced-motion support;
- no required hover-only interaction;
- usable 200% zoom;
- mobile/tablet intentional recomposition;
- graph/map modes have non-visual alternatives for consequential information/actions.

### Performance

The ordinary operating surface must not require WebGL/3D. Advanced modes load progressively. The first meaningful Home/Stage interaction must remain usable on ordinary clinic hardware and mobile connections.

### Release truth

Completion requires:

`DESIGN → COMPONENTS → TESTS → BUILD → MERGE → DEPLOY → VERIFY DEPLOYED SHA → BROWSER QA → CUSTOMER-VISIBLE`

A merge or green local test alone is not represented as customer-visible completion.

## 14. Success Criteria

The first Living Universe tranche succeeds when a signed-in user can:

1. land on Living Home and immediately understand what needs attention;
2. see a real active operating object derived from current authorized data;
3. inspect that object through Paths, five-plane context, time/evidence, and Inspector without jumping through unrelated modules;
4. ask Zumi a bounded question and have the workspace recompose from a governed server response;
5. take or prepare an authorized next action without the browser manufacturing authority;
6. move between desktop/tablet/mobile without losing the operating hierarchy;
7. return to the prior safe context;
8. experience a visibly new Klinikos interaction model while existing clinical, financial, Grid, EDU, identity, and audit engines remain authoritative.

The long-term success condition is that all major Klinikos experiences become coherent projections of one governed Living Universe rather than separate applications.