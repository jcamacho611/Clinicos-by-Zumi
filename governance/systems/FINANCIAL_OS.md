# Financial OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P2

## Purpose

Own commercial and payment truth across Klinikos so offers, subscriptions, Grid transactions, refunds, disputes, entitlements and settlements cannot be inferred from browser redirects or disconnected billing logic.

## Primary questions

- Buyer: **What am I buying, what does it cost and what happens after I pay?**
- Owner: **What money is actually verified?**
- Finance: **What is owed, paid, refunded, disputed, payable or unreconciled?**

## Canonical distinctions

Price, Quote, Offer, Order, CheckoutIntent, PaymentIntent, PaymentEvidence, Invoice, Balance, Subscription, Entitlement, UsageRecord, Credit, Refund, Dispute, Payable, Payout, Settlement, Reconciliation.

Permanent rule:

> **Redirect is not payment.**

## Frontend surfaces

- public checkout
- account billing
- invoices
- payment methods
- organization subscription/plan
- usage
- patient balances/payments where applicable
- Grid financial state where lawful
- enterprise billing/contract projection
- finance/admin reconciliation

## Domain authority

Financial OS owns monetary state and product entitlements. It does not invent clinical justification, professional eligibility or claim reimbursement facts.

## Backend services

- OfferService
- PricingEngine
- QuoteService
- OrderService
- CheckoutService
- PaymentProviderAdapter
- PaymentEvidenceService
- InvoiceService
- SubscriptionService
- EntitlementService
- UsageMeteringService
- BalanceService
- RefundService
- DisputeService
- PayableService
- PayoutService
- SettlementService
- FinancialReconciliationService
- FinancialAuditService

Reconcile with current Stripe/payment implementation before adding new abstractions.

## Offer Registry

All sellable offers should be governed centrally with:

- offerId
- seller entity
- buyer class
- name/plain-language promise
- scope
- amount/currency
- billing model
- implementation fee
- included usage
- variable usage/overage rule
- direct cost category
- entitlement
- effective date
- expiration/deprecation
- experiment cohort
- approval source
- status

No page may silently invent its own price.

## Pricing truth

Public pricing may display simple starting points while internal Offer Registry manages cohorts, grandfathering, enterprise/custom terms and approved experiments.

Current canonical commercial anchors referenced by governance:

- Clinic Operating Analysis: $500 one-time
- Implementation Blueprint: $1,500 one-time
- Founding Clinic Implementation: from $8,000
- Core: $995/month
- Growth: $1,995/month
- Scale: $3,995/month
- Enterprise: custom

These are not evidence of signed customers or revenue.

## Free plan

`Klinikos Free — $0` is a distribution/identity/network entry concept. Expensive variable services must be bounded. Free entitlement should be explicit rather than implemented as scattered UI checks.

## Commercial workflows

### Self-service payment

`Offer → Order/CheckoutIntent → Provider → PaymentEvidence → Reconciliation → Entitlement → Receipt/Delivery`

### Subscription

`Offer → SubscriptionIntent → Provider evidence → Subscription active/past-due/cancelled → Entitlement state`

### Enterprise

`Proposal/Contract → Signature/PO/Invoice → authoritative commercial activation → Entitlement → implementation`

Do not require enterprise to use a consumer checkout.

### Grid

`Agreement → FinancialObligation → payment/settlement rail → evidence → fulfillment/reconciliation`

Only activate transaction fees in categories legally/commercially approved.

## Money correctness

- store amounts in integer minor units where possible
- explicit currency
- server-owned price calculations
- idempotent financial mutations
- immutable provider evidence where appropriate
- reconcile provider state with internal state
- record adjustments/refunds rather than overwriting history

## Commands

- create quote/order
- create checkout intent
- reconcile payment evidence
- activate/suspend entitlement from authoritative state
- issue refund
- record dispute
- create invoice
- record settlement/payout
- record usage

## Events produced

OfferSelected, CheckoutStarted, PaymentPending, PaymentVerified, PaymentFailed, SubscriptionActivated, SubscriptionPastDue, SubscriptionCancelled, EntitlementGranted, EntitlementRevoked, InvoiceIssued, RefundIssued, DisputeOpened, DisputeResolved, PayableCreated, PayoutSent, SettlementRecorded, FinancialReconciliationRequired, FinancialReconciled.

## Events consumed

Approved offer/configuration changes, enterprise contract activation, Grid fulfillment, patient balance updates, Revenue OS remittance/payment relationships and product usage.

## Zumi

May explain approved prices, payment status and billing state, prepare checkout/invoice links, summarize usage and identify payment follow-up. It may not invent discounts, change non-approved contract economics or mark payment successful without evidence.

Autonomy: L0-L3; L4 for deterministic reconciliation/receipt/follow-up where explicitly authorized.

## External adapters

Payment processors, ACH/bank rails, enterprise invoicing/accounting integrations, marketplace payout providers if/when approved.

## Permissions/security

- finance/admin scopes distinct from ordinary user access
- no secret payment credentials in browser
- webhook signature validation
- replay/idempotency controls
- PCI scope minimized through provider-hosted/approved patterns
- audit refunds/disputes/entitlement changes

## Failure states

- checkout abandoned
- provider pending
- webhook delayed
- duplicate event
- charge failed
- invoice overdue
- subscription past due
- payout blocked
- settlement mismatch
- entitlement mismatch

Never convert uncertainty into success.

## Customer value

One coherent payment/billing experience and less manual subscription/invoice reconciliation.

## Klinikos monetization

Foundation for all software, services, usage, Grid, EDU and enterprise revenue.

## Tests

- server-owned price
- redirect-not-payment
- webhook signature/idempotency
- entitlement after evidence
- refund/dispute lifecycle
- currency/integer arithmetic
- tenant/customer isolation
- enterprise non-checkout activation path
- Grid payment eligibility boundary

## Definition of done

Every supported commercial path can move from approved offer/contract to authoritative payment or invoicing evidence, entitlement, reconciliation and customer-visible state without ambiguous money truth.