import { describe, expect, it } from "vitest";
import {
  universePricingFabric,
  publicSelfServeOffers,
  stripeCatalogOffers,
  nonPurchasableUniverseClasses,
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

  it("turns EDU ranges into clear default self-serve anchors while keeping variable catalogs flexible", () => {
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

  it("uses public self-serve only for offers that can be bought without negotiation or regulated approval", () => {
    const keys = publicSelfServeOffers.map((offer) => offer.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "operational_audit",
        "implementation_blueprint",
        "grid_pro",
        "grid_pro_plus",
        "edu_plus",
        "edu_pathway",
      ]),
    );
    expect(keys).not.toContain("professional_business");
    expect(keys).not.toContain("edu_institutional_seat");
    expect(keys).not.toContain("clinic_enterprise");
  });

  it("gives every Stripe-backed offer a stable lookup key, classification and billing model", () => {
    for (const offer of stripeCatalogOffers) {
      expect(offer.stripeLookupKey).toMatch(/^klinikos_[a-z0-9_]+_v1$/);
      expect(["ACTIVE_PUBLIC", "ACTIVE_PRIVATE", "TARGET"]).toContain(offer.classification);
      expect(["one_time", "month", "year"]).toContain(offer.billing);
      expect(offer.priceCents).toBeGreaterThan(0);
    }
  });
});
