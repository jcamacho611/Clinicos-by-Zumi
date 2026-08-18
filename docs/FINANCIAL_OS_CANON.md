# KLINIKOS — FINANCIAL OS CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Definition

**Financial OS is the shared economic-truth layer for Klinikos.** It connects commercial offers, subscriptions/entitlements, Grid transactions, services, fees, obligations, verified payment evidence, payouts, reconciliation, refunds, and reporting without pretending that internal state is external money movement.

## 2. Canonical lifecycle

`OFFER / OPPORTUNITY → SERVER-OWNED AGREEMENT / INTENT → BOOKING OR DELIVERY CONDITION → FINANCIAL OBLIGATION → PROCESSOR OR APPROVED MANUAL EVIDENCE → SETTLEMENT / ENTITLEMENT → FULFILLMENT POLICY → PAYABLE → PAYOUT EVIDENCE → RECONCILIATION → CLOSED`

Different products may order payment and fulfillment differently, but the states remain distinct.

## 3. Invariants

- Use integer cents for monetary truth.
- Browser redirects, query strings, and success pages are not payment evidence.
- A ledger entry does not prove money moved.
- An obligation/payable is not a payout.
- A payout request is not settled payout.
- Settlement requires processor/webhook/API evidence or an authorized auditable manual reconciliation path.
- Refund, cancellation, dispute, hold, and reversal are explicit states.
- Server-owned products and fee policies determine trusted amounts.
- Financial status never widens identity, tenant, clinical, credential, or safety authorization.

## 4. Shared objects

Financial state may include:

- product/offer and checkout/payment intent;
- subscription and entitlement;
- transaction gross amount;
- platform, provider, facility, referral, product/resource, processor, refund, and cancellation amounts;
- amount held, due, verified, settled, payable, paid, reversed, or disputed;
- fee policy and version;
- payment and payout evidence reference;
- reconciliation/audit event.

Do not hard-code one universal Grid percentage. Fee and payout policy varies by resource/opportunity class and legal/commercial structure.

## 5. Commercial entry

Current paid-entry truth supports server-owned commercial intent and the existing GoDaddy checkout with manual evidence/reconciliation. The current candidate adds Stripe-hosted Checkout for the one-time Clinic Operating Analysis only when signed live-webhook verification is configured. Returning from either rail does not activate paid status. Implementation and recurring software entitlement are separate from an analysis purchase unless the offer says otherwise.

## 6. Grid economics

Grid can allocate obligations among provider/resource owner, facility/location, Klinikos platform, processor, referral source where lawful, and other required parties. Allocation is not external settlement.

Payout cannot outrun payment, fulfillment, dispute/hold, or resource-class policy.

## 7. Customer-funded usage

Variable AI, maps, messaging, voice, storage, verification, and external API use follows:

`PAID PLAN / PREPAID BALANCE → ENTITLEMENT → INCLUDED ALLOWANCE → METERED USAGE → COST LEDGER → LIMIT / OVERAGE → MARGIN`

Unknown vendor cost must not be labeled zero-cost or unlimited.

## 8. Current truth

Repository evidence includes commercial checkout intents, payment evidence/entitlement separation, manual reconciliation, Grid fee policies, obligations, transaction/fulfillment state, platform finance views, and automated truth tests. The current candidate implements direct Stripe customer-payment verification, failure and refund evidence; production endpoint configuration and a real live exercise remain pending. Marketplace payouts remain a separate Stripe Connect dependency.

## 9. Reporting and audit

Reporting must distinguish booked, attempted, authorized, verified, settled, earned, payable, paid, refunded, disputed, and recognized platform revenue. Every consequential transition is attributable and auditable.

## 10. Acceptance

No public or operator surface may say paid, settled, paid out, refunded, or revenue earned unless the governing policy and evidence support that exact label.
