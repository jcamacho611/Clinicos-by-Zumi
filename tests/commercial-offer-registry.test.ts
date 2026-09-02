import { describe, expect, it } from "vitest";
import {
  commercialProducts,
  getCommercialProduct,
} from "@/lib/commercial/product-catalog";

describe("buyer-aware commercial offer registry", () => {
  it("keeps one server-owned record for every first clinic revenue step", () => {
    for (const key of [
      "operational_audit",
      "implementation_blueprint",
      "founding_clinic_implementation",
      "clinic_core",
      "clinic_growth",
      "clinic_scale",
      "clinic_enterprise",
    ]) {
      expect(getCommercialProduct(key), `missing commercial offer ${key}`).toBeDefined();
    }
  });

  it("routes the $500 Clinic Operating Analysis through the low-friction paid-entry path", () => {
    const offer = getCommercialProduct("operational_audit");
    expect(offer).toMatchObject({
      audience: "clinic",
      revenueClass: "service",
      commercialRoute: "self_serve",
      priceType: "fixed",
      priceCents: 50_000,
      qualificationRequired: false,
      conversionDestination: "/sales",
    });
  });

  it("requires qualification before the $1,500 Implementation Blueprint path", () => {
    const offer = getCommercialProduct("implementation_blueprint");
    expect(offer).toMatchObject({
      audience: "clinic",
      revenueClass: "service",
      commercialRoute: "qualified_service",
      priceType: "fixed",
      priceCents: 150_000,
      qualificationRequired: true,
      conversionDestination: "/founding-clinic",
    });
  });

  it("never represents the from-$8k implementation as a fixed self-service purchase", () => {
    const offer = getCommercialProduct("founding_clinic_implementation");
    expect(offer).toMatchObject({
      audience: "clinic",
      revenueClass: "implementation",
      commercialRoute: "sales_led",
      priceType: "starting_at",
      qualificationRequired: true,
      conversionDestination: "/founding-clinic",
    });
    expect(offer?.priceCents).toBeNull();
  });

  it("routes clinic subscriptions through a reviewed recurring path", () => {
    for (const key of ["clinic_core", "clinic_growth", "clinic_scale"]) {
      const offer = getCommercialProduct(key);
      expect(offer).toMatchObject({
        audience: "clinic",
        revenueClass: "subscription",
        commercialRoute: "recurring_reviewed",
        priceType: "fixed",
        qualificationRequired: true,
        conversionDestination: "/founding-clinic",
      });
      expect(offer?.priceCents).toBeGreaterThan(0);
    }
  });

  it("keeps enterprise on a custom sales-led path rather than consumer checkout", () => {
    expect(getCommercialProduct("clinic_enterprise")).toMatchObject({
      audience: "enterprise",
      revenueClass: "enterprise_contract",
      commercialRoute: "enterprise_government",
      priceType: "custom",
      priceCents: null,
      qualificationRequired: true,
      conversionDestination: "/founding-clinic",
      publicPurchasable: false,
    });
  });

  it("keeps legacy payment aliases as evidence-only offers", () => {
    for (const offer of commercialProducts.filter((candidate) => candidate.lifecycle === "legacy_evidence_only")) {
      expect(offer.publicPurchasable).toBe(false);
      expect(offer.commercialRoute).toBe("historical_evidence_only");
      expect(offer.conversionDestination).toBeNull();
    }
  });
});
