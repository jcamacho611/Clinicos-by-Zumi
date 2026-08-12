# Klinikos Grid Transaction Flow

This document records the post-marketplace transaction spine currently being built on `agent/grid-transaction-flow`.

## Canonical lifecycle

`demand -> eligibility -> match -> offer -> reservation -> payment -> fulfillment -> financial obligations -> settlement -> closed`

A later state must never be inferred merely because an earlier state exists.

## Saved demand

`GridDemandRecord` represents a need before the buyer has selected supply. It is intentionally separate from the legacy `GridRequest`, because `GridRequest` already assumes a selected provider and service listing.

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

`GridOfferRecord` binds a saved demand to selected supply. Current provider/service offers are revalidated against Grid readiness before creation. Location offers revalidate location availability. Generic resource references remain synthetic/manual-policy-review until their resource-class verifier exists.

## Truth rules

- Eligibility is a hard gate. Ranking cannot override it.
- Provider and service listing are selected as a pair.
- Offer deposit cannot exceed gross offer amount.
- Offer expiration must be in the future.
- A demand must identify selected supply before an offer exists.
- Reservation conflicts must prevent provider/location double booking.
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

## Next slice

1. Offer transition endpoint with accepted/countered/declined/expired/withdrawn states.
2. Accepted provider/service offer converts to a reservation/request only after rechecking eligibility and availability.
3. Atomic reservation conflict checks.
4. Payment condition and manual GoDaddy payment reconciliation state.
5. Fulfillment confirmation.
6. Financial obligations and settlement reconciliation.

## Safety boundary

Current public and transaction work remains synthetic/demo unless production readiness, contracts, security, vendor connections, and human authorization gates are satisfied. Generic resource offers do not imply that the resource class has completed regulatory verification.
