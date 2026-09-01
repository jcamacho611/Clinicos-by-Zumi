# Klinikos Living Universe — Free Entry + Native Grid Convergence Design

**Date:** 2026-08-31  
**Status:** Written design for founder review; implementation remains gated  
**Authority:** Subordinate implementation design under `docs/KLINIKOS_MASTER_CANON.md` and current verified runtime truth  
**Reference artifact:** `https://claude.ai/code/artifact/233c4790-6a67-4c03-aede-321e261d055e` — visual/interaction reference only, never a production authority or runtime dependency

## 1. Purpose

This design converges the already-approved Klinikos Living Universe interaction model with the founder's corrected free-entry/Grid law and the six-screen Claude reference.

The objective is not to embed another application inside Klinikos. The objective is to make the real Klinikos application behave like one living operating environment:

`PUBLIC INTENT → FREE PERSON IDENTITY → ROLE / PURPOSE → PROFILE → GRID PRESENCE / DISCOVERY → PATH / EDU / WORK / CARE RELEVANCE → FIRST USEFUL ACTION → LIVING HOME`

The core product principle remains:

> **Do not make the person navigate the software. Recompose the software around the person's current objective, active object, authority, evidence, and next action.**

## 2. Permanent Product Law

There are exactly five top-level planes:

1. Healthcare Universe Plane
2. Economic & Resource Plane
3. Lifecycle Plane
4. Operating Infrastructure Plane
5. Compounding Business Plane

The Living Universe, Grid map, Paths, graphs, lenses, timelines, object stages, and relationship views are projection/connective machinery. They are **not a sixth plane**.

Permanent distinctions remain enforced:

- CLAIM ≠ VERIFICATION
- PAYMENT ≠ AUTHORITY
- SUBSCRIPTION ≠ ELIGIBILITY / CLINICAL AUTHORITY
- EDU ≠ LICENSE
- RESUME / CAREER ARTIFACT ≠ VERIFIED CREDENTIAL
- AI ≠ AUTHORITY
- REPUTATION ≠ ELIGIBILITY
- PROMOTION ≠ ENTITLEMENT ≠ AUTHORITY
- REDIRECT ≠ PAYMENT
- RELATIONSHIP ≠ DISCLOSURE AUTHORITY
- SIGNED ≠ COMPLETE
- API KEY ≠ LIVE INTEGRATION
- MERGED ≠ DEPLOYED ≠ CUSTOMER-VISIBLE

Eligibility precedes ranking. Patients are private. Regulated clinical inventory is not ordinary public commerce. Context switching is a security event.

## 3. Grid and Free Entry Law

Grid is the universal governed **I NEED / I HAVE exchange fabric** wherever Klinikos connects a legitimate need to a legitimate resource.

Grid is:

- not a sixth plane;
- not a staffing-only product;
- not merely a later visual mode;
- not reserved for paid accounts;
- not permission to bypass verification, eligibility, authority, contract, payment, or disclosure gates.

The free-entry promise is:

> **Join Klinikos free. Establish one identity. Enter the network. Discover what is relevant. Learn. Build evidence. Participate in Grid where eligible. Follow Paths. Ask Zumi. Pay only when advanced capability, governed transactions, business tooling, or higher-cost services justify it.**

Free access may include:

- one canonical Person identity;
- a basic profile;
- claimed role/purpose context clearly labeled as claimed where not verified;
- public-safe Grid discovery;
- creation of ordinary discovery intent / need where policy permits;
- EDU / Path relevance;
- free network participation where eligibility permits;
- governed next-action guidance.

Free access never implies:

- professional verification;
- clinical authority;
- organization authority;
- disclosure authority;
- marketplace eligibility for a regulated action;
- entitlement to paid capabilities;
- credential validity;
- payment or settlement truth.

## 4. One Person Identity — No Synthetic Organization

Current runtime truth is transitional:

- `Person`, `OrganizationMembership`, and location assignment foundations exist;
- the universal-identity migration explicitly states that current authentication still uses `users.organizationId / users.roleKey` until a later migration adopts memberships as active session context;
- `ClinicSession` still requires an organization ID/name/slug and clinic role;
- current `/api/auth` exposes login/logout only;
- session validation requires an active organization-bound `User`.

Therefore free identity **must not** be implemented by:

- creating a fake clinic for every free person;
- forcing a user to claim an organization;
- creating a second Person table;
- creating a separate Grid identity;
- treating `User` as the lifelong identity;
- repurposing protected evaluation `/access` as public free signup.

The migration direction is:

`AUTHENTICATION PRINCIPAL → PERSON → ZERO OR MORE ORGANIZATION MEMBERSHIPS → OPTIONAL ACTIVE ORGANIZATION / LOCATION / PURPOSE CONTEXT`

Existing organization-bound clinic login remains supported during migration. Clinic routes continue to require a valid organization context. Free network routes require authentication but do not manufacture an organization context.

The implementation plan must generalize the current authentication/session boundary so an authenticated Person can exist before organization membership, while preserving legacy clinic sessions and current legal/access gates for protected clinic surfaces.

