# Continuation Prompt: Bring Klinikos Grid to MVP

Status: `EXECUTION PROMPT`  
Use with: a coding agent that has read/write access to `jcamacho611/Clinicos-by-Zumi` and can run the repository checks.

---

You are continuing **Klinikos Grid** from the current repository state to a merge-ready MVP. Do not redesign from memory, generic marketplace conventions, or screenshots alone. The repository is authoritative.

## Required orientation

Before changing code:

1. Read `docs/SOURCE_OF_TRUTH.md`.
2. Read `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md`.
3. Read `docs/MARKETPLACE_DESIGN_RESEARCH.md`.
4. Read `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md` completely.
5. Read `docs/FEATURE_STATUS.md`, `docs/EXTERNAL_DEPENDENCY_MATRIX.md`, `docs/EXPOSED_UI_AUDIT.md`, and `docs/MVP_JOURNEYS.md`.
6. Inspect current `main`, active branches/PRs, CI, relevant route/component/service/schema/test files, and any uncommitted work.
7. Reconcile documentation with implementation. If they conflict, preserve implementation truth while following the current canonical target. Do not label roadmap work as built.

## Product objective

Build the **Grid Exchange Field**: an original Klinikos experience where a participant can state a healthcare resource need or offer, edit what Klinikos understood, discover permitted real supply, compare evidence/economics, and continue through a governed, resumable transaction Path.

Grid is a generalized healthcare exchange—not a job board and not ten separate marketplaces. It must support the shared primitives for people/providers, shifts/work, rooms/chairs/facilities, services, equipment, organizations/capacity, referrals/diagnostics where permitted, and education/training resources.

Klinikos remains a Living Interface. Lead with “What needs to happen?” Do not expose engine, registry, state-machine, capability, or entitlement vocabulary to ordinary users.

## Non-negotiable experience

Create one coherent public browse experience at `/grid/browse`:

- a continuous intent field;
- an editable plain-language interpretation;
- compact filters/constraints;
- an optional spatial field;
- one synchronized accessible result ledger;
- an inline/connected result dossier;
- one clear next action;
- persistent continuation in Living Home and the relevant Grid workspace after a Path begins.

Do not open with a dense card wall. On mobile the ledger is primary and the map is an optional mode. On wide screens use a calm split pane. Preserve the Klinikos premium Aegean design language: space, light, stone/sea color, strong typography, restrained motion, no tourist motifs, neon sci-fi, heavy glow, or generic enterprise compression.

## Geolocation law

Implement these behaviors exactly:

1. Do not request browser location on page load.
2. Request it only after the user chooses **Use my location** and sees why it helps.
3. Support grant, denial, dismissal, timeout, unavailable, and insecure-context states.
4. Provide city/ZIP/manual place entry, saved approved location, reset, radius/region, and search-without-location paths where valid.
5. Do not persist precise visitor coordinates by default.
6. Keep raw visitor coordinates out of URLs, logs, analytics, traces, session replay, and referrers.
7. Keep the visitor marker distinct from inventory.
8. Publish pins only for real approved resource locations.
9. Never expose provider residential or patient addresses by default; use approved practice locations, service areas, or appropriately approximate public points.
10. Keep unmapped/remote results usable in the ledger.
11. Keep the full non-map experience working if maps, geocoding, routing, or permissions fail.
12. Do not label straight-line distance as travel time or show ETA without a real routing source.

For resource enrollment, **Use current location** is allowed only after the user confirms they are physically at the resource site. Otherwise require address/place entry and confirmation.

## Query, map, and ledger contract

Create one typed query/result contract shared by public discovery:

- intent and inferred resource classes;
- structured editable constraints;
- time window/timezone;
- chosen/manual location mode;
- center/bounds/radius or region;
- filters and sort;
- selected result;
- pagination/cursor;
- freshness;
- permission-safe client location state.

Create stable identities between pins and results:

- pin selection focuses/announces the result;
- result selection focuses the pin when mapped;
- panning offers **Search this area** unless the user explicitly enables live update;
- selection survives list/map mode changes;
- clustering handles dense supply;
- unmapped results remain in the same ledger;
- keyboard, screen reader, touch, zoom, focus order, and reduced-motion paths work.

Do not silently discard typed intent, filters, scroll position, or a selected result.

## Intent and eligibility

Expand the current intent interpreter across generalized resource types. Capture, with confidence and editable assumptions:

- demand or supply;
- resource class;
- role/capability;
- date/time/timezone/duration;
- location/radius/service area;
- quantity/capacity;
- credentials/eligibility;
- accessibility/language/equipment/modality;
- price/economics preference;
- urgency.

Ask at most one material clarification at a time.

Zumi may interpret language, broaden retrieval, suggest synonyms, and explain. Deterministic server code owns:

- authentication, tenant, visibility, and relationship scope;
- consent and minimum necessary;
- publication;
- identity and credential policy;
- jurisdiction;
- schedule/capacity/conflicts;
- holds and safety;
- financial and transaction truth.

Apply hard eligibility before ranking. Explain why each result appears and what remains unverified. Never let model output create credential, verification, payment, payout, settlement, availability, or safety truth.

## Result dossier

A result should expose enough context to decide without losing the search:

