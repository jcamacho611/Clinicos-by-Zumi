# Grid Discovery, Geolocation, and MVP Specification

Date: 2026-08-13  
Status: `AUTHORITATIVE SPECIALIST SPEC`  
Repository baseline inspected: `main@a8821523d60f11ad863572df5493d84a6a944410`

This specification turns the current Grid browse, map, intent, enrollment, trust, and transaction foundations into one coherent MVP experience. It inherits `docs/SOURCE_OF_TRUTH.md` and `docs/MARKETPLACE_DESIGN_RESEARCH.md`.

It does not claim that external maps, routing, credential verification, malpractice verification, or payouts are live.

## Product outcome

A person can express a healthcare resource need or offer, understand what Klinikos inferred, discover permitted real supply, compare evidence and economics, continue into a governed transaction, and recover from denial, missing data, or failed external services.

The experience is the **Exchange Field**:

- one intent line;
- editable interpreted constraints;
- synchronized map and result ledger when spatial context helps;
- evidence/economics dossier;
- persistent Path through offer, reservation, fulfillment, and resolution.

## Current implementation audit

| Area | Current implementation evidence | Truth on inspected baseline | MVP gap |
| --- | --- | --- | --- |
| Public browse composition | `src/app/grid/browse/page.tsx` | Hero/lane controls, map, universal resource browser, and a separate marketplace browser are composed on one page. | Two discovery systems compete instead of one query/result model. |
| Google map adapter | `src/components/grid/google-grid-map.tsx` | Truthful unconfigured state; real resource markers only; “You are here” marker; actual browser geolocation; bounds fitting; list remains usable when map is unavailable. | Permission is requested automatically after map configuration instead of following an explicit user action; no complete manual location/radius/search-this-area flow. |
| Live map/rail | `src/components/grid/grid-live-map.tsx` | Map and side rail exist; mapped universal resources can appear; unmapped resources remain visible. | Providers/locations/resources are not all represented through one synchronized spatial/result contract. |
| Intent interpretation | `src/lib/grid/intent-engine.ts` | A limited set of phrases can infer several provider/work/readiness intents and basic time/location cues. | Generalized resource classes, quantities, price, credentials, accessibility, availability, confidence, editable assumptions, and deterministic clarification are incomplete. |
| Universal resource repository | `src/lib/grid/resource-repository.ts` | Generalized resources and publication concepts exist; public visibility depends on actual approved records and some paths remain demo/synthetic-organization dependent. | Production supply onboarding, moderation, deduplication, real inventory density, and operational publication need convergence. |
| Transaction/trust core | Grid services, APIs, DB-backed journeys | Offer, acceptance, reservation, financial obligation, incidents/disputes/holds, and concurrency protection exist internally. | Discovery-to-transaction continuity and customer-facing status require one Path. |
| External services | environment/configuration boundaries | Map adapter can be configured. External verification and payout rails remain separate dependencies. | No UI or copy may imply live routing, board verification, malpractice verification, or moved funds without evidence. |

This audit records inspected code, not external production verification.

## Primary user flow

1. **State intent**  
   The user types what they need or can offer. Browse/category entry remains available.

2. **Confirm interpretation**  
   Klinikos shows one editable sentence and compact constraint chips. Example: “Injector coverage · Miami · Thu Aug 20 · 9am–5pm · license required.” If one missing fact materially changes eligibility, ask one question.

3. **Choose location context**  
   The user may select “Use my location,” enter city/ZIP/address, select a saved approved location, draw/choose a service area, or continue without location if the resource class permits it.

4. **Review qualified results**  
   Hard-ineligible results are removed or clearly separated according to policy. Potentially eligible results name the missing evidence. Results and map share selection and scope.

5. **Inspect a dossier**  
   Open evidence, availability, location precision, economics, explanation, organization, and next action without losing the search.

6. **Begin a governed Path**  
   Apply, request, offer, reserve, refer, or enroll. The Path remains visible in Living Home and the appropriate Grid workspace.

