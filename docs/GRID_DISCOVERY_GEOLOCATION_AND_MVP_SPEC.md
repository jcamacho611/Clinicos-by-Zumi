# Grid Discovery, Geolocation, and MVP Specification

Date: 2026-08-14  
Status: `AUTHORITATIVE SPECIALIST SPEC`  
Verified repository baseline: `main@4b2a5dc89f3dae7a175b2f8eda9f83f866b77de6`

This specification governs the current Grid discovery, location, public inventory, and transaction-continuation experience. It inherits `docs/SOURCE_OF_TRUTH.md` and `docs/MARKETPLACE_DESIGN_RESEARCH.md`.

It does **not** claim that external geocoding/routing, board verification, malpractice verification, payment settlement, or marketplace payouts are live.

## Product outcome

A person can state a healthcare need or offer, let Klinikos deterministically route the request, discover permitted real supply, use location when they explicitly choose to, and continue into a governed workflow without fake availability or fake transaction completion.

Grid is a generalized healthcare exchange across work, providers, spaces, products, equipment, services, organizations/network capacity, education, and referrals.

## Current MVP implementation

Merged in PR #74 and verified on its exact final head:

- one public **I NEED / I HAVE Exchange Field**;
- deterministic routing across generalized Grid lanes;
- all meaningful text terms applied to discovery, including state-name/state-code aliases;
- the visitor's explicit need/offer choice remains authoritative while they type;
- public provider, location, and universal-resource inventory remains evidence-backed rather than fabricated;
- explicit **Use my location** permission flow;
- browser geolocation is never required merely to use Grid;
- real Haversine distance when both saved demand and supply have coordinates;
- coordinate-radius matching is the geographic hard gate when a real origin/radius exists, including across state boundaries;
- state is a coarse fallback only when coordinate-radius matching is unavailable;
- public coordinate precision is reduced while governed server-side matching can use stored coordinates;
- database constraints reject half-coordinate records and out-of-range coordinate pairs;
- interactive OpenStreetMap fallback works without Google credentials;
- optional Google map provider path remains available when its deployment configuration exists;
- map and query-matched universal-resource ledger use the same filtered result set;
- empty markets do not receive invented markers;
- signed-out request paths use same-origin continuation controls;
- provider-listing actions are labeled truthfully when they start a generic governed provider-need flow rather than falsely claiming the selected provider is already reserved.

## Geographic law

### Permission timing

- Never request browser geolocation on page load.
- Request it only after an explicit user action.
- Explain the immediate benefit before or beside the control.
- Do not repeatedly prompt after denial.
- Manual/non-map discovery remains valid.

### Coordinate truth

A coordinate is usable only when latitude and longitude are both present, finite, and within valid ranges.

When saved demand has a valid origin and radius:

1. a candidate without coordinates is not eligible for exact-radius matching;
2. real Haversine distance is computed;
3. the requested radius decides geographic eligibility;
4. state text does not override that real distance.

When an exact origin/radius is unavailable, declared city/state/service-area information may be used as a coarse discovery signal. Coarse text must never be presented as an exact distance.

### Privacy

- Exact visitor coordinates are not public marketplace inventory.
- Public resource coordinates use reduced precision.
- Patient addresses never become public Grid demand/supply coordinates.
- Provider residential addresses are private by default.
- Public provider location uses approved practice location, service area, or an appropriately approximate representation.
- Raw precise coordinates should not be placed in public URLs, analytics, or public metadata by default.

## Map and result-ledger contract

- The map is spatial context, not the source of inventory truth.
- The ledger remains usable without a map.
- Only real, approved, publishable supply creates inventory markers.
- Query-matched map resources and universal-resource ledger results must agree.
- Unmapped or remote supply remains discoverable in the ledger when otherwise eligible.
- Map-provider failure cannot silently convert a real listing into a fake marker or fake distance.
- The mobile experience is ledger-first; larger screens may use split map/ledger composition.

Deeper selection synchronization, clustering, bounds-driven "Search this area," and richer result dossiers remain convergence work rather than claims of current completion.

## Intent contract

Natural-language interpretation is routing assistance, not authority.

The current deterministic interpreter may infer whether the visitor needs or offers something, the broad Grid lane, and meaningful search terms. Hard truth remains server/deterministic:

