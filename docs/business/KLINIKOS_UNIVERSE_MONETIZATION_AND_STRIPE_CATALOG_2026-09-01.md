# Klinikos Universe Monetization & Stripe Catalog — 2026-09-01

Status: `DATED SPECIALIST COMMERCIAL DESIGN / NOT CANON / NOT LIVE REVENUE EVIDENCE`

Governing authority:
1. `docs/KLINIKOS_MASTER_CANON.md` governs company/product architecture and accepted commercial law;
2. current code, schema, tests, exact-head CI, verified deployment/runtime, and processor evidence govern what exists and may execute now;
3. the server-owned `commercialProducts` registry governs current offer lifecycle, buyer, price type, qualification, commercial route, public presentation, direct-checkout eligibility, and post-purchase boundary;
4. this dated document is a subordinate planning and external-evidence reconciliation input;
5. Stripe objects and links are environment-specific execution artifacts, never independent product truth.

This document cannot make an offer public, direct-checkout eligible, entitled, live, or lawfully transactable. When it differs from the Master Canon or verified code/runtime, those higher authorities win and this document must be corrected.

> **Klinikos does not monetize by charging for every screen. It monetizes every durable economic layer it can legitimately own while keeping identity, trust, regulated authority, eligibility, clinical truth, and core network liquidity outside the paywall.**

---

## 1. Commercial thesis

Klinikos is the governed operating network for healthcare. The commercial system therefore cannot be reduced to one clinic subscription table.

The revenue architecture should compound across:

- healthcare organizations;
- individual healthcare professionals;
- independent professional businesses;
- workforce and employer demand;
- unused rooms, equipment, and capacity;
- education and professional progression;
- placement infrastructure;
- Klinikos Intelligence;
- revenue and financial operating capabilities;
- network coordination;
- implementation and integration;
- customer-funded variable usage;
- enterprise and institutional deployment;
- permitted Grid transaction infrastructure;
- later private/dedicated intelligence infrastructure.

The permanent commercial question is:

> **What value does Klinikos create here, what economic event can Klinikos legitimately own, and what must remain non-purchasable authority?**

---

## 2. Commercial state is not one Stripe treatment

The executable registry deliberately separates states that this draft previously compressed:

- `publicPurchasable`: the current offer may be presented to a buyer and start its governed commercial route; it does **not** mean Buy Now;
- `directPublicCheckoutEligible`: a buyer may enter immediate public checkout without qualification or sales review;
- `qualificationRequired`: a deterministic/human gate must pass before the commercial path advances;
- `commercialRoute`: `self_serve`, `qualified_service`, `sales_led`, `recurring_reviewed`, `enterprise_government`, or `historical_evidence_only`;
- payment rail: Checkout, Billing, Payment Link, Quote/Invoice, Connect, ACH/manual reconciliation, or another approved rail selected only after the route and policy state are known;
- verified payment evidence and entitlement/delivery state: downstream truths that remain separate from all of the above.

`PUBLIC_SELF_SERVE`, `PUBLIC_SUBSCRIBE`, `PRIVATE_QUOTED`, and `PREPAID_USAGE` may be useful Stripe projection treatments, but they may not override `commercialProducts`. A sellable offer can remain qualification-gated; a public price can remain non-checkout; a payment rail can remain unavailable; and a collected payment can remain unfulfilled pending bounded reconciliation.

### A. `PUBLIC_SELF_SERVE`

Use when the buyer can safely purchase immediately without a sales, legal, clinical, credential, security, or configuration decision changing the meaning of the purchase.

Examples:
- Clinic Operating Analysis;
- Professional Pro / Professional Business once product rails exist;
- Professional Launch;
- EDU Plus / Course / Pathway once learning entitlements exist;
- prepaid customer usage funding only after it reuses the existing commercial ledger and exact funding correlation exists.

Current executable mapping: only `operational_audit` satisfies every direct-public-checkout predicate. Implementation Blueprint and clinic subscriptions do not.

### B. `PUBLIC_SUBSCRIBE`

Recurring software/membership where Stripe Billing may eventually collect automatically and verified evidence may activate a bounded entitlement only after the registry allows direct checkout and every qualification, packaging, tax, customer-identity, cancellation, refund, and provisioning gate exists.

Examples:
- Professional Pro;
- Professional Business;
- EDU Plus.

