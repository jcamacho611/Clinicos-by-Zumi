import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clinicCommercialOffers, clinicPlans, gridCommercialModel } from "@/lib/commercial/klinikos-commercial";
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

  it("keeps Grid launch economics explicit without treating them as universal legal rules", () => {
    expect(gridCommercialModel.professional.transactionLabel).toContain("10%");
    expect(gridCommercialModel.facility.transactionLabel).toContain("10%");
    expect(gridCommercialModel.seller.transactionLabel).toContain("10%");
    expect(gridCommercialModel.platform.pricing).toMatch(/where legally and economically appropriate/i);
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
