# KLINIKOS — GRID LOCATION PROVIDER CANON

Status: `AUTHORITATIVE SPECIALIST CANON`
Updated: `2026-08-17 America/New_York`

## Decision

Google Maps is not a Klinikos Grid launch dependency.

The primary zero-billing Grid location stack is:

`MapLibre GL JS → OpenFreeMap → Browser Geolocation → Klinikos deterministic distance/eligibility`

Optional enhanced location APIs sit behind a provider-neutral server boundary. Geoapify is the preferred first low-cost geocoding/routing adapter when configured. Google remains an optional future provider and must never block Grid startup or basic location matching.

## Primary responsibilities

- **MapLibre GL JS** renders the interactive browser map.
- **OpenFreeMap** supplies the primary basemap/style without a Klinikos API credential.
- **Browser Geolocation API** supplies permission-derived current position only after explicit user action.
- **Klinikos geo rules** remain authoritative for deterministic Haversine distance, radius eligibility, public-coordinate reduction, and truthful unpinned inventory behavior.
- **OpenStreetMap embed** remains the emergency geographic fallback if the primary renderer/provider cannot load.

## Optional enhancement providers

A future location-provider gateway may support:

- Geoapify for geocoding, reverse geocoding, place/address search, routing, and travel-distance enrichment;
- LocationIQ or another reviewed provider as a replaceable alternative;
- Google Maps Platform as an optional paid adapter;
- Waze only as a navigation/deep-link handoff, never as the Grid map or eligibility engine.

No enhanced provider may become the authority for Grid eligibility. Provider routing/travel results are enrichment; deterministic policy and stored Klinikos data remain authoritative for whether a resource can proceed.

## Geolocation law

1. Never request browser location automatically on page load.
2. The user must explicitly choose **Use my location**.
3. Permission denied and location unavailable are normal truthful states, not errors that invent a fallback position.
4. Exact permission-derived coordinates are used only where needed for governed matching and must not become public marketplace inventory.
5. Public coordinates remain privacy-reduced under existing Grid rules.
6. Straight-line distance must never be labeled travel time.
7. No map provider may generate fake inventory, fake coordinates, fake distances, or fake ETAs.

## Degradation law

With no Google credentials and no optional geocoding/routing API configured, Grid must still support:

- interactive mapping through the primary free stack;
- explicit user geolocation;
- real reviewed resource markers;
- deterministic Haversine ranking and radius filtering;
- selected-resource continuity;
- truthful city/state and unpinned inventory behavior;
- OpenStreetMap emergency fallback.

If the primary map CDN/provider fails, the product degrades to the existing OSM embed rather than presenting a blank or fabricated map.

## Cost law

Do not introduce a paid map dependency before customer-funded usage or a clear product need justifies it. Variable geocoding/routing usage should be metered by tenant/feature/provider and recovered through plan allowance, prepaid balance, or approved overage policy.

## Security and privacy

- Public/browser map requests must contain only data suitable for public display.
- Do not place PHI, patient identifiers, diagnoses, or sensitive credential data in map-provider URLs, labels, query strings, telemetry, or metadata.
- Exact private resource coordinates stay inside governed Klinikos data paths when public precision reduction is required.
- Any future API key must be scoped to the minimum required APIs and environment.

## Environment contract

Primary mapping requires no Google or OpenFreeMap API secret.

Optional future environment variables:

```text
GEOAPIFY_API_KEY=""
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=""
```

Blank optional variables must not break Grid.

## Acceptance

A release satisfies this canon only when:

- Grid renders without Google credentials;
- explicit browser geolocation works over HTTPS;
- permission-denied and unavailable states remain usable;
- mapped resources come only from real reviewed coordinates;
- radius results remain deterministic;
- public-coordinate privacy is preserved;
- provider failure degrades truthfully;
- no paid map credential is required for the core journey.
