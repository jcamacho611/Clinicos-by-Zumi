# Klinikos Integrated Commercial Execution Design

Date: 2026-09-01
Status: Proposed governing design for implementation review

## 1. Objective

Klinikos will operate one coordinated commercial system spanning the public website, Stripe, sales/procurement workflows, enterprise invoicing, Grid, EDU, services, usage-based add-ons, and opportunity handling from email.

The system must maximize legitimate revenue avenues without creating conflicting prices, fake product readiness, unsafe payment state, consumer-style checkout for enterprise procurement, or PHI leakage into payment/marketing systems.

The operating principle is:

`ONE COMMERCIAL TRUTH → MANY BUYER-SPECIFIC CONVERSION PATHS`

## 2. Governing truth hierarchy

1. Runtime/code/payment evidence governs what can actually be sold or activated today.
2. The Master Canon and commercial/pricing canons govern intended direction.
3. The Offer Registry governs sellable commercial definitions.
4. Stripe is a payment/billing execution rail, not the source of product truth.
5. Website pages, proposals, outreach, invoices, and sales materials consume the same commercial definitions.

No channel may invent a price, entitlement, implementation claim, discount, integration status, or payment state independently.

## 3. Hybrid Monetization Router

Klinikos will not force all buyers through one payment model.

### A. Self-serve fixed-price purchases
Use Stripe-hosted Checkout or Payment Links for approved low-complexity offers that can be delivered without negotiated scope.

Examples:
- Clinic Operating Analysis
- selected fixed-scope assessments
- approved EDU courses/pathways
- prepaid usage packs
- selected professional/network products where lawful

### B. Recurring SaaS
Use Stripe Billing for approved standardized recurring plans.

Examples:
- Klinikos Core
- Klinikos Growth
- Klinikos Scale
- approved Zumi/Revenue OS/Network recurring add-ons
- EDU Plus where self-serve is enabled

### C. Qualified implementation/services
Use qualification → proposal/SOW → approved deposit or invoice.

Examples:
- Implementation Blueprint where scope requires review
- Founding Clinic Implementation
- custom workflow optimization
- premium integrations
- fractional/optimization retainers

### D. Enterprise / hospital / payer / government
Use sales-led quote/contract/procurement → PO/invoice/ACH/card as appropriate.

Do not expose enterprise buyers to a consumer-style Buy Now flow for negotiated work.

Examples:
- health systems
- government RFP/RFI/RFA awards
- payer/employer contracts
- multi-location/network enterprise
- institutional EDU/workforce contracts
- strategic implementation programs

### E. Grid marketplace / platform payments
Use Stripe Connect only for resource classes where Klinikos is legally and operationally justified in routing money between buyers and sellers/providers.

Different Grid categories may use different economics. No universal percentage fee is assumed.

Sensitive referral, clinical, professional, regulated, or compensation flows require category-specific legal review before activation.

### F. Usage / variable cost
Use included allowances, prepaid packs, or explicitly authorized metered overage. Variable infrastructure must not be unlimited by default.

Examples:
- AI/Zumi usage
- SMS/email/voice
- verification
- storage
- external healthcare APIs
- maps/geocoding
- premium connectors

## 4. Canonical Offer Registry

A single server-owned Offer Registry will be the commercial source consumed by the website, checkout endpoints, sales workflows, invoices, and opportunity routing.

Minimum fields:
- `offer_id`
- `seller_entity`
- `public_name`
- `internal_name`
- `buyer_class`
- `revenue_lane`
- `product_scope`
- `product_truth_status`
- `price_type` (`fixed`, `from`, `range`, `custom`, `usage`)
- `amount_cents` when fixed
- `currency`
- `billing_interval`
- `implementation_fee`
- `included_usage`
- `overage_policy`
- `stripe_product_id`
- `stripe_price_id`
- `stripe_payment_link_id`
- `invoice_or_quote_required`
- `contract_required`
- `qualification_required`
- `legal_gate`
- `entitlements`
- `effective_date`
- `expiration_or_supersession`
- `approval_source`
- `status`
- `allowed_ctas`
- `conversion_destination`

The browser never decides price or entitlement.

## 5. Initial revenue universe

### Clinic / healthcare operations
- Clinic Operating Analysis — current public anchor $500 one-time
- Implementation Blueprint — current public anchor $1,500 one-time
- Founding Clinic Implementation — current public anchor from $8,000
- Klinikos Core — current public anchor $995/month
- Klinikos Growth — current public anchor $1,995/month
- Klinikos Scale — current public anchor $3,995/month
- Klinikos Enterprise — custom