Current executable mapping: `clinic_core`, `clinic_growth`, and `clinic_scale` are `publicPurchasable: true` but `directPublicCheckoutEligible: false`, `qualificationRequired: true`, and `commercialRoute: recurring_reviewed`. They are reviewed recurring offers, not current public self-subscribe checkout.

### C. `PRIVATE_QUOTED`

Use when scope, risk, location, integration, migration, volume, contract, or institutional complexity materially changes price or delivery.

Examples:
- Implementation Blueprint under its current `qualified_service` route;
- Founding Clinic Implementation;
- Enterprise;
- workforce programs;
- Placement OS during early commercialization;
- enterprise architecture workshops;
- complex integrations;
- data migration/go-live;
- private intelligence deployments;
- large public-sector or institutional programs.

### D. `PREPAID_USAGE`

Use for customer-funded variable costs after included allowance is exhausted.

Examples:
- artificial-intelligence usage;
- voice;
- messaging;
- document processing;
- storage;
- maps;
- external connector/vendor usage.

The customer may fund a bounded prepaid balance. Implementation must **REUSE/EXTEND** the existing provider-neutral commercial account, allowance, reservation, usage-entry, settlement, overrun, release, idempotency, and audit machinery. Do not build a second Stripe-specific wallet or ledger. A stored card is not a blank check.

### E. `NOT_DIRECTLY_PURCHASABLE`

Never convert these into a Stripe entitlement merely because money was paid:

- healthcare license status;
- credential truth;
- scope of practice;
- prescribing authority;
- supervision authority;
- clinical signature;
- chart access;
- Protected Health Information permissions;
- organization authority;
- tenant membership;
- referral priority;
- Grid hard eligibility;
- pay-to-rank placement;
- patient clinical orders;
- consent validity;
- legal status;
- professional-corporation authority;
- settlement/payment truth itself.

Payment may fund a product. It never changes regulated truth.

---

## 3. Strategic free layer

Not everything should be monetized directly. Some things should be deliberately free because they create network liquidity and lower acquisition cost.

### Free forever / free entry candidates

- legitimate person-level Klinikos identity;
- patient/family basic entry;
- professional basic identity/profile;
- basic Grid presence;
- Grid search and decline;
- basic `I NEED / I HAVE` discovery where permitted;
- basic EDU route mapping;
- limited learning/simulation entry;
- basic organization discovery;
- basic relationship invitations;
- public educational/content layer.

Commercial law:

> **Do not charge for the network behavior we need more of. Charge for operating leverage, automation, intelligence, management, fulfillment infrastructure, premium capacity tools, enterprise controls, and successful permitted economic execution.**

No paid plan may buy credential status, eligibility, ranking priority over a harder rule, or clinical authority.

---

## 4. Clinic / organization revenue stack

### Current executable registry mapping

| Offer / key | Current price truth | `publicPurchasable` | `directPublicCheckoutEligible` | Qualification / route | Payment-rail consequence |
| --- | ---: | --- | --- | --- | --- |
| Clinic Operating Analysis / `operational_audit` | $500 one-time, fixed | true | true | no / `self_serve` | May enter the configured server-owned direct checkout path; signed/API evidence still governs payment and bounded service fulfillment. |
| Implementation Blueprint / `implementation_blueprint` | $1,500 one-time, fixed | true | false | yes / `qualified_service` | Presentable to buyers, but qualification precedes any approved hosted payment, invoice, or reconciliation path. |
| Founding Clinic Implementation / `founding_clinic_implementation` | from $8,000, starting-at | true | false | yes / `sales_led` | Scope, SOW/contract, and approved deposit/invoice rail; the browser may not charge the floor as an exact price. |
| Klinikos Core / `clinic_core` | $995/month, fixed registry anchor | true | false | yes / `recurring_reviewed` | Reviewed recurring route; no direct public subscription checkout until the registry and runtime are deliberately changed and verified. |
| Klinikos Growth / `clinic_growth` | $1,995/month, fixed registry anchor | true | false | yes / `recurring_reviewed` | Reviewed recurring route; no direct public subscription checkout today. |
| Klinikos Scale / `clinic_scale` | $3,995/month, fixed registry anchor | true | false | yes / `recurring_reviewed` | Reviewed recurring route; no direct public subscription checkout today. |
| Klinikos Enterprise / `clinic_enterprise` | custom | false | false | yes / `enterprise_government` | Sales/procurement/contract/quote/invoice only; never consumer Buy Now. |

