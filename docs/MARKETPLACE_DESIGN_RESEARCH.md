# Marketplace Design Research: Airbnb, DoorDash, Uber → Klinikos

Date: 2026-08-14  
Status: `CANONICAL DESIGN RESEARCH / DIRECTIONAL`  
Applies to: public website, Grid discovery, enrollment, matching, transactions, Living Home, and the shared Klinikos design system.

This document records transferable product mechanics from official Airbnb, DoorDash, and Uber sources and turns them into original Klinikos design decisions. It is not a claim that every decision below is implemented. Implementation truth remains in `docs/FEATURE_STATUS.md` and the repository.

## Research question

What makes a large, multi-sided marketplace feel understandable and dependable even when the underlying supply, roles, pricing, location, and fulfillment systems are complex?

The durable pattern is not to copy their screens. It is to:

1. reduce a large marketplace to the user’s immediate intent;
2. show comparable, truthful supply in context;
3. preserve continuity from discovery through fulfillment;
4. expose trust and status at the moment they matter;
5. give each participant a purpose-built operating surface over shared system primitives.

## Official-source observations

| Product | Official evidence | What works | Klinikos translation |
| --- | --- | --- | --- |
| Airbnb | [2025 Summer Release](https://news.airbnb.com/airbnb-2025-summer-release/), [Experiences map improvements](https://news.airbnb.com/introducing-social-features-for-airbnb-experiences/), [global total-price display](https://news.airbnb.com/total-price-display-is-now-standard-globally/), [category-led discovery](https://news.airbnb.com/en-au/a-new-airbnb-for-a-new-world-of-travel-launching-the-biggest-change-to-the-platform-in-a-decade/) | Homes, services, and experiences are discoverable within one system; Trips preserves itinerary continuity; maps relate supply to meaningful places; hosts are vetted; total price supports comparison; category-led browsing helps people discover when they do not know the exact query. | One Grid discovery system for people, work, space, services, equipment, and training capacity; one persistent Path from intent to fulfillment; evidence-backed trust; explicit total economics; browse modes for exact needs and exploration. |
| DoorDash | [major app update](https://about.doordash.com/en-us/news/introducing-doordashs-biggest-app-updates-in-a-decade), [item search with price and ETA](https://about.doordash.com/en-us/news/doordash-features-to-shop-and-save), [search retrieval engineering](https://careersatdoordash.com/blog/how-doordash-leverages-llms-for-better-search-retrieval/), [Prism design-system theming](https://careersatdoordash.com/blog/design-language-system-theming/) | A three-sided marketplace gives consumers, merchants, and Dashers distinct workflows; search can compare an item across merchants with price and ETA; query understanding improves recall while hard business constraints remain deterministic; one design foundation supports different role themes. | Separate buyer, provider/seller, organization, and operator workspaces over one Grid transaction model; compare total cost, availability, distance, and evidence together; let intelligence interpret intent but never override eligibility; maintain a shared Klinikos system with restrained role-specific emphasis. |
| Uber | [Base design system](https://base.uber.com/), [Base sheet pattern](https://base.uber.com/6d2425e9f/p/033e0d-sheet/b/46994b), [Base motion guidance](https://base.uber.com/6d2425e9f/v/0/p/116184-motion), [shipment-location visibility](https://www.uberfreight.com/en-US/blog/shipment-locations-uber-freight) | A map and result sheet operate as one interface; motion clarifies state; continuous tracking reduces status uncertainty; shared views can expose useful progress without revealing sensitive commercial information. | A map and result ledger remain synchronized; movement explains selection and progress; transaction status remains visible; public/shared views use minimum-necessary disclosure and never leak private clinical, exact residential, or private pricing data. |

Research was checked on 2026-08-13. Product details, vendor terms, and public interfaces are time-sensitive and must be reverified before consequential decisions.

## Klinikos design laws derived from the research

### Intent before inventory

The first question is not “which module do you want?” It is “What needs to happen?” A single Exchange Field may accept goals such as “I need an injector in Miami next Thursday,” “Find a wheelchair-accessible room for two afternoons,” or “I can offer ultrasound capacity within 20 miles.” Intelligence may interpret the request, but deterministic code owns authorization, credential policy, availability conflicts, payment truth, and final eligibility.

### One exchange, many resource classes

Grid must not become ten disconnected marketplaces. People, work, spaces, services, equipment, organizations, referrals/capacity, and education resources share identity, organization, demand/supply, availability, eligibility, offers, reservations, financial obligations, fulfillment, incidents, disputes, and reputation. Specialized inputs appear only when the specific resource or transaction requires them.

### Map and result ledger are one control

The map provides spatial context. The result ledger provides comparison, accessibility, evidence, and action. They share query and result truth. Selecting a pin/result should preserve a single selection model; unmapped results stay available in the ledger; map failure never removes usable list discovery.

### Compare the complete decision

Where evidence exists, result comparison should bring together resource/organization, relevant evidence, eligibility state, availability, legitimately computed distance, economics, constraints, next action, and blockers. Never invent ETA, distance, availability, verification, demand, scarcity, savings, or popularity.

### Continuity replaces repeated setup

Discovery should become a resumable transaction or Path rather than forcing the user to restate the same goal. A Grid lifecycle may move through need → results → qualification → offer → acceptance → reservation → obligation/funding → fulfillment → evidence → close/dispute. The customer sees plain language; governed admin surfaces can inspect technical state and audit evidence.

### Trust is contextual evidence

Trust must answer whether a participant can complete this specific transaction safely. Internal review may never masquerade as external authority verification. Evidence should expose source and freshness when it matters.

### Upfront economics

Fixed-price supply should show server-owned amount/fees before commitment. Variable work should show unit and basis. Quote workflows say “Quote required.” Opening checkout is not payment; internal obligation is not payout movement; funding, settlement, refund, dispute, and entitlement stay separate evidence-backed states.

### Purpose-built role surfaces, one language

Buyer/organization, provider/seller, learner/educator, and operator surfaces should prioritize different work while sharing type, spacing, controls, status semantics, accessibility, interaction rhythm, and Klinikos identity.

### Location requires consent and graceful degradation

Browser location follows explicit user action. Exact visitor coordinates are not exposed publicly by default. Provider residential and patient addresses stay private. Manual city/region and non-map list access remain valid paths. Detailed law lives in `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`.

### Motion explains change

Motion connects cause and effect: selection, map focus, transaction progress, or disclosure. Avoid decorative motion and honor reduced-motion preferences.

## Exchange Field

Grid’s primary discovery interaction is the **Exchange Field**, not a clone of a travel map, delivery feed, or job board. Its working anatomy is:

1. intent: what the user needs or can offer;
2. deterministic interpretation and editable direction;
3. context such as time/place/radius/resource class/economics;
4. map/spatial context where useful;
5. result ledger;
6. evidence/economics detail at the point of decision;
7. governed continuation after a request, offer, reservation, or handoff begins.

On small screens, the ledger is primary and the map is an optional mode. On wide screens, map and ledger form a coordinated split view. The experience must not open as a card wall.

## Search and ranking contract

1. Interpret the request into explicit constraints and assumptions.
2. Retrieve candidates across permitted resource classes.
3. Apply visibility, tenant, consent, and publication policy.
4. Apply hard eligibility and schedule/capacity constraints.
5. Rank the remaining candidates using explainable signals.
6. Show why a candidate appears and which facts remain unverified.
7. Ask only material clarifications.
8. Never let model output create credential, payment, verification, or settlement truth.

Keyword search, structured filters, natural-language intent, and browse/category entry may coexist. Natural-language interpretation improves retrieval; deterministic constraints remain authoritative.

## Supply lifecycle

`DRAFT → READINESS GAPS → SUBMITTED → HUMAN/EXTERNAL REVIEW AS REQUIRED → APPROVED → PUBLISHED → PAUSED/EXPIRED/SUSPENDED`

Supply setup should reuse known context, show missing evidence before submission, support draft/resume, separate public listing content from protected evidence, make review source/freshness visible, prevent duplicate publication/double reservation, and explain why a listing is not visible.

## Marketplace measurements

Measure usefulness and trust: time to qualified result, searches with usable supply, clarification/correction rate, map/list consistency, supply completion, offer-to-acceptance, fulfillment, incident/dispute/failed-settlement rates, current evidence coverage, location-denied success, and whether users understand what happens next. Do not optimize manufactured urgency, compulsive refresh, hidden fees, or notification volume.

## Explicit non-copies

Klinikos will not adopt fake urgency, fictional discounts/popularity, ratings as substitutes for credential evidence, unnecessary precise tracking, surprise permission prompts, public provider home addresses, opaque consequential ranking, endless feeds that obscure completion, or marketplace growth that outruns dispute/safety/privacy/operator controls.

## Implementation status after Grid MVP merge

Already implemented and merged on 2026-08-14: the Exchange Field, generalized public Grid lanes, explicit opt-in browser geolocation, an interactive keyless OpenStreetMap fallback, optional Google map-provider path, real-only markers, permission-derived coordinate radius matching, public coordinate reduction, all-term state-aware discovery, synchronized query-matched resource map/ledger results, truthful empty-market behavior, and governed continuation boundaries.

Next design/product convergence priorities are deeper inline evidence/economics dossiers, stronger transaction continuity from a selected supply item, role-specific seller/provider readiness, structured time/weekday interpretation, and privacy-safe marketplace instrumentation. Implementation truth always lives in `docs/FEATURE_STATUS.md` and the current code.