# Marketplace Design Research: Airbnb, DoorDash, Uber → Klinikos

Date: 2026-08-13  
Status: `CANONICAL DESIGN RESEARCH / DIRECTIONAL`  
Applies to: public website, Grid discovery, enrollment, matching, transactions, Living Home, and the shared Klinikos design system.

This document records transferable product mechanics from official Airbnb, DoorDash, and Uber sources and turns them into original Klinikos design decisions. It is not a claim that every decision below is implemented. Implementation truth remains in `docs/FEATURE_STATUS.md` and the repository.

## Research question

What makes a large, multi-sided marketplace feel understandable and dependable even when the underlying supply, roles, pricing, location, and fulfillment systems are complex?

The answer is not “copy their screens.” The durable pattern is:

1. reduce a large marketplace to the user’s immediate intent;
2. show comparable, truthful supply in context;
3. preserve continuity from discovery through fulfillment;
4. expose trust and status at the moment they matter;
5. give each participant a purpose-built operating surface over shared system primitives.

## Official-source observations

| Product | Official evidence | What works | Klinikos translation |
| --- | --- | --- | --- |
| Airbnb | [2025 Summer Release](https://news.airbnb.com/airbnb-2025-summer-release/), [Experiences map improvements](https://news.airbnb.com/introducing-social-features-for-airbnb-experiences/), [global total-price display](https://news.airbnb.com/total-price-display-is-now-standard-globally/), [category-led discovery](https://news.airbnb.com/en-au/a-new-airbnb-for-a-new-world-of-travel-launching-the-biggest-change-to-the-platform-in-a-decade/) | Homes, services, and experiences are discoverable within one system; Trips preserves itinerary continuity; maps relate supply to meaningful places; hosts are vetted; total price supports comparison; category-led browsing helps people discover when they do not know the exact query. | One Grid discovery system for people, work, space, services, equipment, and training capacity; one persistent Path from intent to fulfillment; evidence-backed trust; explicit total economics; browse modes for users who know the need and users who are exploring. |
| DoorDash | [major app update](https://about.doordash.com/en-us/news/introducing-doordashs-biggest-app-updates-in-a-decade), [item search with price and ETA](https://about.doordash.com/en-us/news/doordash-features-to-shop-and-save), [search retrieval engineering](https://careersatdoordash.com/blog/how-doordash-leverages-llms-for-better-search-retrieval/), [Prism design-system theming](https://careersatdoordash.com/blog/design-language-system-theming/) | A three-sided marketplace gives consumers, merchants, and Dashers distinct workflows; search can compare an item across merchants with price and ETA; query understanding improves recall while hard business constraints remain deterministic; one design foundation supports different role themes. | Separate buyer, provider/seller, organization, and operator workspaces over one Grid transaction model; compare total cost, availability, distance, and evidence together; let Zumi interpret intent but never override eligibility; maintain a shared Klinikos system with restrained role-specific emphasis. |
| Uber | [Base design system](https://base.uber.com/), [Base sheet pattern](https://base.uber.com/6d2425e9f/p/033e0d-sheet/b/46994b), [Base motion guidance](https://base.uber.com/6d2425e9f/v/0/p/116184-motion), [shipment-location visibility](https://www.uberfreight.com/en-US/blog/shipment-locations-uber-freight) | A map and result sheet operate as one interface; motion clarifies state; continuous tracking reduces status uncertainty; shared views can expose useful progress without revealing sensitive commercial information. | A map and result ledger must remain synchronized; movement should explain selection and progress; transaction status should be continuously visible; public/shared views use minimum-necessary disclosure and never leak private clinical, exact residential, or pricing data. |

Research was last checked on 2026-08-13. Product details, vendor terms, and public interfaces are time-sensitive and must be reverified before consequential decisions.

## Klinikos design laws derived from the research

### 1. Intent before inventory

The first question is not “which module do you want?” It is “What needs to happen?”

A single continuous intent field may accept goals such as:

- “I need an injector in Miami next Thursday.”
- “Find a wheelchair-accessible room for two afternoons.”
- “I can offer ultrasound capacity within 20 miles.”
- “I need a preceptor for a six-week rotation.”
- “Help me become Grid-ready.”

Zumi may extract resource type, role, time, location, quantity, price preference, and required qualifications. Deterministic code owns authorization, credential policy, availability conflicts, payment truth, and final eligibility.

### 2. One exchange, many resource classes

Grid must not force users into ten disconnected marketplaces. People, work, spaces, services, equipment, organizations, referrals/capacity, and education resources share:

- identity and organization;
- capabilities and credentials;
- demand and supply;
- availability;
- eligibility;
- offers and reservations;
- financial obligations;
- fulfillment;
- incidents, disputes, and reputation.

Specialized inputs may appear after intent is understood. They do not require separate top-level product identities.

### 3. Map and result ledger are one control

The map provides spatial context. The result ledger provides comparison, accessibility, evidence, and action. They must share query, bounds, filters, selection, and focus.

- selecting a pin selects and reveals the corresponding result;
- selecting a result focuses the pin when mapped;
- panning or changing radius updates the result set only when the user chooses “Search this area” or live-update is clearly enabled;
- unmapped results remain in the ledger with an honest “Location unavailable” state;
- map failure never removes the usable list.

### 4. Compare the complete decision

A result is not useful if users must open five pages to learn whether it qualifies. Comparison should place the decision signals together:

- resource and organization;
- verified/declared evidence;
- relevant credential or eligibility state;
- availability window;
- approximate location/distance when legitimately computable;
- total price, fees, or “quote required”;
- response/fulfillment expectation;
- accessibility or operating constraints;
- next action and blocker.

Never invent ETA, distance, availability, verification, demand, scarcity, savings, or popularity.

### 5. Continuity replaces repeated setup

Airbnb’s Trips and Uber’s continuous status become a Klinikos Path: a persistent, resumable timeline from intent through resolution.

A Grid Path may contain:

`NEED → INTERPRETED → RESULTS → QUALIFIED → OFFER → ACCEPTED → RESERVED → FUNDED/OBLIGATION → FULFILLED → EVIDENCE → CLOSED OR DISPUTED`

The customer sees plain-language milestones. Admins may inspect technical state and audit evidence.

### 6. Trust is contextual evidence, not decoration

Trust signals must answer “Can this participant complete this specific transaction safely?”

Evidence may include identity, organization membership, credential scope, review source, expiration, completion history, incident/dispute history, and external-verification status. A visual badge must link to an explainable state. Internal review may not masquerade as external authority verification.

### 7. Upfront economics

For fixed-price supply, show the full server-owned amount and fee breakdown before commitment. For variable work, show the unit, estimate basis, included allowance, and what can change. For quote workflows, say “Quote required.”

Opening checkout is not payment. A ledger obligation is not payout movement. Funding, settlement, refund, dispute, and entitlement are separate evidence-backed states.

### 8. Purpose-built role surfaces, one visual language

Consumers, providers, clinics, educators, and operators should not share one generic dashboard. They should share foundations—type, spacing, controls, status semantics, accessibility, interaction rhythm—while each surface prioritizes its actual work.

- Buyer/organization: needs, qualified results, offers, reservations, spend, incidents.
- Provider/seller: readiness, listings, availability, offers, work, evidence, earnings/obligations.
- Educator/student: placements, supervision, competencies, evidence, release.
- Operator: approvals, duplicates, holds, disputes, configuration, audit, reconciliation.

### 9. Location is useful only with consent and graceful degradation

Location permission must follow an explicit user action. Exact visitor coordinates are not persisted by default. Public provider residential addresses are never exposed by default. Manual city/ZIP entry, service area, approximate location, and non-map list access are first-class paths.

Detailed law lives in `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`.

### 10. Motion explains change

Motion should connect cause and effect: a selected result rises in the ledger, a map focus changes, a transaction advances, or a sheet expands. Avoid decorative motion, auto-advancing content, and animation that competes with clinical or operational urgency. Reduced-motion preferences are honored.

## The original Klinikos interaction: Exchange Field

The recommended Grid surface is an **Exchange Field**, not a clone of a travel map, delivery feed, or job board.

Its stable anatomy is:

1. **Intent line** — “What do you need, or what can you offer?”
2. **Interpretation line** — editable plain-language summary of understood constraints.
3. **Context controls** — time, place, radius, resource class, price/economics, evidence.
4. **Field** — responsive map or spatial context when useful.
5. **Result ledger** — qualified and potentially qualified results, including unmapped supply.
6. **Result dossier** — inline evidence, constraints, economics, and next action.
7. **Path rail** — persistent continuation after an offer, reservation, application, or handoff begins.

On small screens, the ledger is primary and the map is an optional mode. On wide screens, the field and ledger form a synchronized split pane. The interface does not open with a card wall.

## Search and ranking contract

1. Parse the user’s intent into explicit constraints and editable assumptions.
2. Retrieve candidates across permitted resource classes.
3. Apply tenant, visibility, consent, and publication policy.
4. Apply hard eligibility and schedule/capacity constraints.
5. Rank the remaining candidates using explainable signals.
6. Display why a candidate appears and which facts remain unverified.
7. Ask at most one material clarification at a time.
8. Never let model output create credential, payment, verification, or settlement truth.

Search should support keyword, structured filters, natural-language intent, and browse/category entry. Natural-language interpretation improves retrieval; deterministic constraints remain authoritative.

## Supply lifecycle

`DRAFT → READINESS GAPS → SUBMITTED → HUMAN/EXTERNAL REVIEW AS REQUIRED → APPROVED → PUBLISHED → PAUSED/EXPIRED/SUSPENDED`

Supply setup should:

- reuse known identity, organization, credential, and availability context;
- show missing evidence before submission;
- allow draft/resume;
- separate public listing content from protected evidence;
- make review source and freshness visible;
- prevent duplicate publication and double reservation;
- explain why a listing is not visible.

## Marketplace measurements

Measure usefulness and trust, not engagement for its own sake:

- time to first qualified result;
- percentage of searches with at least one truthfully usable result;
- clarification rate and correction rate;
- map/list selection consistency;
- published-supply completion rate;
- offer-to-acceptance and acceptance-to-fulfillment rates;
- cancellation, incident, dispute, and failed-settlement rates;
- percentage of results with current eligibility evidence;
- location-denied flows that still reach a useful result;
- customer-reported “I understand what happens next.”

Do not optimize scarcity pressure, compulsive refresh, hidden fees, or notification volume.

## Explicit non-copies

Klinikos will not adopt:

- fake urgency, crossed-out fictional prices, or manufactured popularity;
- a consumer rating as a substitute for credential/eligibility evidence;
- continuous precise location tracking when a coarse service area is sufficient;
- surprise permission prompts;
- public provider home addresses;
- opaque personalized ranking for consequential eligibility;
- an infinite feed that obscures completion;
- separate visual systems that make Clinic, Grid, EDU, and Network feel like unrelated companies;
- marketplace growth that outruns dispute, safety, privacy, and operator controls.

## Implementation priority

1. Converge public Grid browse into the Exchange Field.
2. Replace automatic location permission with explicit consent and manual fallback.
3. Synchronize map bounds, result ledger, focus, and accessible selection.
4. Expand deterministic intent constraints across the generalized resource model.
5. Add inline evidence/economics dossiers.
6. Preserve the Path after offer/reservation/handoff.
7. Converge seller enrollment and readiness.
8. Add instrumentation only after events and privacy boundaries are explicit.