Current main's environment-neutral Stripe projection includes monthly and annual Core/Growth/Scale variants, but marks their public links ineligible while preserving qualification and the `recurring_reviewed` route. Those variants are not direct checkout truth merely because a sandbox Price may have existed; Billing lifecycle and verified runtime remain separate execution gates.

Annual clinic prices preserve the current 15% annual-commitment savings strategy and improve upfront cash flow.

### Clinic expansion revenue

| Offer | Price anchor | Treatment |
| --- | ---: | --- |
| Zumi Intelligence Plus | from $350/mo / $3,570/yr | PRIVATE_QUOTED initially |
| Revenue OS | from $750/mo + from $2,500 setup | PRIVATE_QUOTED initially |
| Network | from $300/mo + from $1,000 setup | PRIVATE_QUOTED initially |
| Integration Launch | $2,500 starting anchor | PRIVATE_QUOTED |
| Data Migration & Go-Live | $5,000 starting anchor | PRIVATE_QUOTED |
| Prepaid usage funding (existing commercial ledger) | $100 / $250 / $500 / $1,000 planning denominations | PREPAID_USAGE / REUSE-EXTEND |

These are expansion rails, not unrelated products. They should attach to a verified customer need and existing entitlement.

---

## 5. Professional revenue stack

A professional should be able to enter free, then pay only when Klinikos gives them materially more operating leverage.

### Free professional

- one identity;
- basic profile;
- basic Grid discoverability where permitted;
- basic availability;
- basic EDU route visibility;
- basic evidence record;
- ability to receive valid opportunities.

### Professional Pro — sandbox target

- **$39/month**;
- **$399/year**.

Value proposition:
- improved work discovery tools;
- richer availability controls;
- career intelligence;
- credential-expiration reminders where supported;
- verified experience presentation;
- expanded Zumi professional tools;
- professional progression view;
- deeper EDU linkage.

It does not buy license status, credential truth, or regulated-work eligibility.

### Professional Business — sandbox target

- **$129/month**;
- **$1,299/year**.

Value proposition:
- everything in Professional Pro;
- own-client workflow support;
- business scheduling/booking tools;
- customer organization / CRM-style workflow;
- business analytics;
- financial operating visibility;
- service and availability management;
- business-facing Zumi;
- Grid business workflow tools where permitted.

It does not create legal business status or clinical authority.

### Professional Launch — sandbox target

- **$499 one-time**.

Guided setup for the professional's Klinikos business workspace, profile, service configuration, availability, booking setup, and operating workflow.

It is not legal formation, licensure, prescribing authority, or professional-corporation advice.

### Professional compounding loop

`FREE IDENTITY → PRO → BUSINESS → OWN CLIENTS / WORK → VERIFIED EXPERIENCE → OWNER / EMPLOYER / PRECEPTOR → MORE GRID SUPPLY`.

This is a core network-effect loop and should be measured as a product funnel, not merely a subscription funnel.

---

## 6. Grid / capacity monetization

Grid remains governed `I NEED / I HAVE` infrastructure. Basic listing/search/decline remains free.

### Grid Employer Access — sandbox target

- **$499/month**;
- **$5,090/year**.

For employers/organizations that need standalone access to governed workforce demand, coverage, eligibility-aware discovery, invitation, and completion tracking.

Growth/Scale customers may receive some or all Grid employer capabilities inside the clinic subscription. Avoid double charging without a clear packaging reason.

### Capacity Host — sandbox target

- **$199/month**;
- **$2,030/year**.

For people/organizations managing permitted rooms, equipment, service capacity, or other non-patient resources.

Payment buys management tools and operating leverage. It does not buy ranking preference or permission to use a resource for a regulated service.

### Partner OS — sandbox target

- **$299/month**;
- **$3,050/year**.

For approved partners providing permitted resources, services, infrastructure, training, diagnostics capacity, or business services into the network.

Partner subscription must never become pay-to-rank or pay-for-referral.

### Grid Transaction Service

No universal public price.

Treatment: `PRIVATE / POLICY_PRICED / CONNECT_OR_INVOICE`.

The economic method varies by resource class:

- nonclinical room/equipment/resource transaction: percentage or fixed platform economics may be appropriate;
- business services: marketplace/platform economics may be appropriate;
- staffing/work engagements: structure depends on employment/agency law and contractual model;
- professional medical fees: no universal platform percentage; fee splitting/referral/corporate-practice rules require jurisdiction-specific policy;
- regulated product: not ordinary public commerce;
- patient referral: never assume a commission.

