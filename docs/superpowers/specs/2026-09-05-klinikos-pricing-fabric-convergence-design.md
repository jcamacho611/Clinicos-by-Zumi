# Klinikos Pricing Fabric Convergence Design

Date: 2026-09-05
Status: `APPROVED_DIRECTION / IMPLEMENTATION_DESIGN`
Authority: subordinate to `docs/KLINIKOS_MASTER_CANON.md`
Programs: P04 Organization Activation & Configuration, P08 Financial OS, P14 Company Command, P23 New Revenue Hunt

## 1. Problem

Klinikos has one strategic pricing law but several incompatible active representations.

Current `main` still treats `clinic_core`, `clinic_growth`, and `clinic_scale` as active reviewed subscription products in the product catalog, checkout validation, provisioning, Stripe projection, admin UI, public pricing/sales surfaces, MVP journeys, tests, and current commercial documentation.

The founder-approved direction supersedes that fixed three-plan ladder for new organization sales. Organization pricing must be configured from the customer's actual operating shape rather than forcing every clinic into Core/Growth/Scale.

Live Stripe evidence also does not match the current repository subscription model. A read-only live account inspection on 2026-09-05 found three active one-time service products/prices and no active Core/Growth/Scale lookup-key prices:

- Clinic Operating Analysis — $500 one-time;
- Klinikos Operational Audit — $1,500 one-time;
- Klinikos Workflow Sprint — $3,500 one-time;
- zero prices returned for `klinikos_clinic_{core|growth|scale}_{monthly|annual}_v1` lookup keys.

Processor objects are evidence of processor state. They are not by themselves Klinikos offer authority.

## 2. Permanent commercial laws

1. Person identity is free.
2. Organization operational activation is commercial.
3. Payment does not create organization authority, identity verification, professional verification, clinical authority, eligibility, legal authority, tenant permission, referral priority, PHI permission, or production readiness.
4. Stripe is a payment/billing/invoice/subscription/settlement rail, never product or pricing authority.
5. Historical processor and database records must remain reconcilable after pricing strategy changes.
6. No active customer-facing surface may continue selling the retired fixed Core/Growth/Scale ladder.
7. No historical artifact is rewritten merely to make prior pricing disappear.
8. Revenue should precede avoidable variable cost.

## 3. One commercial authority, not a second registry

Reuse the existing commercial kernel:

- `src/lib/commercial/product-catalog.ts` remains the catalog/template authority for named executable offers and historical aliases;
- existing checkout/payment/reconciliation/provisioning services remain the execution substrate;
- the Pricing Fabric is a composer that produces a versioned `CommercialOffer` from configuration facts. It is not another product catalog;
- Stripe projection consumes an approved offer/payment line item. It does not infer an offer from a Stripe Price.

Do not introduce a parallel commercial database unless current schema inspection proves persistence cannot be represented through the existing checkout/offer/organization/configuration records. If persistence changes are required, extend existing records/migrations rather than creating a second commercial system.

## 4. Separate three concepts that were previously collapsed

### 4.1 Pricing classification

Keep the Master Canon classification vocabulary:

- `ACTIVE_PUBLIC`
- `ACTIVE_PRIVATE`
- `LEGACY_QUOTED`
- `GRANDFATHERED`
- `TARGET`
- `SCENARIO`
- `RETIRED`

### 4.2 Offer lifecycle

Use a separate offer lifecycle when needed:

- `DRAFT`
- `QUOTE_ONLY`
- `READY`
- `CONTRACTED`
- `EXPIRED`
- `POLICY_REVIEW`
- `RETIRED`

This preserves newer founder language such as `QUOTE_ONLY`, `CONTRACTED`, and `POLICY_REVIEW` without corrupting the Canon's pricing-classification axis.

### 4.3 Payment/settlement state

Payment truth remains independent:

`PRICE ≠ CHECKOUT ≠ PAYMENT ≠ ENTITLEMENT ≠ OBLIGATION ≠ PAYABLE ≠ PAYOUT ≠ SETTLEMENT ≠ REFUND ≠ RECONCILIATION`.

