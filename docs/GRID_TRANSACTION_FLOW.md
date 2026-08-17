# Klinikos Grid Transaction Flow

This document records the implemented Grid transaction spine and the public-to-governed continuation verified on `feat/grid-exchange-mvp`.

## Canonical lifecycle

`demand -> eligibility -> match -> offer -> reservation -> payment -> fulfillment -> financial obligations -> settlement -> closed`

A later state must never be inferred merely because an earlier state exists.

## Saved demand

`GridDemandRecord` represents a need before the buyer has selected supply. It is intentionally separate from the legacy `GridRequest`, because `GridRequest` already assumes a selected provider and service listing.

Demand can optionally store a permission-derived latitude/longitude pair plus a radius. Exact distance is used only when both demand and resource have real coordinates. City/state matching remains available without claiming a precise distance.

Demand supports the universal Grid kinds:

- work
- provider
- space
- product
- equipment
- service
- network
- education
- organization
- referral

## Offer

`GridOfferRecord` binds a saved demand to selected supply. Provider/service offers are revalidated against Grid readiness before creation. Universal resource offers revalidate approved resource policy, ownership, availability, and capacity before sending and again before acceptance/reservation. Unsupported regulated classes remain blocked by their policy rather than being treated as generic supply.

## Public continuation

The Exchange Field interprets intent deterministically and routes public discovery without requiring an AI provider. Public projections contain only reviewed/published fields, reduce map-coordinate precision, and do not expose private evidence, contact details, internal notes, payment data, or PHI.

A reviewed universal resource can continue through:

`public discovery -> sign in with safe same-origin return path -> saved demand -> offer -> acceptance -> atomic reservation`

Provider and universal-resource presentation is coordinated in the public map/result ledger, while each class retains its own eligibility policy.

After a visitor explicitly grants browser location access, Grid can apply a 5, 10, 25, 50, 100 mile or unrestricted distance view. The displayed map pins and adjacent mapped-resource ledger use the same client-side radius result. Inventory without reviewed public coordinates is excluded from exact-radius mode and explained rather than assigned a fabricated distance. Result selection centers the map; a connected Google marker selects the corresponding ledger row; the keyless OpenStreetMap path retains list-to-map focus.

## Truth rules

- Eligibility is a hard gate. Ranking cannot override it.
- Provider and service listing are selected as a pair.
- Offer deposit cannot exceed gross offer amount.
- Offer expiration must be in the future.
- A demand must identify selected supply before an offer exists.
- Reservation conflicts must prevent provider/location double booking.
- A distance is shown or used for radius eligibility only when both sides have valid stored coordinates.
- Browser location is requested only after a user action and is not converted into fake marketplace inventory.
- Permission-derived location remains in the browser discovery surface; it is not persisted by public map browsing.
- Public coordinate projection is less precise than governed server-side matching data.
- Booking, payment, fulfillment, and settlement remain distinct states.
- Payout cannot be represented as settled before fulfillment and a real external settlement reference.
- All consequential transitions must be attributable and auditable.

## Data strategy

The current branch uses small additive SQL migrations and typed repository access for the new universal demand/offer records instead of rewriting the large Prisma schema through the connector. This avoids schema-file corruption risk while keeping the application schema owner and migration history in the canonical repository.

## Current API surfaces

- `GET /api/grid/demands`
- `POST /api/grid/demands`
- `GET /api/grid/offers`
- `POST /api/grid/offers`
- existing ranked `POST /api/grid/matches`
- existing Grid request transition endpoints
- existing Grid payout transition endpoints

## Remaining external / later slices

1. Connect and verify a production Google Maps/geocoding/routing account only if richer multi-marker routing is commercially justified; the fallback map does not claim those APIs are connected.
2. Connect a regulated payment/payout processor before any payout state is presented as money moved.
3. Connect external professional-license and malpractice authorities before describing internal review as external verification.
4. Continue converging specialized enrollment screens on the shared visual system without combining their policy classes.

## Safety boundary

Current public and transaction work remains synthetic/demo unless production readiness, contracts, security, vendor connections, and human authorization gates are satisfied. Generic resource offers do not imply that the resource class has completed regulatory verification.
