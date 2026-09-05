# Klinikos Pricing Fabric Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire Core/Growth/Scale as active new-sale authority, preserve historical payment evidence, and make one configuration-based Pricing Fabric drive approved organization offers, checkout, provisioning, Stripe projection, UI, Zumi/current docs, and commercial tests.

**Architecture:** Extend the existing commercial catalog/checkout/provisioning/payment infrastructure rather than creating a second registry. Add a pure server-owned Pricing Fabric composer and explicit pricing-classification/offer-lifecycle axes. Legacy fixed-tier identifiers become evidence-only compatibility keys; new organization checkout consumes an approved versioned offer rather than a tier key.

**Tech Stack:** TypeScript, Zod, Next.js 15.5, Prisma/PostgreSQL, Stripe server integration, Vitest, existing Klinikos commercial ledger and checkout services.

**Spec:** `docs/superpowers/specs/2026-09-05-klinikos-pricing-fabric-convergence-design.md`

## Global Constraints

- Person identity remains free.
- Organization operational activation remains commercial.
- Payment never creates identity, organization, clinical, credential, eligibility, legal, tenant, referral, or PHI authority.
- Keep one product/catalog/offer authority; no parallel pricing registry.
- Keep historical payment/checkout/subscription keys resolvable.
- Core/Growth/Scale cannot start a new sale after convergence.
- Stripe consumes approved Klinikos offer truth; Stripe never defines it.
- No live Stripe writes in implementation until exact repository behavior is green and a separate reviewed go-live action is authorized.
- No fee-splitting or regulated transaction percentage is activated by this plan.
- Do not modify historical documents to pretend old pricing never existed.
- Any schema migration must be additive, idempotent, and fresh-database verified before cleanup.
- Current public service-offer status must be reconciled, not guessed from amount/name similarity.

---

### Task 1: Create the stale-pricing convergence guard

**Files:**
- Create: `tests/pricing-fabric-convergence.test.ts`
- Read: `src/lib/commercial/product-catalog.ts`
- Read: `src/lib/commercial/clinic-activation-rules.ts`
- Read: `src/lib/commercial/stripe-commercial-projection.ts`
- Read: `src/app/pricing/page.tsx`
- Read: `src/app/(platform)/admin/commercial/page.tsx`
- Read: `docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md`

**Interfaces:**
- Consumes: current repository source text.
- Produces: a machine guard proving retired new-sale authority cannot reappear.

- [ ] **Step 1: Write the failing source-contract test**

Create a test with explicit active-authority paths:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const activePaths = [
  "src/lib/commercial/clinic-activation-rules.ts",
  "src/lib/commercial/stripe-commercial-projection.ts",
  "src/app/pricing/page.tsx",
  "src/app/(platform)/admin/commercial/page.tsx",
  "docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md",
];

const retiredKeys = ["clinic_core", "clinic_growth", "clinic_scale"] as const;