7. **Complete or recover**  
   Status, human review, funding/obligation, fulfillment evidence, cancellation, incident, dispute, and fallback are explicit.

## Geolocation interaction law

### Permission timing

- Never request browser geolocation on page load.
- Request it only after an explicit control such as **Use my location**.
- Explain the immediate benefit before the browser prompt: “Use your location to sort nearby approved resources.”
- Permission is contextual and revocable. It is not a condition for using Grid unless the specific transaction genuinely requires location.
- Do not repeatedly prompt after denial. Offer manual alternatives.

### Precision and persistence

- Visitor coordinates are used client-side for the current discovery session by default.
- Do not persist precise visitor coordinates, movement history, or permission result unless a separately explained feature requires it and the user consents.
- Round, coarsen, or discard location as soon as exact precision is unnecessary.
- A **You** marker is visually and semantically distinct from marketplace inventory.
- Analytics must not receive raw precise coordinates. Use coarse region or an explicitly approved privacy-preserving bucket if measurement is necessary.
- Logs, errors, traces, session replay, URLs, and referrers must not contain raw coordinates.

### Supply location privacy

- Never publish a provider’s residential address by default.
- Provider supply uses an approved practice location, service area, or appropriately approximate point.
- Facility/resource pins use reviewed location data and an explicit publication decision.
- Patient addresses never become public Grid supply or demand coordinates.
- Exact addresses may be revealed later only when required for an authorized transaction and allowed by policy/consent.
- A location record needs provenance, precision class, freshness, visibility, and owner/organization.

Recommended precision classes:

| Class | Use | Public display |
| --- | --- | --- |
| Exact approved site | Clinic, facility, room, equipment location approved for publication | Exact or entrance-level point if owner authorized |
| Approximate site | Sensitive provider/service location | Neighborhood/area centroid with “Approximate” label |
| Service area | Mobile provider or regional service | Polygon/radius/cities; no home point |
| City/ZIP | Broad discovery or manual input | City/ZIP only |
| Unmapped | Remote or missing coordinate | List result with no pin |

### Manual alternatives

Always provide:

- city or ZIP input;
- address/place search when configured;
- saved organization location when authenticated and authorized;
- “Search without location” where valid;
- radius/region selection;
- clear/reset location.

For location enrollment, “Use current location” is appropriate only when the user confirms they are physically at the resource site. Otherwise require address/place entry and a map/list confirmation. Never silently use device location as the resource’s permanent address.

## Map and result-ledger contract

The canonical query state includes:

- intent text and interpreted resource classes;
- structured constraints;
- map center/bounds and chosen radius/region;
- sort;
- filters;
- selected result;
- pagination/cursor;
- permission-safe location mode;
- freshness timestamp.

Rules:

1. One query service produces the result ledger and mappable subset.
2. A map pin and result row share a stable resource/result identifier.
3. Pin selection focuses the row; row selection focuses the pin when it exists.
4. Keyboard focus and screen-reader announcement mirror visual selection.
5. Panning does not silently discard work. Show **Search this area** unless live update is explicitly chosen.
6. Results outside the viewport may remain available when radius/region—not visible bounds—is the active constraint.
7. Unmapped and remote results remain in the ledger.
8. Clustering is required when density would hide selection or harm performance.
9. Result count, scope, sort, filters, and data freshness are visible.
10. The selected result survives map/list mode switches and responsive layout changes.
11. Map load, tile, geocoding, or routing failure cannot block list discovery or transaction continuation.
12. Shareable search URLs contain coarse/declared location and filters, never raw device coordinates.

### Responsive behavior

- **Wide:** synchronized split pane; ledger remains independently scrollable.
- **Medium:** resizable or mode-switch layout with persistent intent/filters.
- **Small:** ledger first; optional map mode; selected result returns to the same scroll position.
- Bottom sheets/drawers must be dismissible, keyboard reachable, screen-reader labeled, and safe-area aware.

