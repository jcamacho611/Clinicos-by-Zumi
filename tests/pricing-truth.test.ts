import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clinicCommercialOffers, clinicPlans, gridCommercialRule, gridPlans } from "@/lib/commercial/klinikos-commercial";
import { gridPublicPricingPolicy } from "@/lib/commercial/grid-public-pricing";
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

  it("keeps public Grid subscriptions anchored to the canonical Grid plans", () => {
    expect(gridPublicPricingPolicy.professional.freeLabel).toBe(gridPlans.individual.priceLabel);
    expect(gridPublicPricingPolicy.professional.proLabel).toContain(gridPlans.pro.priceLabel);
    expect(gridPublicPricingPolicy.facility.proLabel).toContain(gridPlans.organization.priceLabel);
  });

  it("does not invent a universal Grid transaction percentage", () => {
    expect(gridPublicPricingPolicy.universalTransactionPercent).toBeNull();
    expect(gridPublicPricingPolicy.professional.transactionLabel).toMatch(/resource-class/i);
    expect(gridPublicPricingPolicy.platform.pricing).toMatch(/does not publish one universal/i);
    expect(gridPublicPricingPolicy.platform.pricing).toMatch(/server-owned/i);
    expect(gridCommercialRule).toMatch(/server-owned resource-class policy/i);
    expect(gridCommercialRule).toMatch(/no universal percentage/i);
  });

  it("has one canonical Grid subscription source instead of a stale second pricing model", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/commercial/klinikos-commercial.ts"), "utf8");
    expect(source).not.toContain("gridCommercialModel");
    expect(source).not.toMatch(/10% standard completed/i);
    expect(source).not.toContain("$39/mo Pro");
    expect(source).not.toContain("$99/mo Facility Pro");
  });

  it("keeps universal transaction percentages off the public Grid pricing surface", () => {
    const source = readFileSync(join(process.cwd(), "src/app/grid/pricing/page.tsx"), "utf8");
    expect(source).not.toMatch(/10%/i);
    expect(source).toContain("approved resource-class transaction fee");
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