## 5. Configuration-based Pricing Fabric

A new organization offer is composed from governed facts such as:

- organization base;
- organization type;
- locations;
- users/providers;
- enabled capabilities;
- clinical complexity;
- workflow complexity;
- specialty/configuration packs;
- Revenue/RCM scope;
- Grid/network scope;
- EDU/workforce scope;
- Zumi/AI usage allowance;
- data/storage requirements;
- integrations;
- support/SLA;
- implementation;
- migration;
- managed/variable services;
- external vendor costs;
- lawfully reviewed transaction economics.

The Pricing Fabric outputs a versioned offer. It does not expose private margin logic, proprietary scoring, hidden discount rules, or sensitive buyer strategy to the browser.

## 6. CommercialOffer contract

Conceptual server-owned contract:

```ts
export type PricingClassification =
  | "ACTIVE_PUBLIC"
  | "ACTIVE_PRIVATE"
  | "LEGACY_QUOTED"
  | "GRANDFATHERED"
  | "TARGET"
  | "SCENARIO"
  | "RETIRED";

export type CommercialOfferState =
  | "DRAFT"
  | "QUOTE_ONLY"
  | "READY"
  | "CONTRACTED"
  | "EXPIRED"
  | "POLICY_REVIEW"
  | "RETIRED";

export type CommercialConfigurationInput = {
  organizationType: string;
  locationCount: number;
  providerCount: number;
  staffCount: number;
  capabilities: readonly string[];
  clinicalComplexity: "NONE" | "LOW" | "MODERATE" | "HIGH";
  integrationKeys: readonly string[];
  zumiUsageClass: "NONE" | "LIGHT" | "STANDARD" | "HEAVY";
  supportClass: "STANDARD" | "PRIORITY" | "ENTERPRISE";
  implementationClass: "CONFIGURE" | "MIGRATE" | "MULTI_LOCATION" | "CUSTOM";
};

export type CommercialOffer = {
  offerId: string;
  organizationId: string | null;
  commercialVersion: string;
  pricingClassification: PricingClassification;
  state: CommercialOfferState;
  currency: "usd";
  validFrom: Date;
  validUntil: Date | null;
  configuration: CommercialConfigurationInput;
  lineItems: readonly CommercialOfferLineItem[];
  usagePolicy: readonly CommercialUsageRule[];
  supportSla: string;
  contractRequired: boolean;
  paymentRail: "STRIPE" | "MANUAL_INVOICE" | "NONE";
  authoritySource: string;
};
```

Exact types must follow repository conventions during implementation. The essential rule is separation of configuration, price classification, offer lifecycle, payment rail, contract requirement, and authority source.

## 7. Retired Core/Growth/Scale handling

`clinic_core`, `clinic_growth`, `clinic_scale` are retired for **new sales authority**.

They may survive only in narrowly scoped server-side compatibility/evidence paths when required to:

- reconcile historical checkout/subscription/webhook records;
- render old invoices/contracts truthfully;
- migrate persisted customer records;
- process a legitimate grandfathered agreement.

They must not remain:

- public purchasable products;
- new checkout choices;
- admin new-sale choices;
- Zumi current pricing context;
- public pricing cards;
- README/current Canon commercial anchors;
- sales scripts;
- lender/investor reusable current pricing claims;
- new Stripe lookup-key projections;
- default MVP activation fixtures.

A server compatibility map may temporarily resolve legacy identifiers to evidence-only records. It must never silently convert a legacy tier into a new configuration offer.

## 8. Existing one-time service offers

Do not assume that repository labels or live Stripe objects automatically determine current strategic status.

Implementation must reconcile each service offer against current Canon/founder authority and classify it explicitly:

- Clinic Operating Analysis — live Stripe evidence exists at $500;
- Operational Audit — live Stripe evidence exists at $1,500;
- Workflow Sprint — live Stripe evidence exists at $3,500;
- Implementation Blueprint / Founding Implementation names in current code/docs require reconciliation against those live objects.

Until reconciled, public copy may not infer equivalence between differently named offers merely because amounts are similar.

## 9. Configure My Klinikos experience

