# KLINIKOS Money Flow Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Define how money-related state moves across Klinikos without conflating offers, claims, payments, revenue estimates, entitlements, marketplace settlements or customer-value metrics.

## Fundamental distinctions

### Product/commercial

`PRICE → OFFER → QUOTE/ORDER → CHECKOUT/INVOICE → PAYMENT EVIDENCE → ENTITLEMENT`

### Clinical revenue

`PERFORMED → DOCUMENTED → CODE SUPPORTED → CHARGE → CLAIM → ADJUDICATION → PAYMENT → RECONCILIATION`

### Grid transaction

`AGREEMENT → FINANCIAL OBLIGATION → PAYMENT/SETTLEMENT → FULFILLMENT EVIDENCE → RECONCILIATION`

### Customer value

`POTENTIAL → ESTIMATED → VERIFIED → REALIZED`

These are different state machines and must not be collapsed.

## Money flow classes

### A. Klinikos software/service revenue

Seller: appropriate Klinikos/related legal entity according to executed corporate/commercial setup.

Flow:

`ApprovedOffer → CustomerAcceptance → Payment/Invoice Evidence → Entitlement/Implementation → Revenue Accounting`

### B. Patient payment to healthcare organization

Klinikos may provide payment UX/processor integration while healthcare organization remains seller/creditor according to contract/configuration.

### C. Insurance reimbursement

Revenue OS tracks claim/remittance progression. Financial OS records payment evidence/reconciliation. Klinikos does not call expected claim value collected cash.

### D. Grid transaction

Seller/service-provider and fee policy depend on resource category. Legal classification precedes fee activation.

### E. EDU

Institution/employer/government contracts, cohort/program fees and platform access. Completion/certificate has no inherent monetary/credential equivalence.

### F. Enterprise

Annual/custom agreements, invoices, purchase orders, ACH/wire/card according to approved contract.

## Required money metadata

- amount in integer minor units
- currency
- owner/creditor/payee
- payer/customer
- related offer/order/claim/transaction
- provider/rail
- evidence ID
- observed/effective timestamp
- status
- reconciliation state
- refund/dispute/adjustment references

## Financial truth rules

1. Browser redirect is not payment.
2. Provider webhook/API evidence must be verified and reconciled.
3. Duplicate payment events are idempotent.
4. Revenue estimate is not cash.
5. Claim billed amount is not allowed amount or payment.
6. Grid GMV is not Klinikos revenue.
7. Customer savings/revenue benefit is not Klinikos revenue.
8. Refund/dispute creates explicit history; do not overwrite original payment.
9. Marketplace payout does not occur until appropriate agreement/fulfillment/financial rules allow it.
10. All financial fee schedules are server-owned/configured.

## Revenue reporting categories

Klinikos internal reporting should distinguish:

- cash collected
- invoiced
- accounts receivable
- MRR
- ARR
- one-time services
- usage revenue
- enterprise contracted value
- Grid transaction volume
- Grid recognized revenue
- payment volume processed
- claims value processed
- customer value estimated/verified/realized

## Customer economic evidence

Possible measures:

- software vendor cost removed
- administrative hours saved
- missed leads recovered
- revenue exception resolved
- capacity monetized
- staffing need fulfilled

Every metric stores source/method and evidence level.

## Fee-policy gates

Before activating transaction-based economics, classify:

- transaction category
- jurisdiction
- professional/referral implications
- fee-splitting/anti-kickback/corporate-practice issues where applicable
- employment/contractor issues
- payment/marketplace regulatory obligations

Unknown categories fail closed for percentage fees.

## Tests

- redirect-not-payment
- integer/currency correctness
- payment webhook idempotency
- estimate vs realized labels
- claim vs payment separation
- Grid GMV vs revenue separation
- refund/dispute history
- entitlement only from authoritative commercial state