---

## 7. Governed Clinical Opportunity Assembly monetization

The strategic model may assemble:

`PROFESSIONAL + CLIENT + CLINICAL ENTITY + AUTHORITY + LOCATION + RESOURCE + EVIDENCE + PAYMENT`.

Klinikos monetizes the layers it legitimately owns, for example:

- professional software membership;
- organization software membership;
- booking/operating infrastructure;
- room/capacity infrastructure;
- business workflow tools;
- education;
- Zumi/intelligence;
- customer-funded usage;
- implementation;
- credential monitoring tools;
- permitted nonclinical transaction economics.

Klinikos does **not** assume a percentage of every clinical professional fee. Clinical transaction economics remain jurisdiction- and resource-class-specific.

This preserves the business opportunity without turning the platform into a public pharmaceutical marketplace or an unsafe fee-splitting engine.

---

## 8. EDU monetization

### Free EDU

- route mapping;
- requirements visibility;
- basic simulation;
- progress record.

### EDU Plus — sandbox target

- **$29/month**;
- **$296/year**.

Includes broader simulation, competency tracking, progression visibility, and placement-readiness tooling.

### EDU Course — sandbox standard anchor

- **$99 one-time standard course anchor**.

Individual courses may later carry their own prices. The existing canon range of `$49–199` remains a useful category range; the $99 sandbox object is a standard transaction primitive, not a promise that every course costs $99.

### EDU Pathway — sandbox standard anchor

- **$349 one-time standard pathway anchor**.

The existing canon range of `$199–499` remains valid as a category range. The $349 object is the initial standardized transaction primitive.

### Placement OS — sandbox target

- **$999/month**;
- **$10,190/year**.

For schools, workforce programs, employers, and placement sites coordinating requirements, preceptors, schedules, hours, evidence, and progression.

### Workforce Program

Treatment: `PRIVATE_QUOTED`.

For government agencies, workforce boards, schools, employers, and institutional programs. Pricing may be per seat, per cohort, per program, subscription, implementation, or a blended contract.

RFP-specific pricing must not automatically become public product pricing.

---

## 9. Services and commercialization ladder

The services ladder should create proof and convert customers into recurring software rather than trap Klinikos in low-margin custom consulting.

| Offer | Sandbox/current anchor | Purpose |
| --- | ---: | --- |
| Clinic Operating Analysis | $500 | paid diagnosis |
| Implementation Blueprint | $1,500 | actionable implementation architecture |
| Deep Operating Audit | $3,000 sandbox anchor | broader operational/revenue review |
| Proof Sprint | $3,500 sandbox anchor | measurable intervention around one problem |
| Founding Implementation | from $8,000 | deployment/setup |
| Optimization Retainer | $2,500/mo sandbox anchor | continuing optimization where economically justified |
| Enterprise Architecture Workshop | $7,500 sandbox anchor | executive/technical discovery for institutional buyers |

Commercial rule:

> **Services should increase conversion, evidence, and implementation quality. They must not become an unlimited custom-development escape hatch.**

---

## 10. Customer-funded usage architecture — reuse the existing ledger

Klinikos should not absorb unbounded third-party variable cost.

### Previously proposed sandbox funding denominations

- $100;
- $250;
- $500;
- $1,000.

Eligible cost buckets may include:

- AI/model usage;
- voice;
- SMS;
- email;
- maps;
- document processing;
- storage;
- integration/vendor calls.

These denominations are planning inputs, not proof of current Stripe objects or executable funding. Any funding product must correlate verified processor evidence into the existing provider-neutral commercial account.

Current reusable substrate already includes:

- included allowances and hard limits;
- prepaid balance and reserved balance;
- explicitly authorized bounded overage;
- tenant/capability/bucket-scoped reservations;
- idempotency keys;
- actual-cost settlement and unfunded-overrun handling;
- reservation release/expiry and auditable usage entries.

Implementation law:

1. use included allowance first;
2. then prepaid usage balance;
3. then an explicitly approved bounded overage policy if one exists;
4. otherwise stop or degrade safely.

A saved card is never unlimited post-paid authorization.