Replace the three-card plan chooser with a useful configuration flow:

`ORGANIZATION TYPE → LOCATIONS → TEAM/PROVIDERS → WORKFLOWS → CURRENT SYSTEMS → PAIN/OUTCOME → CLINICAL NEEDS → BILLING/RCM → GRID/EDU → INTEGRATIONS → ZUMI USAGE → SUPPORT/SLA → IMPLEMENTATION/MIGRATION → REVIEW`.

Result states:

- deterministic public-safe estimate only when authority allows it;
- `QUOTE_ONLY` when final price needs commercial review;
- `POLICY_REVIEW` when legal/regulatory economics require review;
- `READY` only when an approved offer has complete line items and validity;
- `CONTRACTED` only after contract evidence exists.

The user should understand what they are configuring and what happens next. Internal pricing/margin heuristics remain server-side.

## 10. Stripe projection

Target sequence:

`KLINIKOS COMMERCIAL TRUTH → APPROVED OFFER → PAYABLE LINE ITEM(S) → STRIPE CHECKOUT/BILLING/INVOICE → SIGNED PROCESSOR EVENT → RECONCILIATION → KLINIKOS ENTITLEMENT/OBLIGATION DECISION → AUDIT`.

Rules:

- never create a Stripe Price to decide the product price;
- never treat a Stripe Product/Price as an entitlement;
- use stable metadata/versioning so processor evidence maps back to the Klinikos offer/version;
- preserve old processor IDs/metadata for reconciliation;
- live writes require a separate reviewed execution step;
- no automatic tax activation without verified registrations and tax design;
- use restricted credentials and signed webhooks per existing security rules.

## 11. Migration sequence

1. Build a machine-testable stale-pricing inventory.
2. Add classification/lifecycle fields to the existing catalog/commercial contracts.
3. Mark Core/Growth/Scale `RETIRED` / evidence-only for new sales while preserving historical resolution.
4. Introduce Pricing Fabric composition over organization configuration facts.
5. Replace fixed-tier checkout request with approved `offerId`/offer-version flow.
6. Migrate provisioning to consume approved offer entitlements/capabilities, not tier names.
7. Replace public/admin sales UI with Configure My Klinikos / approved-offer views.
8. Refactor Stripe projection to consume offers rather than generate fixed tier subscriptions.
9. Update Zumi/current docs/README/current funding profiles/tests/MVP journeys.
10. Search active repository until stale current-authority references are zero.
11. Retire overlapping RED PRs #498/#521/#523 only after their useful requirements are harvested and replacement evidence exists.

## 12. Safety and data migration

- Database migration must be additive before destructive cleanup.
- Existing completed checkout/payment/subscription rows retain original product key and processor evidence.
- Historical identifiers remain immutable evidence.
- New sales cannot use retired identifiers.
- A migration must be idempotent.
- No customer can gain new entitlement merely because a legacy key is mapped.
- No payment webhook can become unreconcilable after the change.
- No price migration may widen PHI, clinical, credential, tenant, Grid, or legal authority.

## 13. Done means repository-wide convergence

Not done until automated search/tests prove:

- zero active new-sale Core/Growth/Scale choices;
- zero public/current copy advertising those tiers;
- zero Zumi current-offer context teaching them;
- zero admin new-sale controls for them;
- zero new Stripe projection generation for them;
- zero default MVP activation using them;
- historical evidence remains resolvable;
- Person-free / organization-commercial law is intact;
- approved offers drive checkout/provisioning;
- exact-head Quality and commercial journey tests pass;
- live Stripe state is reconciled in evidence before any later processor mutation.

## 14. Economic purpose

This convergence improves:

- enterprise sales flexibility;
- implementation-margin control;
- ability to monetize clinical/RCM/Grid/EDU/Zumi/integration value separately;
- lender/investor credibility by eliminating contradictory prices;
- customer trust by preventing stale offers;
- gross-margin protection through explicit variable-cost allowances;
- future expansion revenue without software forks.

The strategic objective is not "more complicated pricing." It is **one coherent commercial truth that can price a simple organization simply and an enterprise accurately**.
