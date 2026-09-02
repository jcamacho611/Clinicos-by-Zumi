# Commercial Universe Stripe Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Klinikos Offer Registry express Canon-complete pricing state and deterministic Stripe rail selection so the broad test-mode Stripe universe cannot become a second source of product truth.

**Architecture:** Extend the existing `commercialProducts` kernel rather than creating another product registry. `stripe-commercial-projection.ts` remains the environment-neutral Stripe bridge and gains explicit rail/policy projection, including two distinct Connect target rails. Stripe object IDs stay external evidence only; stable lookup keys and pricing versions remain safe correlation handles.

**Tech Stack:** TypeScript, Next.js server-only modules, Vitest, Stripe-hosted Checkout/Billing/Invoices/Connect as external rails, GitHub Actions Quality.

**Spec:** `docs/superpowers/specs/2026-09-01-integrated-commercial-execution-design.md`, governed by `docs/KLINIKOS_MASTER_CANON.md` and the active `docs/KLINIKOS_COMMERCIAL_CANON.md`.

## Global Constraints

- Exactly five Klinikos planes; no sixth commercial plane.
- One Offer Registry; Stripe is never product authority.
- `CHECKOUT CREATED != PAID`, `PAYMENT != ENTITLEMENT`, `PAYMENT != CLINICAL AUTHORITY`.
- Test and live Stripe IDs differ and must never be canonical source constants.
- No PHI in Stripe products, prices, metadata, links, invoices, or analytics.
- Grid clinical/referral economics remain jurisdiction/resource-class policy-gated; no universal percentage fee.
- Current clinic anchors remain unchanged in this tranche.
- Target/test offers must not become direct public checkout merely because a sandbox Stripe object exists.

---

### Task 1: Canon-complete pricing status on the existing Offer Registry

**Files:**
- Modify: `src/lib/commercial/product-catalog.ts`
- Create: `tests/commercial-pricing-status.test.ts`

**Interfaces:**
- Consumes: existing `commercialProducts` and Master Canon pricing-generation states.
- Produces: `CommercialPricingStatus`, `pricingStatus` on every `CommercialProduct`, `isCurrentCommercialPricing(product)`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { commercialProducts } from "@/lib/commercial/product-catalog";

const allowed = new Set([
  "ACTIVE_PUBLIC", "ACTIVE_PRIVATE", "LEGACY_QUOTED", "GRANDFATHERED", "TARGET", "SCENARIO", "RETIRED",
]);

describe("commercial pricing status", () => {
  it("classifies every offer using the Master Canon pricing vocabulary", () => {
    expect(commercialProducts.length).toBeGreaterThan(0);
    for (const product of commercialProducts) expect(allowed.has(product.pricingStatus)).toBe(true);
  });

  it("keeps active public, active private, and retired history distinct", () => {
    expect(commercialProducts.find((p) => p.key === "clinic_core")?.pricingStatus).toBe("ACTIVE_PUBLIC");
    expect(commercialProducts.find((p) => p.key === "clinic_enterprise")?.pricingStatus).toBe("ACTIVE_PRIVATE");
    expect(commercialProducts.find((p) => p.key === "grid_professional")?.pricingStatus).toBe("RETIRED");
  });
});
```

- [ ] **Step 2: Run the focused test and prove RED**

Run: `npx vitest run tests/commercial-pricing-status.test.ts`
Expected: FAIL because `pricingStatus` does not exist.

- [ ] **Step 3: Implement the minimum registry extension**

Add the seven-state Canon union and assign current offers without changing prices or checkout eligibility. Keep legacy processor aliases historical-only.

- [ ] **Step 4: Run the focused test and prove GREEN**

Run: `npx vitest run tests/commercial-pricing-status.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(commercial): classify canonical pricing status"`

### Task 2: Deterministic Stripe rail projection

**Files:**
- Modify: `src/lib/commercial/stripe-commercial-projection.ts`
- Modify: `tests/stripe-commercial-projection.test.ts`

**Interfaces:**
- Consumes: canonical offer route, pricing status, qualification state, fixed/starting/custom price truth.
- Produces: `StripeCommercialRail = checkout | billing | quote_invoice | prepaid_usage | none` and projected `pricingStatus`.

- [ ] **Step 1: Extend the existing test first**

Add expectations that:
- `operational_audit` projects `rail: "checkout"`;
- Core/Growth/Scale project `rail: "billing"` while remaining `publicLinkEligible: false`;
- Blueprint/Founding/Enterprise project `rail: "quote_invoice"`;
- historical aliases project `rail: "none"`;
- projected `pricingStatus` always matches the Offer Registry.

- [ ] **Step 2: Run and prove RED**