Do not create a separate `UsageWallet` balance, Stripe-owned usage truth, or second settlement ledger. **REUSE** the commercial ledger, **EXTEND** it only for verified funding correlation, refunds/disputes/reversals, customer-facing balance projection, and any missing denomination/product mapping, then **CONNECT** Stripe as one replaceable payment evidence rail.

---

## 11. Enterprise / institutional revenue

### Klinikos Enterprise

No public fixed price. Use Stripe Quotes/Invoices and contractual terms.

Potential commercial components:
- annual platform commitment;
- implementation;
- migration;
- integrations;
- support/service level;
- usage allowance;
- dedicated/private intelligence;
- workforce/EDU components;
- Grid/Network configuration;
- deployment/security requirements.

### Enterprise Architecture Workshop

Sandbox anchor: **$7,500 one-time**.

Purpose: turn complex buyer interest into a paid requirements/governance/integration engagement before a larger proposal.

### Private Intelligence Node

No public price.

Future dedicated/private Klinikos Intelligence economics may depend on:
- compute;
- storage;
- data residency;
- security/governance;
- model architecture;
- uptime/support;
- deployment type;
- customer-funded infrastructure;
- data-center/private-cloud requirements.

It remains a target/private product until implementation, cost model, security, and deployment truth support a real offer.

---

## 12. Stripe execution architecture

Klinikos should use multiple Stripe rails instead of forcing every transaction through one mechanism.

### Rail 1 — governed app Checkout

Use for purchases where Klinikos already has a server-owned intent, product key, tenant/customer context, expected amount, and entitlement logic.

Flow:

`SERVER INTENT → STRIPE CHECKOUT → SIGNED WEBHOOK → PAYMENT EVIDENCE → ENTITLEMENT / NEXT ACTION`.

This is a target automatic-collection rail for clinic subscriptions after the current reviewed-recurring route passes qualification and the registry, Billing lifecycle, tax, customer correlation, entitlement, and production evidence permit activation. It is not current public self-subscribe authority.

### Rail 2 — Payment Links

Use for safe shareable self-serve purchases and sales-assisted links.

Payment Links may collect money automatically, but the webhook still determines the bounded next action. A static Payment Link must not bypass tenant, authority, PHI, or clinical policy.

### Rail 3 — Stripe Billing

Use for:
- recurring subscriptions;
- annual commitments;
- plan lifecycle;
- renewal;
- failed-payment recovery;
- customer portal where appropriate.

### Rail 4 — Quotes + Invoicing

Use for:
- enterprise;
- institutions;
- public sector;
- custom implementation;
- integration/migration packages;
- large workforce/EDU programs;
- negotiated net terms.

The quote is the commercial entry object; accepted quote may create subscription/invoice as appropriate.

### Rail 5 — Stripe Connect

Klinikos is likely a hybrid platform and should not force every Connect use case into one merchant model.

Connect is not one switch. Before creating a charge or moving money, the server must resolve:

- canonical buyer, seller/provider, organization, and account-controller relationships;
- who owns the end-customer relationship and which account owns the Stripe Customer/payment method;
- merchant of record, statement descriptor, receipt/support/refund responsibility, dispute/chargeback owner, negative-balance/reserve exposure, and loss liability;
- direct charge versus destination charge versus separate charge and transfer versus platform charge;
- connected-account country/currency, requirements, restrictions, requested capabilities, `charges_enabled`, `payouts_enabled`, and transfer/payout eligibility;
- resource-class and jurisdiction permission, including clinical-fee, referral, fee-splitting, corporate-practice, employment/contractor, money-transmission, privacy, and consumer-protection review;
- tax collection, marketplace-facilitator, exemption, filing/reporting, and information-reporting responsibility.

The browser never selects these states. Unknown, unverified, expired, restricted, or legally unresolved state fails closed or routes to review.

#### Clinic SaaS payments

When Klinikos enables a clinic/business to accept payments from its own customers, direct charges on an appropriate connected account may be the natural SaaS pattern. The connected business is merchant of record only after account configuration and the commercial/legal relationship establish that fact. Customer, refund, dispute, support, capability, and tax responsibilities must match that model.

#### Grid marketplace/resource transactions

For permitted marketplace transactions where Klinikos is the marketplace and routes money, destination charges or separate charges/transfers may be appropriate depending on hold/split requirements.

Do not activate a marketplace charge type for regulated professional medical fees until the resource-class/jurisdiction policy explicitly permits the economics.