- resource and class;
- participant/organization;
- availability;
- public location precision and legitimate distance basis;
- relevant evidence, source, and freshness;
- total fixed economics, unit/estimate, or **Quote required**;
- reason it matches;
- missing facts/blockers;
- primary next action;
- permitted operating/accessibility requirements;
- cancellation/refund/dispute terms;
- contextual history/reputation.

A consumer star rating is not a substitute for credential or eligibility evidence.

## Supply and publication

Converge seller, provider, location, and generalized resource enrollment into one resumable readiness flow that branches after resource type is known:

`IDENTITY/ORG → RESOURCE TYPE → DETAILS → APPROVED LOCATION/SERVICE AREA → AVAILABILITY → ECONOMICS → EVIDENCE → READINESS GAPS → PUBLIC PREVIEW → REVIEW → PUBLISH`

Reuse known identity/organization/credential context. Separate public listing fields from protected evidence. Add duplicate handling. Support draft, resume, submit, review, approve, publish, pause, expire, renew, suspend, and recover. Never publish synthetic inventory as production supply.

## Transaction continuation

Connect discovery to the existing governed Grid primitives and a persistent Path:

`NEED → INTERPRETED → RESULTS → ELIGIBILITY → OFFER/APPLICATION → ACCEPTANCE → RESERVATION → OBLIGATION/FUNDING → FULFILLMENT → EVIDENCE → CLOSED OR DISPUTED`

Show plain-language milestones in Living Home and the correct role workspace. Preserve concurrency safety and no-partial-loser behavior. Distinguish internal financial obligation from external payout movement. Support withdrawal, cancellation, release, refund state, incident, dispute, hold, external failure, and operator/manual recovery.

## Implementation sequence

Work in independently verifiable vertical slices. Continue through all unblocked slices; do not stop at a plan.

### Slice 1 — Discovery contract and geolocation consent

- define the typed discovery query/result contract;
- move browser location behind explicit consent;
- implement manual location and all permission/degraded states;
- add privacy-focused tests.

### Slice 2 — One public result ledger

- merge the competing public discovery surfaces;
- preserve generalized resource support;
- implement loading, empty, partial, stale, unmapped, and failed states;
- remove or redirect dead/duplicative controls truthfully.

### Slice 3 — Synchronized map and responsive modes

- connect bounds, radius/region, selection, focus, clustering, and **Search this area**;
- verify list-first mobile and split-pane desktop;
- verify keyboard/screen-reader/reduced-motion behavior.

### Slice 4 — Intent, constraints, ranking, and dossier

- expand typed intent extraction;
- make assumptions editable;
- enforce hard eligibility before explainable ranking;
- add the evidence/economics dossier;
- test against invented price, availability, distance, ETA, and verification.

### Slice 5 — Enrollment and publication

- converge provider/location/seller/resource setup;
- add readiness, protected/public preview, duplicate protection, review, publication lifecycle, and recovery;
- preserve real-only inventory.

### Slice 6 — Persistent transaction Path

- connect result actions to offer/application, reservation, obligation, fulfillment, trust/problem, and recovery state;
- surface active progress in Living Home and role workspace;
- expand DB-backed journeys where necessary.

### Slice 7 — Operator readiness and instrumentation

- provide publication, duplicate, exception, hold, dispute, failure, and reconciliation queues;
- add privacy-safe product events only after event contracts are explicit;
- verify alerts/runbooks/fallbacks needed for first real transactions.

## Engineering rules

- Inspect and classify existing code before changing it: `KEEP / HARDEN / REFACTOR / MOVE / SPLIT / MERGE / DEPRECATE / REPLACE / BUILD NEW / DEFER`.
- Preserve unrelated user work and active branch intent.
- Reuse current services, repositories, schemas, design tokens, components, and tests where correct.
- Do not perform a wholesale rewrite for naming or aesthetic purity.
- Server APIs own authorization, validation, tenant scope, evidence, and consequential state.
- Use existing status vocabulary consistently.
- Add migrations only when required; never edit committed migration history.
- Use synthetic/test data unless production gates are explicitly satisfied.
- No fake actions, links, metrics, pins, demand, transactions, integrations, or “live” claims.
- Manual fallback is acceptable only when real, recoverable, and labeled.
- Update canonical docs and audits when implementation truth changes.

## Verification gate

Before calling the work MVP-ready:

- run targeted tests for every changed slice;
- run Prisma validation/generation and migrations against fresh PostgreSQL;
- run strict TypeScript and lint;
- run the full test suite;
- run all DB-backed MVP journeys;
- run the production build and startup smoke;
- run the exact production deploy contract;
- verify public and authenticated Grid flows in a real browser at desktop and mobile widths;
- verify keyboard, screen-reader semantics, reduced motion, zoom, empty/loading/error/denied/degraded states, and no horizontal overflow;
- inspect the exact PR head, CI, diff, and review feedback;
- update `docs/FEATURE_STATUS.md` only for behavior actually implemented and verified.

Repository success does not prove external production deployment. Verify the deployed service separately before claiming it is live.

## Required handoff

Finish merge-ready:

- a focused branch and accurate commits;
- implementation and tests;
- screenshots or browser evidence for major responsive states;
- an updated PR describing current truth, external blockers, and verification;
- green checks on the exact head;
- no unresolved actionable review blockers;
- a concise list of anything genuinely blocked by credentials, vendor enrollment, contract, BAA, payment account, or production approval.

Do not merge unless explicitly authorized. Do not stop after producing another plan when implementation access is available.
