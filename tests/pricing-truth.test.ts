import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clinicCommercialOffers, clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { GRID_FEE_POLICY, GRID_MEMBERSHIP, computeGridPlatformFeeCents, gridFeeAmountForPolicy } from "@/lib/commercial/grid-economics";
import { demoOffers } from "@/lib/sales-demo-rules";

describe("Klinikos pricing truth", () => {
  it("keeps founding engagement amounts aligned across commercial and sales flows", () => {
    expect(clinicCommercialOffers.privateWorkflowReview.priceCents).toBe(demoOffers.private_workflow_demo.priceCents);
    expect(clinicCommercialOffers.foundingEvaluation.priceCents).toBe(demoOffers.founding_clinic_evaluation.priceCents);
    expect(clinicCommercialOffers.foundingImplementation.priceCents).toBe(demoOffers.founding_clinic_program.priceCents);
  });

  it("keeps clinic subscription anchors server-owned and internally consistent", () => {
    expect(clinicPlans.core.monthlyPriceCents).toBe(99_500);
    expect(clinicPlans.growth.monthlyPriceCents).toBe(199_500);
    expect(clinicPlans.scale.monthlyPriceCents).toBe(399_500);
    expect(clinicPlans.enterprise.monthlyPriceCents).toBeNull();
    expect(Object.values(clinicPlans).every((plan) => plan.implementationPriceLabel.length > 0)).toBe(true);
  });

  it("does not take a percentage of patient care or of a referral", () => {
    // This replaces a test that asserted 10% on professional, facility and seller
    // transactions alike — it was encoding the defect. A single percentage across every
    // Grid class treats renting a room and paying a clinician as the same transaction,
    // and the second one runs into fee splitting, corporate practice of medicine and
    // anti-kickback rules that differ by state.
    for (const resourceClass of ["regulated_clinical_service", "referral"]) {
      const policy = GRID_FEE_POLICY.find((entry) => entry.resourceClass === resourceClass);
      expect(policy, `${resourceClass} has no declared policy`).toBeDefined();
      expect(policy?.feeModel, `${resourceClass} must not carry a fee`).toBe("none");
      expect(policy?.percentBps).toBeNull();
    }
  });

  it("charges a flat fee rather than a share for a clinician's time", () => {
    const provider = GRID_FEE_POLICY.find((entry) => entry.resourceClass === "provider");
    expect(provider?.feeModel).toBe("fixed_per_transaction");
    expect(provider?.percentBps, "a share of professional compensation is the fee-splitting case").toBeNull();
  });

  it("earns nothing on a class no counsel has cleared", () => {
    // Null rather than zero: zero reads as "this is free and settled", null forces the
    // caller to notice the class is unpriced. Nothing is cleared today, so every
    // fee-bearing class answers null — the fee model is a proposal, not a live charge.
    expect(computeGridPlatformFeeCents("provider", 120_000)).toBeNull();
    expect(computeGridPlatformFeeCents("space", 120_000)).toBeNull();
    expect(computeGridPlatformFeeCents("unknown_class", 120_000)).toBeNull();

    // Zero is the right answer only where taking nothing is the stated policy rather
    // than an unanswered question: Klinikos does not take a cut of care or a referral.
    expect(computeGridPlatformFeeCents("regulated_clinical_service", 120_000)).toBe(0);
    expect(computeGridPlatformFeeCents("referral", 120_000)).toBe(0);
  });

  it("prices ordinary commercial exchange normally, with a floor and a ceiling", () => {
    // Exercised through the arithmetic directly. Every declared class fails closed
    // before reaching this math today, so going through computeGridPlatformFeeCents
    // would assert null and prove nothing about the floor or the cap.
    const space = GRID_FEE_POLICY.find((entry) => entry.resourceClass === "space");
    expect(space, "space has no declared policy").toBeDefined();

    expect(gridFeeAmountForPolicy(space!, 68_000)).toBe(6_800);
    // A very large booking should not produce a fee out of proportion to the matching work.
    expect(gridFeeAmountForPolicy(space!, 5_000_000)).toBe(50_000);
    expect(gridFeeAmountForPolicy(space!, 1_000)).toBe(500);
  });

  it("states one price per Grid tier, from one source", () => {
    // /klinikos read $49 for Grid Pro from one constant while /grid/pricing read $39
    // from another, so two public pages advertised different prices for the same thing.
    const pricingPage = readFileSync(join(process.cwd(), "src/app/grid/pricing/page.tsx"), "utf8");
    const klinikosPage = readFileSync(join(process.cwd(), "src/app/klinikos/page.tsx"), "utf8");
    for (const source of [pricingPage, klinikosPage]) {
      expect(source).not.toMatch(/gridCommercialModel/);
      // No hand-typed money on a pricing surface — it has to come from the constant.
      expect(source).not.toMatch(/\$\d+\/mo/);
    }
    expect(GRID_MEMBERSHIP.individualPro.priceLabel).toBe("$49/mo");
  });

  it("never lets a public pricing surface bypass the server-owned checkout intent", () => {
    const publicPricingFiles = [
      "src/app/pricing/page.tsx",
      "src/app/grid/pricing/page.tsx",
      "src/app/founding-clinic/page.tsx",
    ];

    for (const relativePath of publicPricingFiles) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/paylinks\.godaddy\.com/i);
      expect(source, relativePath).not.toContain("KLINIKOS_GODADDY_PAYLINK");
    }
  });
});