## 5. Safe Intent Continuity

Public intent should survive the transition into authentication when it is safe to do so.

Allowed continuity:

- generic role or career intent;
- ordinary Grid need/have intent;
- desired geography;
- public resource identifier;
- requested public route;
- non-sensitive search/filter state.

Never persist across public/free entry as generic client storage or query data:

- PHI;
- patient identifiers;
- diagnoses;
- clinical free text;
- restricted organization data;
- secrets;
- authority claims represented as verified facts.

Use the existing same-origin `safeReturnTo` model for route continuity. New intent continuity must be bounded, typed, expiring, and server-revalidated before use.

## 6. Six-Screen Reference Convergence

The Claude artifact supplies a useful acceptance reference. Its behaviors are absorbed natively into Klinikos as follows.

### 6.1 Public Gateway

The public first interaction remains intent-first:

> **What needs to happen?**

The visitor is not forced through a product/module catalog before receiving value.

Current `PublicLivingGateway` remains the starting implementation to reuse and evolve.

### 6.2 Free Entry

Free Entry is a progressive five-step experience, not a paywall:

1. establish / authenticate Person;
2. capture role or purpose as a claim/context, not authority;
3. complete a basic profile;
4. establish Grid presence / discovery context;
5. surface relevant Paths, EDU, work, care, or organization next steps.

Step 4 is intentionally Grid-aware. Grid is not deferred until after a subscription.

### 6.3 Living Home

Authenticated Living Home becomes the first full Living Universe surface by reusing the current real implementation:

- existing AppShell;
- current Living Home request phases;
- server-owned `/api/paths` resolution;
- real Path snapshots/presentations/guidance;
- real Grid signals;
- real EDU readiness;
- real operating rail;
- real Zumi provider truth.

The composition evolves toward:

`CONTEXT RAIL | OBJECT STAGE | INSPECTOR | ACTION DOCK`

The five planes are lenses over the same active object/context, never five dashboards.

Living Home must not be artificially populated. A new free account may show onboarding/identity/Grid/Path next actions, but only from real persisted or server-derived state.

### 6.4 Grid

Grid remains a native interactive spatial exchange:

- pan / zoom;
- reviewed public pins only where coordinates are actually available;
- list ↔ map synchronization;
- geolocation by explicit browser permission;
- real distance only after location is supplied;
- city/state/service-area inventory remains unpinned when exact coordinates are unavailable;
- blocked opportunities remain visible when policy allows discovery, with the specific missing requirement named;
- reputation may reorder **eligible** results only; reputation never creates eligibility;
- money appears only when the transaction class actually carries economic terms.

The existing `GridLiveMap` + MapLibre/OpenFreeMap implementation is the production foundation. The Claude artifact's embedded NYC geometry was a canvas-runtime workaround and must **not** replace the production map engine.

### 6.5 Current Visit

Current Visit demonstrates the same Living Universe grammar in Marble clinical mode:

- active patient/encounter object;
- clinically readable operative density;
- before → now → next;
- Inspector/evidence/authority where appropriate;
- no decorative map/graph behavior added to routine clinical work.

The first entry/Grid tranche must not rewrite Current Visit.

### 6.6 Mobile

Mobile is recomposed, not cropped.

- dominant object/action stays visible;
- Inspector becomes a drawer/sheet;
- map/list switch is explicit;
- consequential touch targets remain at least 44px;
- no required hover-only information;
- critical evidence and authority are never deleted merely to fit the viewport.

## 7. Native Map and Geolocation Law

Production Grid must remain native React/Next.js UI around the existing Grid map engine.

An iframe is allowed only as the existing map-provider failure fallback, not as the Klinikos application shell and not as an embedded Claude artifact.

Location behavior:

`NO LOCATION PERMISSION → truthful listed geography / no invented distance`

`LOCATION REQUESTED → browser permission prompt`

`LOCATION GRANTED → permission-derived coordinate → server/client-safe distance projection → map recenters → distance labels update`

`LOCATION DENIED / UNAVAILABLE → explain the limitation → preserve ordinary discovery`

No hidden location collection. No invented user position. No storing precise location beyond what the implemented purpose and policy require.

## 8. Grid Truth Presentation

Where a discoverable opportunity/resource is not actionable, the interface should prefer truthful explanation over disappearance when policy allows the item to be shown.

Example:

`VISIBLE OPPORTUNITY → ELIGIBILITY CHECK → BLOCKED: missing active malpractice evidence`

The UI may explain the missing requirement and offer a governed next step. It may not imply that training, reputation, subscription, or payment cured the missing requirement.

Aesthetics/EDU completion, for example, may become evidence or context but does not itself authorize a regulated procedure.

## 9. Living Universe Primitives Reused in the First Wave

The first wave uses the already-approved primitive set:

- `UniverseShell`
- `ObjectStage`
- `PlaneLens`
- `PathConstellation`
- `NarrativeTimeline`
- `Inspector`
- `SpatialView`
- `ZumiCommandSurface`
- `ActionDock`