Fulfillment, transfer, payout, refund, reversal, dispute, and settlement remain distinct lifecycle events. A successful charge does not prove lawful fulfillment; a transfer does not prove payout; and a payout does not prove final settlement or clinical authority.

### Rail 6 — Prepaid usage funding

Use one-time payments to fund bounded internal usage credit only after verified payment evidence. Project that evidence into the existing commercial ledger; do not build a Stripe-specific wallet.

---

## 13. Pricing architecture rules

### Stable lookup keys

Every standardized Stripe Price should have a stable lookup key and a pricing version.

Current main implements the environment-neutral bridge in `src/lib/commercial/stripe-commercial-projection.ts`. Reuse and extend that module; do not introduce a parallel catalog, environment-specific product map, or hard-coded Payment Link registry.

Example:

`klinikos_clinic_core_monthly_v1`

Do not hard-code mutable Stripe object IDs as product truth when a stable lookup key can resolve the current price.

### Price generations

New price generation should never silently rewrite historical economics.

Classification vocabulary:

- `ACTIVE_PUBLIC`;
- `ACTIVE_PRIVATE`;
- `TARGET_TEST`;
- `TARGET_PRIVATE`;
- `LEGACY_QUOTED`;
- `GRANDFATHERED`;
- `RETIRED`.

Stripe Prices are immutable in amount. Price changes create a new Price/version; old price evidence remains historical truth.

### Annual pricing

Default annual strategy for standardized recurring products: approximately 15% savings for annual prepay when margin and retention economics support it.

Use annual commitment to improve:
- cash conversion;
- retention;
- customer commitment;
- forecastability.

Do not discount enterprise/custom commitments automatically.

### Tax activation

No price, Checkout, Payment Link, Subscription, Invoice, or Connect flow is production-ready until the applicable tax decision is documented and configured. The gate must cover at least:

- seller/merchant and marketplace-facilitator responsibility;
- nexus/registration and supported jurisdictions;
- product/service tax codes and one-time versus recurring treatment;
- customer and transaction-location evidence;
- tax-inclusive versus tax-exclusive presentation;
- B2B/exemption evidence and expiry;
- refunds, credits, discounts, and annual-prepay treatment;
- Connect account/charge-type allocation;
- filing, remittance, information reporting, and record retention;
- test evidence and production-account configuration.

Stripe Tax or any other provider is execution infrastructure. It does not determine legal taxability, create registrations, validate exemptions by implication, or replace qualified tax/legal review.

---

## 14. Things Stripe must never decide

Stripe is payment infrastructure, not Klinikos authority.

Stripe must never decide:

- whether a professional is clinically eligible;
- whether an RN may perform a service;
- whether a prescriber may issue an order;
- whether product custody is lawful;
- whether a site is permitted;
- whether a patient gave valid consent;
- whether PHI may be released;
- whether a user belongs to a tenant;
- whether a referral is complete;
- whether a clinical result is authoritative;
- whether a person is licensed;
- whether a Grid match is eligible;
- whether a transaction fee is lawful in a jurisdiction.

Payment evidence may unlock a paid capability only after the appropriate Klinikos policy and entitlement layer accepts the event.

---

## 15. Unverified external sandbox snapshot — dated 2026-09-01

A prior connector session reported that a Stripe account labeled `KLINIKOS.IO` exposed test-mode Product/Price/Payment Link objects for clinic, professional, EDU, services, usage-funding, enterprise, Connect, and Grid target concepts.

That report is now classified:

`DATED EXTERNAL SNAPSHOT / STALE UNTIL RECONCILED / NOT PRODUCT AUTHORITY / NOT RUNTIME EVIDENCE`.

It does not prove that the same account is connected now, that any object still exists or is active, that metadata/amounts remain correct, that an object belongs to the intended merchant, or that any test object has a corresponding live object. It also does not promote a target offer into `commercialProducts`.

Before any object is reused or promoted, a read-only reconciliation must compare the intended Stripe account and mode against:

- current `commercialProducts` offer key, lifecycle, buyer, price type, amount, qualification, commercial route, public-purchase state, direct-checkout state, and post-purchase boundary;
- environment-neutral lookup key and pricing version where a reusable Price is appropriate;
- currency, cadence, tax behavior, active/archive state, metadata, and no-PHI policy;
- entitlement/delivery correlation, refund/dispute behavior, and verified webhook support;
- target/test objects that must remain private or be archived rather than exposed.

