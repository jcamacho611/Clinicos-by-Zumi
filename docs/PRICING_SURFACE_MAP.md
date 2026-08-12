# Pricing surface map

Canonical price source: `src/lib/commercial/klinikos-commercial.ts`.
Canonical funding/gating architecture: `src/lib/commercial/customer-funded-access.ts` plus persisted commercial services as they are completed.

## Public clinic
- `/pricing`: canonical public clinic price anchors.
- `/founding-clinic`: qualification and high-touch conversion journey.
- `/sales`: sales conversion surface; must not invent separate pricing.
- `/start`: route buyer to correct next step based on intended purchase/qualification state.
- Clinic Operating Analysis checkout: one-time $500 entry purchase; checkout amount must be verified against processor configuration.

## Grid
- `/grid/pricing`: canonical participant pricing.
- `/grid/join*`: may advertise applicable free/basic or Pro option but must consume canonical commercial configuration rather than create new prices.
- Transaction APIs: server-owned resource-class fee policy; UI estimates are not authoritative.

## Authenticated clinic
- Billing/settings: current plan, contract state, entitlements, allowance, prepaid balance, overage ceiling, usage, add-ons, locations/capacity, invoices/payment evidence when available.
- Feature execution: server gate is authoritative; UI visibility is convenience only.
- Integrations: display commercial requirement and readiness independently.

## Commercial denial mapping
- PAYMENT_REQUIRED -> checkout/qualification depending product.
- SUBSCRIPTION_INACTIVE -> reactivate/contact sales.
- UPGRADE_REQUIRED -> plan upgrade.
- ADD_ON_REQUIRED -> add-on purchase/contact sales.
- ALLOWANCE_EXHAUSTED -> prepaid pack or bounded overage authorization.
- CONNECTION_PENDING -> connection workflow, not another payment if already purchased.
- POLICY_BLOCKED -> no payment CTA.

## Never duplicate
Do not independently hardcode clinic plan monthly prices, Grid Pro prices, audit/blueprint/implementation prices, or annual-discount claims on unrelated pages. Import canonical configuration or render through a shared commercial component.