RelationshipGraph and advanced graph/time/system-X-ray visualizations are not required for the first production wave.

These primitives are view/projection components. They do not own canonical business truth.

## 10. Server Boundary

Permanent boundary:

`DATABASE / DOMAIN ENGINE → SERVER AUTHORITY → MINIMUM-NECESSARY PROJECTION → LIVING UNIVERSE → USER INTERACTION → SERVER REVALIDATION → ACTION → AUDIT / EVIDENCE`

Confidential Path selection, ranking, eligibility, authority, pricing, risk, and policy logic remains server-side.

The browser receives presentation contracts, not raw ORM objects or hidden orchestration rules.

## 11. First Production Wave

The first independently mergeable program is:

### Wave A — Person-first free entry foundation

- generalize authentication from organization-bound-only session assumptions toward authenticated Person + optional active organization context;
- preserve current clinic login/session behavior through a compatibility adapter;
- add a genuine free-account entry route;
- persist only non-sensitive entry intent needed for continuity;
- distinguish claimed vs verified role/organization/professional facts.

### Wave B — Free Grid continuity

- route eligible free identities into public-safe Grid discovery;
- let ordinary need/have discovery intent continue without subscription;
- reuse current Grid demand/resource/eligibility engines;
- show missing eligibility requirements truthfully;
- never rank before eligibility where consequential matching applies.

### Wave C — Living Home object-stage convergence

- evolve current authenticated Living Home into UniverseShell/ObjectStage/Inspector/ActionDock composition;
- reuse current Paths, Zumi, Grid signals, EDU readiness, appointments, and operating rail;
- expose exactly five plane lenses over the same active context;
- no fake activity for empty/new accounts.

### Wave D — Native Grid spatial convergence

- reuse `GridLiveMap` and MapLibre/OpenFreeMap;
- improve native recenter/fly behavior after geolocation without page reload;
- keep mobile results-first with explicit map switch;
- connect selected resource to the current public reviewed-resource detail and governed request flow;
- provide non-map alternatives for all consequential information/actions.

## 12. Explicit Non-Goals

This first program does not:

- embed the Claude artifact as an iframe;
- create a second application;
- create a second identity database;
- create a second Grid engine;
- make patients public Grid profiles;
- rewrite Current Visit;
- replace the existing billing/claims engines;
- make Zumi authoritative;
- make reputation an eligibility signal;
- make EDU completion a license;
- make payment grant professional authority;
- claim production PHI readiness;
- fabricate inventory, pins, opportunities, ratings, revenue, customers, outcomes, or integrations.

## 13. Required Tests

The implementation plan must include RED→GREEN tests proving at minimum:

### Identity / free entry

- a free Person can authenticate without a fabricated organization;
- existing organization-bound clinic login still works;
- a free account cannot enter organization-restricted clinic routes without a valid membership/context;
- claimed role/org/profession state stays visibly distinct from verified state;
- free status never bypasses eligibility, entitlement, or authority.

### Intent continuity

- safe non-sensitive intent survives public → auth → first protected destination;
- unsafe/PHI-like content is rejected or deliberately not persisted;
- return routes remain same-origin validated;
- expired/replayed entry intent does not silently execute consequential actions.

### Grid

- free eligible discovery works without subscription;
- eligibility is evaluated before consequential ranking/matching;
- blocked discoverable items expose the true missing requirement without becoming actionable;
- reputation cannot turn an ineligible candidate eligible;
- a no-money transaction class renders without invented price/payment state;
- patient/private data never enters public Grid projection.

### Map/geolocation

- location permission granted updates real distance ordering and recenters the map;
- denied/unavailable location leaves discovery usable and displays truthful fallback;
- no coordinate means no exact pin;
- map and list selected state remain synchronized;
- all map information needed for action has a list/non-visual equivalent.

### Living Home

- exactly five plane lenses exist and switching lens does not change authority;
- new/free Living Home is non-empty only through real onboarding/Grid/Path state;
- no fake operational metrics are injected;
- Inspector only receives authorized minimum-necessary evidence;
- ActionDock revalidates consequential actions server-side;
- Zumi recomposes/assists but cannot self-authorize an action.

### Accessibility / responsive

- keyboard operation;
- visible focus;
- screen-reader landmarks/labels;
- 44px consequential touch targets;
- reduced motion;
- 200% zoom usability;
- mobile Inspector drawer;
- no required hover-only operation.

## 14. Release Acceptance

A tranche is not complete merely because code is merged.

Required progression:

`DESIGN → RED TEST → IMPLEMENTATION → FOCUSED GREEN → FULL QUALITY → BROWSER QA → MERGE → DEPLOYED SHA VERIFICATION WHERE DEPLOYED`

For the six-screen reference, browser QA must explicitly cover:

- Public Gateway
- Free Entry
- Living Home
- Grid
- Current Visit visual continuity (no rewrite required)
- Mobile recomposition

The artifact remains a comparison reference only. Production acceptance is based on current Master Canon, current Screen Contracts, real server authority, tests, browser behavior, and verified runtime truth.