### Add-ons
- Zumi Intelligence Plus — from $350/month
- Revenue OS — from $750/month plus setup
- Network — from $300/month plus setup
- Premium Connections — quoted
- Usage Packs — prepaid

### Services
- Operations/growth audit — scoped $1,500–$5,000
- Optimization/fractional operations retainer — $1,500–$5,000/month
- custom implementation, integration, training, migration, and operating-model work — quoted

### EDU
- Free discovery/basic simulation entry
- EDU Plus — existing planning anchor $19–$39/month per learner
- Courses — existing planning anchor $49–$199
- Pathways — existing planning anchor $199–$499
- Institutional cohorts/workforce boards/employers — contract pricing
- instructor/institutional licensing — contract pricing
- custom curriculum/simulation/implementation — contract pricing

### Grid / Network
Potential lawful monetization by category:
- organization subscription
- professional premium tools
- recruiting campaigns
- verification/onboarding products
- business-services marketplace economics
- space/capacity booking economics
- promotions/listings where appropriate
- customer-funded transaction costs
- category-specific platform fees after legal review

### Enterprise / strategic
- health-system contracts
- government procurement
- payer/employer contracts
- API/network access
- enterprise integration programs
- custom analytics/operating intelligence
- implementation/support programs

The registry may contain additional offers only when delivery, pricing, and legal truth are established.

## 6. Website conversion routing

The website remains broadly discoverable but each CTA routes according to buyer complexity.

### Public discovery
Capability, solution, specialty, persona, Grid, EDU, trust, and pricing pages explain outcomes and route buyers into the correct commercial lane.

### CTA classes
- `Map my clinic` → no-PHI Operating Map → qualification
- `Start analysis` → approved fixed-price offer or qualification, depending on scope
- `Buy course/pathway` → self-serve checkout when approved
- `Start plan` → plan qualification or subscription checkout where standardized
- `Talk to enterprise` → enterprise intake → sales/procurement
- `Request proposal` → quote/SOW lane
- `Pay invoice/deposit` → Stripe invoice/hosted payment page
- `Add usage` → prepaid allowance/pack
- `Join Grid` → account + agreements + verification → category-specific monetization

No public route creates paid entitlement from a query parameter or redirect alone.

## 7. Payment truth and security

Required sequence:

`SERVER-OWNED OFFER/CHECKOUT INTENT → STRIPE/APPROVED RAIL → VERIFIED PAYMENT EVIDENCE → INTERNAL PAYMENT RECORD → ENTITLEMENT/DELIVERY`

Rules:
- redirect/success URL is not payment proof
- webhook/API evidence governs payment state
- do not place PHI in Stripe product names, descriptions, metadata, invoice fields, URLs, or analytics
- payment never overrides RBAC, tenant isolation, credentialing, clinical authority, or compliance gates
- test-mode and live-mode objects are never conflated
- every live commercial change requires explicit approval and evidence

## 8. Stripe account model

The connected Stripe context currently exposed to ChatGPT is `KLINIKOS.IO` in **test/sandbox mode**. The repository separately contains production live-key/webhook architecture; secrets are never copied into documentation.

A universe-wide Stripe sandbox was created on 2026-09-01 to validate the commercial architecture before live promotion.

### Sandbox now contains

- current clinic entry offers and subscriptions;
- monthly and annual Core/Growth/Scale prices;
- clinic add-on price primitives;
- professional membership/business/launch targets;
- Grid employer/capacity/partner targets;
- EDU individual and institutional targets;
- implementation, proof, migration, audit, and retainer targets;
- prepaid usage-wallet denominations;
- custom/quote-only enterprise, workforce, private-intelligence, payments, and Grid-transaction product shells;
- automatic test Payment Links for the approved/current clinic plans and selected target self-serve lanes.

New unimplemented products are explicitly marked `TARGET_TEST` or private in Stripe metadata and are not evidence of live sellability, revenue, or production entitlement support.

Detailed sandbox catalog and payment-link evidence lives in:

- `docs/business/KLINIKOS_UNIVERSE_MONETIZATION_AND_STRIPE_CATALOG_2026-09-01.md`
- `docs/business/KLINIKOS_STRIPE_CONNECT_PAYMENTS_AND_TRUST_EXPANSION_2026-09-01.md`

### Promotion law