Run: `npx vitest run tests/stripe-commercial-projection.test.ts`
Expected: FAIL on missing `rail` / `pricingStatus`.

- [ ] **Step 3: Implement rail projection without Stripe IDs**

Extend `StripeCommercialProjection`; do not expose or hard-code `prod_`, `price_`, `plink_`, Checkout Session, Subscription, Invoice, or PaymentIntent IDs.

- [ ] **Step 4: Run and prove GREEN**

Run: `npx vitest run tests/stripe-commercial-projection.test.ts tests/commercial-pricing-status.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(stripe): project canonical payment rails"`

### Task 3: Encode the two Connect target rails without activating them

**Files:**
- Create: `src/lib/commercial/stripe-connect-policy.ts`
- Create: `tests/stripe-connect-policy.test.ts`

**Interfaces:**
- Produces: `stripeConnectRails` with `clinic_direct_charge` and `grid_separate_charge_transfer` target-policy definitions.

- [ ] **Step 1: Write failing policy tests**

Require:
- Clinic rail uses direct charges, connected clinic merchant-of-record semantics, `card_payments`/merchant capability, and remains policy gated.
- Grid rail uses separate charges and transfers, platform liability semantics, recipient/transfer capability, and remains resource-class/jurisdiction gated.
- Neither rail says payment can establish credential, clinical, PHI, Grid-eligibility, or consent authority.
- The serialized policy contains no Stripe object IDs or PHI vocabulary.

- [ ] **Step 2: Run and prove RED**

Run: `npx vitest run tests/stripe-connect-policy.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add pure server-only target policy**

Do not create connected accounts, transfers, public marketplace checkout, or clinical fee percentages in this tranche.

- [ ] **Step 4: Run and prove GREEN**

Run: `npx vitest run tests/stripe-connect-policy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(stripe): define governed Connect rails"`

### Task 4: Refresh the active Commercial Canon without inventing new live prices

**Files:**
- Modify: `docs/KLINIKOS_COMMERCIAL_CANON.md`
- Modify: `tests/canon-synchronization.test.ts` only if a durable synchronization assertion is needed.

**Interfaces:**
- Consumes: Master Canon and the executable registry after Tasks 1-3.
- Produces: current category (`THE OPERATING NETWORK FOR HEALTHCARE`), the broad connected revenue architecture, the seven pricing states, buyer-specific payment rails, two Connect rails, and explicit anti-double-charge/package-family law.

- [ ] **Step 1: Add/adjust a synchronization assertion before the document change**

Require the active Commercial Canon to contain `THE OPERATING NETWORK FOR HEALTHCARE`, the seven-state pricing vocabulary, `Stripe is a payment rail`, and `no universal Grid transaction percentage`.

- [ ] **Step 2: Prove RED if the assertion is new**

Run: `npx vitest run tests/canon-synchronization.test.ts`

- [ ] **Step 3: Merge current commercial law into the existing document**

Preserve the approved clinic anchors. Add family-level packaging: Clinic/Organization, Professional, Grid/Capacity, EDU/Workforce, Intelligence/RCM/Trust add-ons, Services/Implementation, Enterprise/Government/API, and Customer-Funded Usage. State that variants are not separate companies/products and capabilities included in a higher plan must not be double charged without a documented packaging reason.

- [ ] **Step 4: Prove GREEN**

Run: `npx vitest run tests/canon-synchronization.test.ts tests/commercial-pricing-status.test.ts tests/stripe-commercial-projection.test.ts tests/stripe-connect-policy.test.ts`

- [ ] **Step 5: Commit**

`git commit -m "docs(commercial): converge universe monetization law"`

### Task 5: Full exact-head release gate and merge

**Files:** no new production files unless a real regression is discovered.

- [ ] Run `git diff --check`.
- [ ] Run Prisma generate/validate.
- [ ] Run typecheck and lint.
- [ ] Run focused commercial tests.
- [ ] Run full repository tests and PostgreSQL journeys through the canonical Quality workflow.
- [ ] Run confidentiality/security gates and production build/start.
- [ ] Re-fetch `main`; require no unsafe overlap or stale base.
- [ ] Require zero unresolved review threads.
- [ ] Merge only the exact green candidate head.
- [ ] Re-fetch `main` and record the merge SHA.

## Self-review

- Spec coverage: Offer Registry authority, pricing provenance, Stripe projection, Connect architecture, automatic collection, qualification separation, no-PHI processor data, and anti-double-charge packaging are covered.
- No placeholders/TODOs are used.
- Type names are consistent across tasks.
- This plan deliberately does not activate live Connect, create a second wallet, publish target/test prices, or alter current clinic price anchors.