## Intent and constraint contract

A parsed intent is a proposal, not authority. It should include:

- demand or supply;
- one or more resource classes;
- role/capability;
- time window and timezone;
- location mode, region, and radius;
- quantity/capacity/duration;
- required credentials/eligibility;
- accessibility, language, equipment, modality, or environment requirements;
- economics/price preference;
- urgency;
- confidence and source span for each inferred field;
- assumptions awaiting confirmation.

Deterministic constraints:

- authentication and visibility;
- tenant/organization/relationship scope;
- consent/minimum necessary;
- publication status;
- identity and credential policy;
- geography/licensing jurisdiction;
- schedule/capacity;
- conflicts and holds;
- transaction safety;
- financial eligibility.

Zumi may broaden retrieval, suggest synonyms, explain why results appear, and ask a clarification. It cannot mark a credential current, a participant eligible, a price settled, a payout moved, or a transaction safe.

## Ranking and explanation

Ranking occurs only after hard eligibility. Possible explainable signals include:

- constraint match;
- verified relevant capability;
- availability fit;
- distance or service-area fit;
- total economics;
- organization/relationship preference allowed by policy;
- response and completion history;
- evidence freshness;
- objective incident/dispute outcomes;
- user-selected sort.

A result must say why it appears. “Nearby” requires a legitimate coordinate/distance method. “ETA” requires an actual routing source and must identify whether it is estimated. Straight-line distance must not be labeled travel time.

Sponsored or promoted supply, if ever introduced, must be labeled and may not bypass eligibility or safety ranking.

## Result ledger and dossier

Every result row should support rapid comparison:

- plain resource title and class;
- participant/organization;
- availability;
- location precision and distance basis;
- relevant evidence with source and freshness;
- total fixed economics, unit/estimate, or quote-required state;
- reason it matches;
- missing facts or blockers;
- primary next action.

The dossier expands inline or in a connected drawer/sheet and may include:

- permitted profile and organization context;
- credential/eligibility evidence relevant to this transaction;
- schedule/capacity detail;
- operating requirements and accessibility;
- cancellation/refund/dispute terms;
- history/reputation with context;
- location and service area;
- fee calculation;
- question/request channel;
- audit-safe next action.

Do not reduce the dossier to a consumer star rating.

## Enrollment and publication

One generalized enrollment flow branches after resource type is understood.

1. reuse verified identity and organization context;
2. choose demand/supply and resource class;
3. capture specialized details;
4. add approved location or service area;
5. set availability/capacity;
6. define economics or quote policy;
7. attach evidence;
8. show readiness gaps and public preview;
9. submit for the required review;
10. publish only after truthful approval;
11. allow pause, expire, renew, suspend, and recover.

Duplicate detection occurs before publication. A participant must understand who owns the listing, what will be public, which evidence is private, what needs review, and why the resource may be unavailable.

## Transaction continuation

Discovery should create or attach to a persistent Path. A result action cannot disappear into an unrelated dashboard.

Visible milestones:

- request/application created;
- eligibility pending/verified/failed;
- offer proposed/countered/accepted/expired;
- capacity held/reserved/released;
- obligation or funding status;
- fulfillment scheduled/in progress/completed;
- evidence submitted/accepted;
- cancellation/refund/dispute/incident;
- closed and reputation/evidence update.

Only verified evidence advances financial, credential, fulfillment, and settlement states.

## Error and degraded states

