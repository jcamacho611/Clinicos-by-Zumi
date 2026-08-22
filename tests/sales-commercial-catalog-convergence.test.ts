import { describe, expect, it } from "vitest";
import { clinicCommercialOffers } from "@/lib/commercial/klinikos-commercial";
import { demoOffers } from "@/lib/sales-demo-rules";

describe("sales commercial catalog convergence", () => {
  const mappings = [
    ["private_workflow_demo", clinicCommercialOffers.privateWorkflowReview, "Demo"],
    ["founding_clinic_evaluation", clinicCommercialOffers.foundingEvaluation, "Human review required"],
    ["founding_clinic_program", clinicCommercialOffers.foundingImplementation, "Requires production review"],
  ] as const;

  it.each(mappings)("derives %s customer-facing economics from canonical commercial truth", (salesKey, canonical, expectedStatus) => {
    const sales = demoOffers[salesKey];
    expect(canonical.key).toBe(salesKey);
    expect(sales.name).toBe(canonical.name);
    expect(sales.priceCents).toBe(canonical.priceCents);
    expect(sales.shortPrice).toBe(canonical.priceLabel);
    expect(sales.creditForward).toBe(canonical.creditForward);
    expect(sales.status).toBe(expectedStatus);
  });

  it("keeps sales-only workflow status out of the generic commercial offer records", () => {
    for (const offer of Object.values(clinicCommercialOffers)) {
      expect("status" in offer).toBe(false);
    }
  });
});