Implementation will:
1. keep the Canon/Offer Registry above Stripe as product truth;
2. validate products/prices/links in test mode;
3. validate checkout, invoice, subscription, cancellation, refund, and webhook behavior;
4. map stable lookup keys and payment evidence into the Offer Registry;
5. verify no PHI-bearing fields;
6. promote only approved offers to the intended live Stripe account;
7. require verified live payment evidence before entitlement or revenue recognition;
8. preserve enterprise offers as quote/invoice-driven rather than forcing them into Payment Links.

Do not create a second live Stripe merchant merely because a connector exposes only test mode; first reconnect the existing live Klinikos account so customers, payouts, disputes, tax history, and webhooks remain unified.

## 9. Outlook Opportunity Router

The email audit becomes a commercial input, not a disconnected inbox report.

Every thread is classified with:
- organization/person
- what Klinikos sent
- attachments/links Klinikos sent
- what they sent/replied
- attachments/links they sent
- opportunity type
- current stage
- money/strategic potential
- deadline
- blocker
- risk
- what they owe us
- what we owe them
- council judgment
- realistic option A/B/C
- recommended next action
- relevant Offer Registry lane
- relevant site/CTA/payment path
- claim-safe status

Examples:
- procurement thread → enterprise/proposal/invoice lane
- JLABS/CancerX → strategic validation lane, not checkout
- clinic lead → Operating Map / Analysis / Implementation / Subscription ladder
- workforce board → institutional EDU contract lane
- lender/investor → capital lane, not revenue
- spam/promo → noise classification
- bounce → delivery repair, not opportunity
- security alert → security lane

No email is automatically sent from classification. Drafts require explicit approval before external transmission.

## 10. Opportunity-to-revenue data flow

`EMAIL / WEBSITE / REFERRAL / RFP`
→ classify buyer and opportunity
→ verify product/delivery fit
→ select Offer Registry lane
→ qualify if required
→ fixed checkout OR proposal/quote/invoice OR subscription OR strategic relationship path
→ verify payment/contract/award evidence
→ create entitlement/delivery work
→ capture outcome/evidence
→ feed evidence back into sales, Texas, grants, financing, and future procurement

## 11. Commercial guardrails

- Do not underprice enterprise work by publishing a consumer checkout amount for negotiated scope.
- Do not publish every possible internal revenue mechanism to ordinary buyers.
- Do not call applications, invitations, bids, pilots, awards, contracts, or collected revenue the same thing.
- Do not activate referral/clinical transaction economics without legal review.
- Do not promise unlimited variable-cost services.
- Do not sell features that are only planned as if live.
- Do not create multiple contradictory price definitions across code, Stripe, decks, or outreach.

## 12. Analytics and evidence

Track:
- source/lead
- qualified opportunity
- offer presented
- checkout started
- payment verified
- quote/proposal sent
- contract/award stage
- onboarding
- activation
- first value
- recurring revenue
- expansion
- churn/retention
- contribution margin
- variable cost
- Grid activity where live
- EDU conversion/completion where live

No PHI in ordinary marketing analytics.

## 13. Error handling

- unavailable Stripe/live permissions → preserve offer, mark payment rail unavailable, route to invoice/manual approval rather than fake success
- unknown price conflict → block checkout and surface reconciliation task
- unsupported product state → route to qualification instead of purchase
- failed webhook/reconciliation → no entitlement until verified
- expired/superseded offer → block old checkout
- enterprise customer attempts consumer checkout → route to enterprise qualification
- duplicate payment/event → idempotent handling

## 14. Testing requirements

Before live activation:
- Offer Registry schema tests
- no duplicate active offer IDs
- pricing-page renders from registry, not duplicated literals
- route/CTA-to-offer mapping tests
- test-mode checkout success and failure
- webhook verification and idempotency tests
- subscription creation/change/cancel tests
- invoice/quote path tests
- entitlement requires verified payment/contract evidence
- PHI/prohibited metadata tests
- enterprise lane cannot accidentally use self-serve checkout
- superseded offers cannot be purchased
- accessibility and mobile CTA tests

## 15. Success condition

A buyer should be able to arrive anywhere in the Klinikos ecosystem, understand the relevant value, enter the correct commercial lane, pay or contract through the appropriate rail, and carry their context into onboarding without Klinikos inventing a new price or process for each conversation.

The same system must let executive leadership see which opportunities are real, what stage they are in, what revenue path they map to, and what evidence each win creates for the broader Klinikos flywheel.