| State | Required response |
| --- | --- |
| Map not configured | Explain that spatial view is unavailable; keep complete list/search. |
| Location permission denied | Stop prompting; provide city/ZIP/manual search and help for browser settings. |
| Location timeout/unavailable | Preserve typed intent and filters; offer retry/manual entry. |
| Geocoding failed | Keep the user’s text; ask for a more specific place or allow region-only search. |
| No mapped results | Show real unmapped/remote results and honest empty-market guidance. |
| No qualified results | Explain which hard constraints removed candidates; allow the user to edit them without claiming supply. |
| Stale availability/evidence | Label freshness and require confirmation/review before commitment. |
| Listing withdrawn during action | Fail safely, preserve the Path, explain release/refund/alternative next step. |
| Conflicting reservation | One winner; no partial loser state; provide recoverable alternatives. |
| External verification down | Do not upgrade status; queue/manual-review only if allowed. |
| Payment/payout rail down | Preserve internal intent/obligation; do not claim settlement or moved funds. |

## Accessibility and safety acceptance

- The complete discovery and transaction start works without a map.
- Every map action has a keyboard/list equivalent.
- Selection, counts, errors, and permission results are announced.
- Color is not the only carrier of verification, availability, or risk.
- Touch targets, focus order, zoom, contrast, and reduced-motion behavior are verified.
- Empty, loading, partial, stale, denied, blocked, and failed states are designed.
- Sensitive details are excluded from accessible labels, URLs, analytics, screenshots, and public metadata.
- Emergency or clinical-urgency language never implies Grid replaces emergency services or clinical triage.

## MVP acceptance tests

### Discovery

- [ ] A user can state needs for a person, shift/work, space, service, equipment, organization/capacity, or education resource.
- [ ] The interpretation is editable and identifies assumptions.
- [ ] Hard eligibility executes before ranking.
- [ ] Result explanations identify actual matching signals and unknowns.
- [ ] Mapped and unmapped results share one result ledger.

### Geolocation

- [ ] No browser location prompt occurs before **Use my location**.
- [ ] Grant, deny, dismiss, timeout, unavailable, and insecure-context states are tested.
- [ ] City/ZIP/manual search reaches useful results without permission.
- [ ] Raw visitor coordinates are absent from URL, server persistence, logs, analytics, and session replay by default.
- [ ] Provider residential addresses are not public.
- [ ] Map failure preserves complete list and selected-result state.
- [ ] Pin/list focus is synchronized and keyboard accessible.
- [ ] **Search this area**, radius, reset, clustering, and responsive mode switches behave deterministically.

### Supply and trust

- [ ] Draft/resume, readiness, review, publish, pause, expire, suspend, and duplicate handling are tested.
- [ ] Public preview distinguishes published fields from protected evidence.
- [ ] Internal review and external verification use different labels.
- [ ] No synthetic listings appear as production supply.

### Transaction

- [ ] Discovery continues into offer/application, acceptance, reservation, obligation, fulfillment evidence, and closure.
- [ ] Conflict/concurrency leaves no partial state.
- [ ] Cancellation, withdrawal, incident, dispute, hold, refund, and manual recovery states are usable.
- [ ] A ledger obligation never appears as moved payout.
- [ ] The active Path appears in Living Home and the correct role workspace.

### Quality and operations

- [ ] Responsive, keyboard, screen-reader, reduced-motion, error, empty, and degraded states pass.
- [ ] Operator queues cover publication review, eligibility exceptions, duplicates, holds, disputes, external failures, and reconciliation.
- [ ] Audit records explain who/what changed consequential state.
- [ ] Tests and docs use the repository status vocabulary.
- [ ] Full repository and MVP candidate gates pass on the exact commit.
- [ ] Production configuration and deployed behavior are verified separately.

## Implementation sequence

1. Define one typed discovery query/result contract and adapter boundary.
2. Merge the two public browse result systems into one ledger.
3. Gate browser location behind explicit action; add manual location and permission states.
4. Synchronize bounds, selection, focus, clustering, and responsive modes.
5. Expand intent parsing and editable constraints while keeping eligibility deterministic.
6. Add result explanations, trust/economics dossier, and freshness.
7. Converge generalized seller/location enrollment and publication review.
8. Connect discovery actions to the existing transaction Path and Living Home.
9. Add privacy-safe analytics and operational queues.
10. Verify the complete experience in browser and DB-backed journeys before changing status to Built.