describe("Pricing Fabric convergence", () => {
  it("does not allow retired tier keys in active new-sale authorities", () => {
    for (const path of activePaths) {
      const source = readFileSync(path, "utf8");
      for (const key of retiredKeys) expect(source).not.toContain(key);
    }
  });

  it("keeps legacy keys explicitly evidence-only in the catalog", () => {
    const source = readFileSync("src/lib/commercial/product-catalog.ts", "utf8");
    for (const key of retiredKeys) expect(source).toContain(key);
    expect(source).toContain("legacy_evidence_only");
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx vitest run tests/pricing-fabric-convergence.test.ts
```

Expected: FAIL because current active checkout, Stripe projection, admin/pricing/Zumi surfaces still contain the three retired keys.

- [ ] **Step 3: Commit RED evidence**

```bash
git add tests/pricing-fabric-convergence.test.ts
git commit -m "test(commercial): require retired tier convergence"
```

---

### Task 2: Separate pricing classification from offer lifecycle in the existing catalog

**Files:**
- Modify: `src/lib/commercial/product-catalog.ts`
- Modify: `tests/pricing-truth.test.ts`
- Create: `tests/commercial-pricing-classification.test.ts`

**Interfaces:**
- Produces:

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
```

- [ ] **Step 1: Write RED behavior tests**

Require every catalog item to expose a `pricingClassification`. Require the three clinic tier keys to classify `RETIRED`, lifecycle `legacy_evidence_only`, `publicPurchasable: false`, `directPublicCheckoutEligible: false`, and `conversionDestination: null`.

Example:

```ts
for (const key of ["clinic_core", "clinic_growth", "clinic_scale"] as const) {
  const offer = getCommercialProduct(key);
  expect(offer?.pricingClassification).toBe("RETIRED");
  expect(offer?.lifecycle).toBe("legacy_evidence_only");
  expect(offer?.publicPurchasable).toBe(false);
  expect(offer?.directPublicCheckoutEligible).toBe(false);
  expect(offer?.conversionDestination).toBeNull();
  expect(offer && canStartNewCommercialCheckout(offer)).toBe(false);
}
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/commercial-pricing-classification.test.ts tests/pricing-truth.test.ts
```

Expected: FAIL because classification is absent and tiers are active.

- [ ] **Step 3: Add the classification field to `CommercialProduct`**

Add:

```ts
pricingClassification: PricingClassification;
```

Classify existing current service entries conservatively from current source authority; do not infer new public availability from live Stripe alone. Mark Core/Growth/Scale `RETIRED` and `legacy_evidence_only` while keeping their original amount/key data only where historical reconciliation requires it.

- [ ] **Step 4: Make `canStartNewCommercialCheckout` fail closed**

Use:

```ts
export function canStartNewCommercialCheckout(product: CommercialProduct) {
  return (
    product.lifecycle === "active" &&
    product.pricingClassification !== "RETIRED" &&
    product.pricingClassification !== "LEGACY_QUOTED"
  );
}
```

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/commercial-pricing-classification.test.ts tests/pricing-truth.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/commercial/product-catalog.ts tests/commercial-pricing-classification.test.ts tests/pricing-truth.test.ts
git commit -m "feat(commercial): classify retired tier evidence"
```

---

### Task 3: Build the pure Pricing Fabric composer

**Files:**
- Create: `src/lib/commercial/pricing-fabric.ts`
- Create: `tests/pricing-fabric.test.ts`

**Interfaces:**
- Produces:

```ts
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

export type CommercialOfferLineItem = {
  code: string;
  label: string;
  billing: "ONE_TIME" | "RECURRING" | "USAGE";
  amountCents: number | null;
  classification: PricingClassification;
};

export type ComposedCommercialOffer = {
  commercialVersion: string;
  pricingClassification: PricingClassification;
  state: CommercialOfferState;
  currency: "usd";
  configuration: CommercialConfigurationInput;
  lineItems: readonly CommercialOfferLineItem[];
  contractRequired: boolean;
  paymentRail: "STRIPE" | "MANUAL_INVOICE" | "NONE";
};

export function composeOrganizationOffer(input: CommercialConfigurationInput): ComposedCommercialOffer;
```

- [ ] **Step 1: Write RED tests for configuration validation and no invented price**

Tests must prove:

```ts
expect(() => composeOrganizationOffer({ ...valid, locationCount: 0 })).toThrow();
expect(() => composeOrganizationOffer({ ...valid, providerCount: -1 })).toThrow();

const offer = composeOrganizationOffer(valid);
expect(offer.configuration).toEqual(valid);
expect(offer.state).toBe("QUOTE_ONLY");
expect(offer.pricingClassification).toBe("ACTIVE_PRIVATE");
expect(offer.lineItems.every((item) => item.amountCents === null)).toBe(true);
expect(offer.contractRequired).toBe(true);
```

The first implementation must **not invent private component prices** merely to make the composer look complete.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/pricing-fabric.test.ts
```

Expected: FAIL because the composer does not exist.

- [ ] **Step 3: Implement the minimum truthful composer**

Validate numeric counts as non-negative integers, normalize/sort capability and integration keys, freeze the returned object, set the commercial version to a new explicit source constant such as `2026-09-05.fabric-v1`, and produce named line-item categories with `amountCents: null` until governed price components are approved.

The initial categories are:

```ts
[
  "organization_base",
  "locations",
  "clinical_capabilities",
  "revenue_rcm",
  "grid_network",
  "edu_workforce",
  "zumi_usage",
  "integrations",
  "support_sla",
  "implementation_migration",
]
```

Only include a category when corresponding input requires it. Do not expose private margin logic.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/pricing-fabric.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/commercial/pricing-fabric.ts tests/pricing-fabric.test.ts
git commit -m "feat(commercial): add configuration pricing fabric"
```

---

### Task 4: Replace tier-key checkout input with approved-offer input

**Files:**
- Modify: `src/lib/commercial/clinic-activation-rules.ts`
- Modify: `src/lib/commercial/clinic-provisioning.ts`
- Modify: `src/app/api/admin/commercial/clinic-checkouts/route.ts`
- Create: `tests/commercial-approved-offer-checkout.test.ts`

**Interfaces:**
- Replace new-sale request shape:

```ts
{
  clinicName: string;
  email: string;
  productKey: "clinic_core" | "clinic_growth" | "clinic_scale";
}
```

with a new-sale shape:

```ts
{
  clinicName: string;
  email: string;
  offerId: string;
  commercialVersion: string;
}
```

Historical reconciliation functions may still accept/read old stored product keys; new checkout creation may not.

- [ ] **Step 1: Write RED tests**

Assert `clinicCheckoutRequestSchema` rejects `productKey: "clinic_core"` and requires `offerId` plus `commercialVersion`.

Add a provisioning test that passes a fake approved offer resolver returning:

```ts
{
  offerId: "offer_test_1",
  commercialVersion: "2026-09-05.fabric-v1",
  state: "READY",
  organizationId: null,
  totalCents: 125000,
  currency: "usd",
  entitlementKeys: ["advanced_reports"],
}
```

and proves checkout persistence records the offer/version/amount rather than selecting a tier.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/commercial-approved-offer-checkout.test.ts
```

- [ ] **Step 3: Extend existing checkout persistence minimally**

Use existing metadata/columns where sufficient. If exact schema inspection proves `offerId`/`commercialVersion` cannot be stored without loss, add nullable fields to the existing checkout intent model with one additive migration. Do not create a second checkout table.

When an additive migration is required, use names:

```prisma
offerId            String?
commercialVersion String?
```

Keep historical `productKey` nullable/readable until migration/reconciliation is complete.

- [ ] **Step 4: Fail closed on offer state**

Checkout creation accepts only an exact resolved offer whose state is `READY`, whose version matches the request, whose amount/currency are server-owned, and whose organization context matches the authorized workspace when organization-scoped.

- [ ] **Step 5: Run GREEN plus migration checks**

```bash
npx vitest run tests/commercial-approved-offer-checkout.test.ts
npm run db:generate
npm run db:validate
```

If a migration was added, also run the repository fresh-migration test/gate.

- [ ] **Step 6: Commit**

Commit only checkout/schema files from this task.

---

### Task 5: Preserve historical Core/Growth/Scale reconciliation without new sales

**Files:**
- Modify: `src/lib/commercial/stripe-clinic-subscriptions.ts`
- Modify: `src/lib/commercial/clinic-provisioning.ts`
- Create: `src/lib/commercial/legacy-clinic-plan-evidence.ts`
- Create: `tests/legacy-clinic-plan-evidence.test.ts`

**Interfaces:**

```ts
export type LegacyClinicPlanKey = "clinic_core" | "clinic_growth" | "clinic_scale";

export function isLegacyClinicPlanKey(value: string | null | undefined): value is LegacyClinicPlanKey;
export function legacyClinicPlanEvidence(key: LegacyClinicPlanKey): {
  key: LegacyClinicPlanKey;
  pricingClassification: "RETIRED";
  newSaleAllowed: false;
};
```

- [ ] **Step 1: Write RED tests**

Prove all three historical keys resolve as `RETIRED`, `newSaleAllowed: false`, and are accepted only by historical subscription/webhook reconciliation code—not by new checkout schema.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/legacy-clinic-plan-evidence.test.ts
```

- [ ] **Step 3: Add the server-only compatibility module**

The module contains no public copy and no active prices. Move historical-key type narrowing out of `stripe-clinic-subscriptions.ts` into this module.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/legacy-clinic-plan-evidence.test.ts tests/stripe-price-resolver.test.ts
```

Existing historical fixtures may remain, but tests must describe them as legacy evidence rather than current offers.

- [ ] **Step 5: Commit**

Commit compatibility and tests separately from UI changes.

---

### Task 6: Refactor Stripe projection to approved offers

**Files:**
- Modify: `src/lib/commercial/stripe-commercial-projection.ts`
- Modify: `src/lib/commercial/stripe-price-resolver.ts` if current implementation requires it
- Modify: `tests/stripe-commercial-projection.test.ts`
- Modify: `tests/stripe-price-resolver.test.ts`

**Interfaces:**

Create/extend a projection function shaped like:

```ts
export function projectOfferToStripe(input: {
  offerId: string;
  commercialVersion: string;
  amountCents: number;
  currency: "usd";
  billing: "one_time" | "month" | "year";
  qualificationRequired: boolean;
}): StripeCommercialProjection;
```

- [ ] **Step 1: Write RED tests**

Require the active projection source not to import `clinicPlans` and not to generate Core/Growth/Scale lookup keys.

Require projected metadata to carry `offerId` and `commercialVersion` so a webhook can reconcile processor evidence back to Klinikos truth.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/stripe-commercial-projection.test.ts tests/stripe-price-resolver.test.ts
```

- [ ] **Step 3: Remove fixed subscription projection generation**

Delete only the active `clinicSubscriptionProjections` generator. Preserve historical resolver logic through `legacy-clinic-plan-evidence.ts` where required.

- [ ] **Step 4: Add approved-offer projection**

Do not create live Stripe objects here. Produce server request/projection data only.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/stripe-commercial-projection.test.ts tests/stripe-price-resolver.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/commercial/stripe-commercial-projection.ts src/lib/commercial/stripe-price-resolver.ts tests/stripe-commercial-projection.test.ts tests/stripe-price-resolver.test.ts
git commit -m "refactor(commercial): project approved offers to Stripe"
```

---

### Task 7: Replace public/admin tier selection with Configure My Klinikos

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/(platform)/admin/commercial/page.tsx`
- Modify: `src/app/klinikos/page.tsx`
- Modify: `src/app/operational-audit/page.tsx`
- Create: `src/components/commercial/configure-my-klinikos.tsx`
- Create: `tests/configure-my-klinikos.test.ts`

**Interfaces:**
- Consumes `CommercialConfigurationInput` and public-safe offer state.
- Never receives private component-margin logic.

- [ ] **Step 1: Write RED source/behavior tests**

Require:

```text
pricing page: no Core/Growth/Scale plan cards
admin new-sale surface: no clinic_core/growth/scale selector
public CTA: Configure my Klinikos
person/free language remains separate from organization commercial activation
quote-only state is truthful
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/configure-my-klinikos.test.ts tests/landing-funnel.test.ts
```

- [ ] **Step 3: Implement the semantic configuration form**

Use normal DOM controls for organization type, location/provider/team counts, capability groups, integrations, Zumi usage, support, and implementation/migration class. Keep it useful without WebGL and fully keyboard/screen-reader accessible.

No arbitrary price may be rendered when the offer is `QUOTE_ONLY`.

- [ ] **Step 4: Update public copy**

Replace commercial use of “Klinikos Core/Growth/Scale” with configuration-based language. Preserve non-commercial phrases such as “Klinikos core + specialty pack” when they mean platform architecture, not a price plan.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/configure-my-klinikos.test.ts tests/landing-funnel.test.ts
```

- [ ] **Step 6: Commit**

Commit the UI tranche separately.

---

### Task 8: Converge Zumi, README, current commercial docs, and funding profiles

**Files:**
- Modify: `docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md`
- Modify: `README.md`
- Modify: `docs/KLINIKOS_COMMERCIAL_CANON.md`
- Modify: `docs/KLINIKOS_CURRENT_PROJECT_STATE.md`
- Modify: `docs/business/funding/KLINIKOS_CAPITAL_COMMAND_CENTER_2026-09-02.md`
- Modify only current/reusable business docs returned by the stale-pricing audit; historical dated evidence stays historical.
- Create: `tests/current-commercial-copy-convergence.test.ts`

**Interfaces:**
- Produces one current pricing story for public/sales/Zumi/lender reuse.

- [ ] **Step 1: Write RED test with a curated current-authority file list**

Reject active customer-facing uses of:

```text
Klinikos Core — $995
Klinikos Growth — $1,995
Klinikos Scale — $3,995
clinic_core
clinic_growth
clinic_scale
```

Do not scan `docs/history/**` as if history were current authority.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/current-commercial-copy-convergence.test.ts
```

- [ ] **Step 3: Update current docs truthfully**

Current docs must say:

```text
Person identity: free.
Organization operational activation: commercial.
Organization pricing: configuration-based Pricing Fabric.
Final offer: approved/versioned; may be quote-only.
Stripe: payment rail, not price authority.
Legacy fixed clinic tiers: retired for new sales; retained only as historical evidence where required.
```

For the live $500/$1,500/$3,500 service products, state only verified processor facts unless current commercial authority explicitly approves them as public/current offers.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/current-commercial-copy-convergence.test.ts tests/canon-synchronization.test.ts
```

- [ ] **Step 5: Commit**

Commit docs/current-context separately.

---

### Task 9: Replace the MVP activation journey with an approved-offer journey

**Files:**
- Modify: `scripts/mvp/activation-journey.mts`
- Modify: `tests/mvp-commercial-activation.test.ts`
- Modify: `docs/MVP_JOURNEYS.md`

**Interfaces:**
- Consumes a synthetic approved `READY` offer.
- Produces the same truthful organization activation proof without a retired tier.

- [ ] **Step 1: Write RED test**

Require the journey source to exclude `clinic_core`, `clinic_growth`, `clinic_scale` and to create/use a synthetic approved offer identifier/version.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/mvp-commercial-activation.test.ts
```

- [ ] **Step 3: Update the journey**

The synthetic journey sequence becomes:

```text
authorized sales context
→ compose/seed approved synthetic offer
→ checkout intent
→ verified synthetic/manual processor evidence under test controls
→ bounded software entitlement
→ organization activation
→ restart/readback proof
```

Payment still must not create organization claim authority or regulated clinical authority.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/mvp-commercial-activation.test.ts
npm run test:mvp
```

- [ ] **Step 5: Commit**

Commit the journey and its documentation.

---

### Task 10: Repository-wide stale-authority inventory and PR retirement evidence

**Files:**
- Create: `docs/governance/KLINIKOS_PRICING_CONVERGENCE_EVIDENCE_2026-09-05.md`
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json` only to update implementation evidence/state after exact behavior is proven.
- Modify: `docs/BRANCH_LEDGER.md` only after final PR/branch dispositions are known.

**Interfaces:**
- Produces a classified search inventory: `ACTIVE_FIXED`, `HISTORICAL_EVIDENCE`, `LEGACY_COMPATIBILITY`, `NON_COMMERCIAL_WORD_CORE`, `CURRENT_FABRIC`.

- [ ] **Step 1: Run repository searches**

Search at minimum:

```bash
rg -n 'clinic_core|clinic_growth|clinic_scale|Klinikos Core|Klinikos Growth|Klinikos Scale|\$995|\$1,995|\$3,995|10,149|20,349|40,749' . \
  --glob '!node_modules/**' \
  --glob '!.git/**'
```

Classify every remaining hit. `KLINIKOS CORE` that means the platform core is not a pricing defect; document why.

- [ ] **Step 2: Require zero `ACTIVE_FIXED` hits**

Add the final classifications to the evidence document with path, purpose, and disposition.

- [ ] **Step 3: Run full repository verification**

```bash
npm run governance:traceability
npm run security:check
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
git diff --check
```

- [ ] **Step 4: Push and require exact-head GitHub Quality**

Require:

```text
Quality / verify = success
Quality / deploy-contract = success
```

- [ ] **Step 5: Browser proof**

Verify desktop and intentional 390px mobile for `/pricing` and the commercial admin/configuration path, including keyboard, visible focus, 200% zoom, empty/quote-only/error state, and no horizontal overflow.

- [ ] **Step 6: Live Stripe read-only reconciliation**

Re-read live KLINIKOS.IO products/prices. Record exact processor evidence without changing it. Confirm code does not claim absent Core/Growth/Scale live prices.

- [ ] **Step 7: Review overlapping PRs**

For PRs #498, #521, and #523, compare final replacement behavior and classify useful unique work. Only after equivalent accepted requirements are present and verified may they be marked `HARVESTED_AND_CLOSE` or `SUPERSEDED_AND_CLOSE`.

- [ ] **Step 8: Fresh-main concurrency check and merge**

Fetch current `main`, compare overlapping changes, rebase/reverify if required, then merge only the exact green head. After merge, verify merged-main Quality. Do not call production pricing deployed until the deployed SHA/runtime is separately proven.