Any mismatch creates a reconciliation task and blocks activation. A new verified dated evidence record may store non-secret object identifiers when operationally necessary, but this specialist planning document must not become their runtime registry.

---

## 16. Payment Link evidence boundary

Exact test Payment Link URLs are intentionally not carried as authority in this document. Prior notes reported links for entry offers, clinic plan variants, professional/EDU targets, and prepaid-usage denominations, but those observations are stale and unverified.

Rules:

- no test or live URL is a canonical offer identifier;
- no link may be published merely because it accepts a test payment;
- no static link may bypass qualification, customer/tenant correlation, tax, authority, entitlement, refund/dispute, or regulated-policy gates;
- Core/Growth/Scale and Implementation Blueprint remain non-direct-checkout under the current registry even if an external test link exists;
- a link payment without deterministic buyer/offer correlation routes to bounded reconciliation, not automatic entitlement;
- runtime resolves environment-specific processor objects from one environment-neutral server projection and verifies their attributes before use;
- external Stripe state must be freshly reconciled before any operational claim or promotion.

---

## 17. Promotion gates from sandbox to live

A sandbox object becomes a live offer only when all applicable gates pass:

1. product is approved by the Master Canon and exists in current `commercialProducts` with the intended lifecycle;
2. `publicPurchasable`, `directPublicCheckoutEligible`, `qualificationRequired`, `commercialRoute`, price type, amount, and conversion destination all permit the proposed buyer path;
3. exact amount/price generation and environment-neutral lookup-key/pricing-version projection are approved;
4. payment rail matches the commercial route and cannot bypass qualification, contract, procurement, or review;
5. deterministic buyer/customer/organization correlation and server entitlement/delivery mapping exist;
6. signed live-webhook/API verification and payment-evidence reconciliation exist;
7. cancellation, refund, credit, dispute, chargeback, reversal, failed-payment, duplicate-event, and recovery behavior exists;
8. customer-facing terms accurately describe what payment buys and which party fulfills/supports it;
9. privacy/security/PHI boundaries remain separate;
10. seller/merchant, tax nexus/registration, product tax code, location, exemption, inclusive/exclusive display, marketplace-facilitator, Connect allocation, filing/reporting, and refund/credit treatment have qualified review and exact environment configuration;
11. for regulated marketplace transactions, resource-class/jurisdiction economics and fee/referral/employment/clinical boundaries are approved;
12. for Connect, canonical account relationship, controller authority, capabilities, merchant-of-record, customer ownership, charge type, dispute/loss model, transfer/payout policy, and account requirements are verified;
13. production environment is using the intended live Stripe account without creating a duplicate merchant history;
14. production smoke/evidence confirms the exact payment rail and customer-visible path.

No sandbox object should be promoted merely because its checkout works.

---

## 18. Revenue flywheels

### Clinic flywheel

`ANALYSIS → BLUEPRINT → PROOF SPRINT → IMPLEMENTATION → CORE/GROWTH/SCALE → ZUMI/REVENUE/NETWORK → USAGE → ENTERPRISE EXPANSION`.

### Professional flywheel

`FREE IDENTITY → EDU / WORK → PRO → BUSINESS → OWN CLIENTS / CAPACITY → OWNER / EMPLOYER / PRECEPTOR`.

### EDU/workforce flywheel

`FREE ROUTE → EDU PLUS / COURSE / PATHWAY → PLACEMENT → VERIFIED EXPERIENCE → WORK → EMPLOYER / PRECEPTOR → MORE SUPPLY`.

### Grid flywheel

`FREE DISCOVERY → GOVERNED MATCH → REPEATED WORK / CAPACITY → OPERATING TOOLS → ORGANIZATION / PROFESSIONAL SUBSCRIPTION → PERMITTED TRANSACTION INFRASTRUCTURE`.

### Enterprise flywheel

`ARCHITECTURE WORKSHOP → PILOT / PROOF → IMPLEMENTATION → ANNUAL PLATFORM → INTEGRATIONS → PRIVATE INTELLIGENCE / NETWORK / WORKFORCE EXPANSION`.

---

## 19. Metrics Symphony/finance should monitor

Per offer family:

- checkout started;
- checkout completed;
- payment verified;
- entitlement activated;
- activation time;
- refund rate;
- dispute rate;
- subscription conversion;
- monthly vs annual mix;
- annual cash collected;
- churn;
- expansion revenue;
- usage-wallet attach rate;
- average prepaid balance;
- proof-sprint conversion to implementation;
- implementation conversion to subscription;
- Professional Pro → Business conversion;
- EDU → placement → work conversion;
- employer/capacity liquidity;
- enterprise workshop → contracted deployment conversion.

Never report a Stripe checkout or payment link as revenue unless payment evidence confirms it.

---

## 20. Deliberately unpriced / deferred opportunities

The following may become valuable but should not receive arbitrary public prices merely to make the catalog look complete:

- patient/family premium membership;
- direct-to-patient concierge fees;
- regulated clinical transaction percentages;
- pharmacy/drug commerce;
- prescription-device resale;
- referral commissions;
- universal staffing commission;
- pay-to-rank Grid visibility;
- private AI/dedicated compute recurring price;
- data licensing;
- payer economics;
- financing/credit products;
- insurance products;
- international market pricing;
- government program seat rates outside a specific procurement context.

Each requires product evidence, legal/policy analysis, unit economics, or market validation before pricing becomes authoritative.

---

## 21. Next implementation sequence

### Wave 1 — reconcile the existing commercial kernel and direct Analysis rail

- resolve live Stripe account exposure;
- confirm production live key/webhook signing secret without surfacing secrets;
- preserve `commercialProducts` as the executable registry and add one environment-neutral Stripe projection rather than a second catalog;
- keep Clinic Operating Analysis as the only current direct-public-checkout offer;
- keep Blueprint and Core/Growth/Scale on qualified/reviewed routes unless a later verified registry change deliberately promotes them;
- reconcile any external test/live Product/Price/Payment Link state and archive/block contradictory objects;
- ensure future Core/Growth/Scale monthly/annual Billing and entitlement handling is exact before enabling direct subscription;
- configure customer portal/recovery behavior;
- verify live payment evidence end to end.

### Wave 2 — professional + EDU offer definition and entitlements

- add approved product keys to the existing server-owned catalog only after product/delivery truth is established;
- define exact entitlements;
- write RED tests for payment-event mapping;
- add webhook reconciliation;
- provision only after verified payment evidence;
- test cancellation/renewal/refund behavior;
- then deliberately classify public presentation, qualification, direct-checkout eligibility, and payment rail before any promotion.

### Wave 3 — prepaid usage funding through the existing ledger

- reuse existing commercial accounts, allowances, prepaid/reserved balances, reservations, usage entries, actual-cost settlement, overrun, release, and audit;
- extend only the missing verified-funding/refund/dispute/customer-projection mappings;
- bind purchases to customer/organization;
- consume by approved capability bucket;
- preserve provider-neutral cost accounting;
- never let negative/open-ended balance become implicit authorization.

### Wave 4 — organization expansion

- Employer Access;
- Capacity Host;
- Partner OS;
- Placement OS;
- add-on attach/upgrade logic;
- prevent duplicate billing when capability is already included in Growth/Scale/Enterprise.

### Wave 5 — Connect

- separate clinic SaaS merchant-payments use case from Grid marketplace use case;
- bind each connected account to canonical Person/Organization/controller authority;
- define customer ownership, merchant of record, support/refund/dispute/chargeback/negative-balance/loss responsibility;
- select direct, destination, separate-charge/transfer, or platform charge only through server policy;
- implement embedded onboarding/requirements remediation;
- hard-gate country/currency, requirements, restrictions, charges/payouts/transfer capabilities before payment/transfer/payout;
- connect fulfillment, refund, reversal, dispute, transfer, payout, and settlement exception states to Financial OS;
- complete tax/marketplace-facilitator/information-reporting and legal-policy gates;
- enable platform fraud controls where applicable;
- do not enable regulated professional-fee marketplace economics until policy permits them.

### Wave 6 — enterprise quote-to-cash

- Stripe Quotes;
- negotiated subscriptions;
- implementation/migration line items;
- invoice collection;
- net terms;
- accepted quote → subscription/invoice → payment evidence → implementation work order.

---

## 22. Permanent law

> **Free where liquidity compounds. Subscription where ongoing operating leverage compounds. One-time where implementation or proof is delivered. Prepaid where variable cost exists. Quote where complexity changes the deal. Connect where permitted multi-party money movement is genuinely part of the product. Never sell authority that money cannot lawfully create.**