- authentication and visibility;
- tenant/relationship scope;
- publication state;
- credential/eligibility policy;
- geography where authoritative data exists;
- schedule/capacity;
- conflicts/holds;
- transaction safety;
- financial and settlement state.

Klinikos Intelligence may improve interpretation later, but model output must never create credential, payment, verification, settlement, or safety truth.

## Search and ranking law

1. interpret the request;
2. retrieve permitted candidates;
3. apply visibility/publication policy;
4. apply hard eligibility and capacity constraints where the governed transaction requires them;
5. rank using explainable signals;
6. expose unknowns rather than inventing them.

All meaningful user search terms must be respected. Clearing a client-side search must be capable of recovering the underlying lane inventory instead of being trapped by an irreversible server-side first-term filter.

Structured time/weekday interpretation is a next convergence target; until implemented, the interface must not pretend a weekday phrase was deterministically applied if it was only treated as free text.

## Supply lifecycle

Target generalized supply lifecycle:

`DRAFT → READINESS GAPS → SUBMITTED → REVIEW → APPROVED → PUBLISHED → PAUSED/EXPIRED/SUSPENDED`

Current provider/location/resource enrollment paths cover meaningful parts of this lifecycle, but role-specific onboarding and external authority verification are still incomplete. Internal review must never masquerade as external verification.

## Transaction continuation

The existing Grid transaction core supports demand, offers, acceptance, reservations, financial obligations, fulfillment events, disputes, safety incidents, holds, and concurrency protection.

Discovery actions must either:

- preserve the specific selected supply into a governed next step, or
- state plainly that they are starting a generic request.

They must never discard selection while labeling the action as though a specific booking/request continued.

A future stronger experience should preserve selected supply, evidence, economics, and status into a resumable Grid Path visible from Living Home and the correct role workspace.

## Degraded-state requirements

| State | Required behavior |
| --- | --- |
| Google map not configured | Use the keyless OSM/list path; do not claim Google is live. |
| Location denied/unavailable | Keep Grid usable without device location. |
| Candidate lacks coordinates | Do not invent exact distance or include it in exact-radius eligibility. |
| No mapped results | Keep real ledger results and an honest empty/unmapped state. |
| No qualified results | Explain the absence without manufacturing supply. |
| External verification unavailable | Do not upgrade verification state. |
| Payment/payout rail unavailable | Preserve internal intent/obligation only; do not claim settlement or funds moved. |
| Reservation conflict | Concurrency protection must leave one winner and no partial loser state. |

## Acceptance contract

### Verified now

- [x] Exchange Field can route generalized need/offer language.
- [x] Manual I NEED/I HAVE override survives typing.
- [x] Public browse uses real reviewed inventory only.
- [x] All meaningful search terms participate in filtering.
- [x] State names can match state codes in public discovery.
- [x] Explicit opt-in browser location is available.
- [x] OSM fallback provides an interactive map without Google credentials.
- [x] Empty market does not receive a fabricated marker.
- [x] Coordinate radius uses real Haversine distance and can cross state boundaries.
- [x] Half-coordinate database writes are rejected by the migration constraint.
- [x] Query-matched universal-resource map and ledger results agree.
- [x] Exact PR candidate passed fresh migrations, TypeScript, lint, tests, all DB-backed MVP journeys, production build/start smoke, and the exact deploy contract.

### Next convergence targets

- [ ] Structured time/weekday parsing that initializes availability filters without turning day names into ordinary text terms.
- [ ] Stronger pin/ledger selection and focus synchronization.
- [ ] Manual city/ZIP/place origin editing and richer radius controls.
- [ ] Inline evidence/economics dossier with freshness/source labels.
- [ ] Preserve a selected provider/resource directly into the governed request/offer Path where policy permits.
- [ ] Converge seller/provider/location readiness and publication UX.
- [ ] Privacy-safe marketplace instrumentation.
- [ ] Verify actual post-deploy browser behavior separately from repository CI.

## External gates

Still `PENDING CONNECTION` or environment-specific until separately verified:

- Google Maps key/map ID and richer Google provider path;
- contracted geocoding/routing service and service-level guarantees;
- external provider-license authority/vendor verification;
- malpractice verification source;
- production payment/payout processor authority;
- any regulated fulfillment rail requiring vendor contracts/credentials.

Repository capability must not be described as external production completion.