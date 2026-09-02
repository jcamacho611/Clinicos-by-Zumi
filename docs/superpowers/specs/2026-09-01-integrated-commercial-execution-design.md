# Klinikos Integrated Commercial Execution Design

Date: 2026-09-01
Status: Dated subordinate specialist design for implementation review; not Master Canon, executable registry, or runtime evidence

## 1. Objective

Klinikos will operate one coordinated commercial system spanning the public website, Stripe, sales/procurement workflows, enterprise invoicing, Grid, EDU, services, usage-based add-ons, and opportunity handling from email.

The system must maximize legitimate revenue avenues without creating conflicting prices, fake product readiness, unsafe payment state, consumer-style checkout for enterprise procurement, or PHI leakage into payment/marketing systems.

The operating principle is:

`ONE COMMERCIAL TRUTH → MANY BUYER-SPECIFIC CONVERSION PATHS`

## 2. Governing truth hierarchy

1. `docs/KLINIKOS_MASTER_CANON.md` is the sole company/product/architecture authority.
2. Current code, schema, tests, exact-head CI, verified deployment/runtime, and processor evidence govern what actually exists and may execute today.
3. The existing server-owned `commercialProducts` kernel governs current offer lifecycle, public presentation, direct-checkout eligibility, qualification, commercial route, price type, amount, destination, and post-purchase boundary.
4. This dated specialist design is a subordinate implementation input and must be corrected when it differs from those higher authorities.
5. Stripe is a replaceable payment/billing execution rail, not the source of product truth.
6. Website pages, proposals, outreach, invoices, and sales materials consume the same commercial definitions.

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

Current executable truth: only `operational_audit` is `directPublicCheckoutEligible: true`. A test Payment Link or public price does not promote any other offer into this lane.

### B. Recurring SaaS
Use Stripe Billing for approved standardized recurring plans only after `commercialProducts` permits the route and exact qualification, customer, tax, lifecycle, entitlement, cancellation, refund, and recovery gates are implemented.

Examples:
- Klinikos Core
- Klinikos Growth
- Klinikos Scale
- approved Zumi/Revenue OS/Network recurring add-ons
- EDU Plus where self-serve is enabled

Current executable truth: Core, Growth, and Scale are sellable reviewed-recurring offers, but each is qualification-required and not direct-public-checkout eligible. Their presence here is target payment-rail design, not current self-subscribe authority.

### C. Qualified implementation/services
Use qualification → proposal/SOW → approved deposit or invoice.

Examples:
- Implementation Blueprint under its current qualification-required `qualified_service` route
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

Connect routing must resolve server-side, per transaction:

- canonical platform, connected account, organization, controller, buyer, seller/provider, and end-customer relationship;
- who owns the Stripe Customer/payment method and who is merchant of record;
- direct charge, destination charge, separate charge/transfer, or platform charge;
- product/fulfillment control, statement descriptor, receipts/support, refunds, disputes, chargebacks, negative balances, reserves, and loss liability;
- account country/currency, requirements/restrictions, requested capabilities, `charges_enabled`, `payouts_enabled`, and transfer/payout eligibility;
- fee-splitting, referral, corporate-practice, employment/contractor, money-transmission, privacy, consumer, tax, marketplace-facilitator, and resource-class/jurisdiction policy.

Unknown, unverified, expired, restricted, or legally unresolved state fails closed or routes to review. Connected-account existence and payment cannot cure it.

### F. Usage / variable cost
Use included allowances, prepaid packs, or explicitly authorized metered overage. Variable infrastructure must not be unlimited by default.

Implementation must **REUSE/EXTEND** the existing provider-neutral commercial ledger—accounts, allowances, prepaid/reserved balances, bounded overage, reservations, usage entries, actual-cost settlement, release/expiry, overrun, idempotency, and audit. It must not introduce a second Stripe-specific Usage Wallet or ledger.

Examples:
- AI/Zumi usage
- SMS/email/voice
- verification
- storage
- external healthcare APIs
- maps/geocoding
- premium connectors

## 4. Existing server-owned Offer Registry kernel

Do not create a second registry. Current code exports `commercialProducts` from `src/lib/commercial/product-catalog.ts`, with executable fields including:

- `key`, `label`, `audience`, and `billing`;
- `revenueClass` and `commercialRoute`;
- `priceType` and `priceCents`;
- `qualificationRequired`;
- `conversionDestination`;
- `lifecycle`;
- `publicPurchasable`;
- `directPublicCheckoutEligible`;
- `modules`, `allowanceEnv`, and `postPurchaseBoundary`.

The separation is mandatory:

`PUBLICLY PRESENTABLE ≠ DIRECT CHECKOUT ≠ QUALIFIED ≠ PAYMENT RAIL AVAILABLE ≠ PAYMENT VERIFIED ≠ ENTITLEMENT/DELIVERY ACTIVE`.

Current mapping:

- `operational_audit`: active, fixed, `self_serve`, no qualification, public-presentable, direct-checkout eligible;
- `implementation_blueprint`: active, fixed, `qualified_service`, qualification required, public-presentable, not direct-checkout eligible;
- `founding_clinic_implementation`: active, starting-at, `sales_led`, qualification required, public-presentable, not direct-checkout eligible;
- `clinic_core`, `clinic_growth`, `clinic_scale`: active, fixed monthly anchors, `recurring_reviewed`, qualification required, public-presentable, not direct-checkout eligible;
- `clinic_enterprise`: active, custom, `enterprise_government`, qualification required, not publicly purchasable and not direct-checkout eligible;
- legacy aliases: historical evidence only, not new-sale or checkout products.

Future commercial fields such as seller entity, pricing version, stable Stripe lookup key, tax treatment, contract requirement, entitlements, effective dates, supersession, approval source, and allowed CTAs must **EXTEND** or project from this kernel without creating conflicting product truth. Add them only when their executable consumer and migration/backward-compatibility path are defined.

Environment-specific Stripe `prod_...`, `price_...`, `plink_...`, Checkout Session, Subscription, Invoice, and PaymentIntent IDs are processor bindings/evidence, not canonical product authority. They may be persisted only where needed for correlation, reconciliation, fulfillment, or audit. Test and live IDs are expected to differ.

Use and extend the existing environment-neutral projection in `src/lib/commercial/stripe-commercial-projection.ts`, derived from `commercialProducts` and keyed by canonical offer key plus pricing version and stable lookup key where appropriate. That projection selects a rail; it never changes the governing offer fields or makes an ineligible offer direct checkout.

The browser never decides price, lookup key, Stripe object ID, entitlement, or authority.

## 5. Initial revenue universe

### Clinic / healthcare operations
- Clinic Operating Analysis — current public anchor $500 one-time
- Implementation Blueprint — current public anchor $1,500 one-time
- Founding Clinic Implementation — current public anchor from $8,000
- Klinikos Core — current public anchor $995/month
- Klinikos Growth — current public anchor $1,995/month
- Klinikos Scale — current public anchor $3,995/month
- Klinikos Enterprise — custom

These are price/offer anchors, not one checkout class. Under current `commercialProducts`, only Analysis is direct checkout; Blueprint is qualified service; founding implementation is sales-led; Core/Growth/Scale are reviewed recurring; Enterprise is enterprise/government and not publicly purchasable.

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
- `Start plan` → current registry route; Core/Growth/Scale presently require recurring review and may use subscription checkout only after a deliberate verified promotion
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
- tax provider availability never substitutes for qualified taxability, nexus/registration, exemption, marketplace-facilitator, filing/reporting, or merchant-allocation decisions
- Connect onboarding or capability state never substitutes for customer ownership, merchant-of-record, charge-type, dispute/loss, resource-class, jurisdiction, or legal approval

For every live rail, the server must also preserve refund, dispute, chargeback, reversal, duplicate-event, failed-payment, and recovery truth. `CHARGE ≠ PAYMENT ≠ TRANSFER ≠ PAYOUT ≠ SETTLEMENT`.

## 8. Stripe account and external-evidence model

An earlier connector session reported a Stripe context labeled `KLINIKOS.IO` in test/sandbox mode and described test Products, Prices, and Payment Links across clinic, professional, Grid, EDU, services, usage-funding, enterprise, and Connect target concepts.

That report is `DATED EXTERNAL SNAPSHOT / STALE UNTIL RECONCILED`. It is not proof of current account connection, object existence/state, metadata/amount accuracy, live-account correspondence, sellability, revenue, or entitlement support. Exact external IDs and Payment Link URLs are not product authority and must not be copied into runtime code or public surfaces.

