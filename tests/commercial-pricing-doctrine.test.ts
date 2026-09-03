import { describe, expect, it } from "vitest";
import {
  commercialPricingDoctrine,
  monetizableValueClasses,
} from "@/lib/commercial/pricing-doctrine";
import {
  canStartDirectCommercialCheckout,
  canStartNewCommercialCheckout,
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

describe("FREE HEALTHCARE NETWORK + PAID OPERATING INFRASTRUCTURE", () => {
  it("makes free core/network participation the governing entry model", () => {
    expect(commercialPricingDoctrine).toMatchObject({
      governingModel: "FREE_HEALTHCARE_NETWORK_PAID_OPERATING_INFRASTRUCTURE",
      freeNetworkParticipation: {
        paymentRequired: false,
        subscriptionRequired: false,
        grantsProfessionalAuthority: false,
        grantsClinicalAuthority: false,
      },
      authorityForSale: false,
    });
  });

  it("monetizes valuable infrastructure and movement rather than admission", () => {
    expect(monetizableValueClasses).toEqual(
      expect.arrayContaining([
        "operating_infrastructure",
        "advanced_intelligence",
        "metered_variable_usage",
        "concierge_implementation",
        "verification_review_where_lawful",
        "grid_resource_economics_where_lawful",
        "edu_workforce_value",
        "premium_integrations",
        "enterprise_governance",
        "professional_services",
      ]),
    );
  });

  it("never sells authority and never applies a generic clinical/referral fee", () => {
    expect(commercialPricingDoctrine.authorityForSale).toBe(false);
    expect(commercialPricingDoctrine.feeDefaults).toEqual({
      clinicalCareGenericPlatformPercentage: 0,
      referralGenericPlatformPercentage: 0,
      requiresResourceClassPolicy: true,
      requiresLegalGateWhereApplicable: true,
    });
  });

  it("retires the old clinic-only ladder from new sales while keeping it resolvable as history", () => {
    for (const key of retiredClinicLadderKeys) {
      const product = getCommercialProduct(key);
      expect(product, `historical offer ${key} must remain traceable`).toBeDefined();
      expect(product?.lifecycle, `${key} must not remain active`).toBe("retired");
      expect(product?.publicPurchasable).toBe(false);
      expect(product?.directPublicCheckoutEligible).toBe(false);
      if (product) {
        expect(canStartNewCommercialCheckout(product)).toBe(false);
        expect(canStartDirectCommercialCheckout(product)).toBe(false);
      }
    }
  });

  it("keeps free participation separate from payment, fulfillment, and authority", () => {
    expect(commercialPricingDoctrine.truthSeparations).toEqual(
      expect.arrayContaining([
        "identity!=subscription",
        "participation!=payment",
        "listing!=transaction",
        "match!=fulfillment",
        "payment!=authority",
        "subscription!=professional_eligibility",
        "edu_completion!=license",
      ]),
    );
  });

  it("requires server-owned offer/version truth for anything that actually charges money", () => {
    expect(commercialPricingDoctrine.paidOfferRequirements).toEqual(
      expect.arrayContaining([
        "server_owned_offer",
        "pricing_version",
        "effective_state",
        "payment_evidence",
        "entitlement_transition",
        "cost_or_margin_policy",
      ]),
    );
  });
});
