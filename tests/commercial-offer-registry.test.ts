import { describe, expect, it } from "vitest";
import {
  canStartDirectCommercialCheckout,
  canStartNewCommercialCheckout,
  commercialProducts,
  getCommercialProduct,
} from "@/lib/commercial/product-catalog";

const retiredClinicLadderKeys = [
  "operational_audit",
  "implementation_blueprint",
  "founding_clinic_implementation",
  "clinic_core",
  "clinic_growth",
  "clinic_scale",
] as const;

describe("buyer-aware commercial offer registry", () => {
  it("keeps superseded clinic offers traceable without leaving them sellable", () => {
    for (const key of retiredClinicLadderKeys) {
      const offer = getCommercialProduct(key);
      expect(offer, `missing historical commercial offer ${key}`).toBeDefined();
      expect(offer?.lifecycle).toBe("retired");
      expect(offer?.publicPurchasable).toBe(false);
      expect(offer?.directPublicCheckoutEligible).toBe(false);
      expect(offer?.conversionDestination).toBeNull();
      if (offer) {
        expect(canStartNewCommercialCheckout(offer)).toBe(false);
        expect(canStartDirectCommercialCheckout(offer)).toBe(false);
      }
    }
  });

  it("preserves prior amounts as historical reconciliation evidence instead of deleting them", () => {
    expect(getCommercialProduct("operational_audit")?.priceCents).toBe(50_000);
    expect(getCommercialProduct("implementation_blueprint")?.priceCents).toBe(150_000);
    expect(getCommercialProduct("founding_clinic_implementation")?.priceCents).toBeNull();
    expect(getCommercialProduct("clinic_core")?.priceCents).toBe(99_500);
    expect(getCommercialProduct("clinic_growth")?.priceCents).toBe(199_500);
    expect(getCommercialProduct("clinic_scale")?.priceCents).toBe(399_500);
  });

  it("keeps enterprise custom and governed rather than consumer checkout", () => {
    const enterprise = getCommercialProduct("clinic_enterprise");
    expect(enterprise).toMatchObject({
      audience: "enterprise",
      revenueClass: "enterprise_contract",
      commercialRoute: "enterprise_government",
      priceType: "custom",
      priceCents: null,
      qualificationRequired: true,
      publicPurchasable: false,
      directPublicCheckoutEligible: false,
      lifecycle: "active",
    });
    expect(enterprise && canStartDirectCommercialCheckout(enterprise)).toBe(false);
  });

  it("keeps older processor aliases evidence-only", () => {
    for (const offer of commercialProducts.filter((candidate) => candidate.lifecycle === "legacy_evidence_only")) {
      expect(offer.publicPurchasable).toBe(false);
      expect(offer.directPublicCheckoutEligible).toBe(false);
      expect(offer.commercialRoute).toBe("historical_evidence_only");
      expect(offer.conversionDestination).toBeNull();
      expect(canStartNewCommercialCheckout(offer)).toBe(false);
    }
  });

  it("allows direct checkout only for a truly active explicitly self-serve fixed offer", () => {
    for (const offer of commercialProducts) {
      if (canStartDirectCommercialCheckout(offer)) {
        expect(offer.lifecycle).toBe("active");
        expect(offer.publicPurchasable).toBe(true);
        expect(offer.directPublicCheckoutEligible).toBe(true);
        expect(offer.commercialRoute).toBe("self_serve");
        expect(offer.priceType).toBe("fixed");
        expect(offer.qualificationRequired).toBe(false);
        expect(offer.priceCents).not.toBeNull();
      }
    }
  });
});