Current main also contains an environment-neutral Stripe commercial projection in `src/lib/commercial/stripe-commercial-projection.ts`. After this branch is integrated with current main, that module—not a dated sandbox transcript—must be the runtime bridge from `commercialProducts` to lookup-key/pricing-version treatment. External Stripe state is reconciled against it; external state never rewrites it implicitly.

### Required read-only reconciliation

Before reusing or promoting any observed object, compare the intended account and mode against:

- canonical offer key, lifecycle, buyer, price type/amount, qualification, route, public-purchase state, direct-checkout state, and post-purchase boundary;
- environment-neutral lookup key and pricing version;
- currency, cadence, tax behavior, active/archive state, metadata, and no-PHI policy;
- deterministic buyer/customer/organization correlation;
- entitlement/delivery mapping, refund/dispute behavior, and signed webhook/API evidence;
- target/test objects that must remain private, be archived, or be removed from customer-facing navigation.

Mismatch blocks activation and creates a reconciliation task.

Detailed sandbox catalog and payment-link evidence lives in:

- `docs/business/KLINIKOS_UNIVERSE_MONETIZATION_AND_STRIPE_CATALOG_2026-09-01.md` (dated subordinate planning/evidence; exact links intentionally non-authoritative)
- `docs/business/KLINIKOS_STRIPE_CONNECT_PAYMENTS_AND_TRUST_EXPANSION_2026-09-01.md` (dated subordinate target design)

### Promotion law

Implementation will:
1. keep the Canon/Offer Registry above Stripe as product truth;
2. project approved registry state through the environment-neutral Stripe commercial projection;
3. reconcile products/prices/links in test mode by stable lookup key and pricing version without importing external IDs as authority;
4. validate checkout, invoice, subscription, cancellation, refund, dispute, reversal, recovery, and webhook behavior;
5. correlate processor evidence to canonical buyer/organization/offer state without changing registry authority;
6. verify no PHI-bearing fields;
7. complete tax and, where applicable, Connect account/merchant/customer/charge/liability/legal gates;
8. promote only approved offers to the intended live Stripe account;
9. require verified live payment evidence before entitlement or revenue recognition;
10. preserve enterprise offers as quote/invoice-driven rather than forcing them into Payment Links.

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
- Do not treat `publicPurchasable` as direct checkout; require the full `directPublicCheckoutEligible` predicate and governed commercial route.
- Do not create a second offer catalog or prepaid-usage ledger beside `commercialProducts` and the existing commercial ledger.
- Do not enable tax calculation from a generic assumption: determine seller/merchant, nexus/registration, product/service tax code, location, exemptions, inclusive/exclusive display, marketplace-facilitator allocation, refunds/credits, filing/reporting, and exact environment configuration with qualified review.
- Do not enable Connect from account existence alone: verify controller authority, customer relationship, merchant of record, charge type, capabilities/restrictions, dispute/loss model, transfer/payout policy, tax allocation, and resource-class/jurisdiction legality.

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
- Stripe object differs from environment-neutral projection → block activation and create reconciliation task
- connected account capability/restriction or controller authority unknown → block charge/transfer/payout and route to remediation
- customer ownership, merchant of record, charge type, dispute/loss allocation, resource-class policy, or jurisdiction legality unresolved → block Connect action
- taxability, nexus/registration, exemption, facilitator allocation, or tax configuration unresolved → block automatic tax claim/activation and route to qualified review

## 14. Testing requirements

Before live activation:
- Offer Registry schema tests
- no duplicate active offer IDs
- exact tests for `publicPurchasable` versus `directPublicCheckoutEligible`, qualification, route, price type, and lifecycle
- environment-neutral Stripe projection tests with no test/live object IDs in canonical code
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
- prepaid usage funding reuses the existing commercial ledger and verifies funding/refund/dispute correlation
- Connect account/controller/customer/charge-type/capability/dispute/legal gates fail closed
- tax configuration and responsibility gates fail closed and do not infer legal taxability from provider availability
- accessibility and mobile CTA tests

## 15. Success condition

A buyer should be able to arrive anywhere in the Klinikos ecosystem, understand the relevant value, enter the correct commercial lane, pay or contract through the appropriate rail, and carry their context into onboarding without Klinikos inventing a new price or process for each conversation.

The same system must let executive leadership see which opportunities are real, what stage they are in, what revenue path they map to, and what evidence each win creates for the broader Klinikos flywheel.
