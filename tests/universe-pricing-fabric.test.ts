import { describe, expect, it } from "vitest";
import {
  activationCandidates,
  directCheckoutOffers,
  nonPurchasableUniverseClasses,
  stripeCatalogOffers,
  universePricingFabric,
} from "@/lib/commercial/universe-pricing";

describe("Klinikos universe pricing fabric", () => {
  it("keeps free identity and regulated authority outside purchasable commerce", () => {
    expect(nonPurchasableUniverseClasses).toEqual(
      expect.arrayContaining([
        "person_identity",
        "credential_truth",
        "clinical_authority",
        "patient_referral",
        "phi_permission",
      ]),
    );

    for (const key of nonPurchasableUniverseClasses) {
      expect(stripeCatalogOffers.find((offer) => offer.key === key)).toBeUndefined();
    }
  });

  it("creates a person-to-business monetization ladder without charging for basic participation", () => {
    expect(universePricingFabric.grid.individualFree.monthlyPriceCents).toBe(0);
    expect(universePricingFabric.grid.individualPro.monthlyPriceCents).toBe(4_900);
    expect(universePricingFabric.grid.individualProPlus.monthlyPriceCents).toBe(12_900);
    expect(universePricingFabric.professional.business.monthlyPriceCents).toBe(24_900);
    expect(universePricingFabric.professional.launchSetup.priceCents).toBe(49_900);
  });

  it("turns EDU ranges into clear candidate anchors while keeping variable catalogs flexible", () => {
    expect(universePricingFabric.edu.free.monthlyPriceCents).toBe(0);
    expect(universePricingFabric.edu.plus.monthlyPriceCents).toBe(2_900);
    expect(universePricingFabric.edu.pathway.priceCents).toBe(29_900);
    expect(universePricingFabric.edu.course.minPriceCents).toBe(4_900);
    expect(universePricingFabric.edu.course.maxPriceCents).toBe(19_900);
    expect(universePricingFabric.edu.institutionalSeat.priceCents).toBe(20_000);
  });

  it("keeps clinics on the approved recurring anchors and adds prepaid usage packs instead of open-ended spend", () => {
    expect(universePricingFabric.clinic.core.monthlyPriceCents).toBe(99_500);
    expect(universePricingFabric.clinic.growth.monthlyPriceCents).toBe(199_500);
    expect(universePricingFabric.clinic.scale.monthlyPriceCents).toBe(399_500);
    expect(universePricingFabric.usage.packs.map((pack) => pack.priceCents)).toEqual([
      25_000,
      50_000,
      100_000,
      250_000,
    ]);
  });

  it("does not let a Stripe price widen current direct-checkout authority", () => {
    expect(directCheckoutOffers.map((offer) => offer.key)).toEqual(["operational_audit"]);

    for (const key of [
      "implementation_blueprint",
      "clinic_core_monthly",
      "clinic_growth_monthly",
      "clinic_scale_monthly",
      "grid_pro",
      "grid_pro_plus",
      "professional_business",
      "edu_plus",
      "edu_pathway",
    ]) {
      expect(directCheckoutOffers.map((offer) => offer.key)).not.toContain(key);
    }
  });

  it("preserves the broader approved pricing strategy as activation candidates rather than fake live sellability", () => {
    const keys = activationCandidates.map((offer) => offer.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "grid_pro_plus",
        "professional_business",
        "professional_launch_setup",
        "grid_organization_scale",
        "edu_plus",
        "edu_pathway",
        "edu_institutional_seat",
        "usage_pack_250",
        "usage_pack_2500",
      ]),
    );
    expect(activationCandidates.every((offer) => offer.directPublicCheckoutEligible === false)).toBe(true);
  });

  it("gives every Stripe-backed offer a stable lookup key, classification, route state and billing model", () => {
    for (const offer of stripeCatalogOffers) {
      expect(offer.stripeLookupKey).toMatch(/^klinikos_[a-z0-9_]+_v1$/);
      expect(["ACTIVE_PUBLIC", "ACTIVE_PRIVATE", "TARGET"]).toContain(offer.classification);
      expect(["one_time", "month", "year"]).toContain(offer.billing);
      expect(typeof offer.directPublicCheckoutEligible).toBe("boolean");
      expect(offer.priceCents).toBeGreaterThan(0);
    }
  });
});
