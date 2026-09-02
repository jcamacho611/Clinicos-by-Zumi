import { describe, expect, it } from "vitest";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import {
  STRIPE_PRICING_VERSION,
  getStripeCommercialProjection,
  stripeCommercialProjections,
} from "@/lib/commercial/stripe-commercial-projection";

describe("Stripe commercial projection", () => {
  it("projects the fixed analysis offer as automatic public self-serve without environment-specific Stripe IDs", () => {
    expect(getStripeCommercialProjection("operational_audit", "one_time")).toMatchObject({
      offerKey: "operational_audit",
      pricingVersion: STRIPE_PRICING_VERSION,
      treatment: "public_self_serve",
      cadence: "one_time",
      currency: "usd",
      amountCents: 50_000,
      lookupKey: "klinikos_operational_audit_one_time_v1",
      publicLinkEligible: true,
      automaticCollection: true,
    });
  });

  it("keeps qualified and starting-at services off direct public checkout", () => {
    expect(getStripeCommercialProjection("implementation_blueprint", "one_time")).toMatchObject({
      treatment: "private_quoted",
      amountCents: 150_000,
      lookupKey: "klinikos_implementation_blueprint_one_time_v1",
      publicLinkEligible: false,
      automaticCollection: true,
    });
    expect(getStripeCommercialProjection("founding_clinic_implementation", "one_time")).toMatchObject({
      treatment: "private_quoted",
      amountCents: null,
      lookupKey: "klinikos_founding_implementation_starting_v1",
      publicLinkEligible: false,
      automaticCollection: true,
    });
  });

  it("projects monthly and annual clinic subscription variants from server-owned prices", () => {
    const expected = [
      ["clinic_core", clinicPlans.core.monthlyPriceCents, clinicPlans.core.annualPriceCents, "core"],
      ["clinic_growth", clinicPlans.growth.monthlyPriceCents, clinicPlans.growth.annualPriceCents, "growth"],
      ["clinic_scale", clinicPlans.scale.monthlyPriceCents, clinicPlans.scale.annualPriceCents, "scale"],
    ] as const;

    for (const [offerKey, monthly, annual, slug] of expected) {
      expect(getStripeCommercialProjection(offerKey, "month")).toMatchObject({
        offerKey,
        treatment: "public_subscribe",
        cadence: "month",
        currency: "usd",
        amountCents: monthly,
        lookupKey: `klinikos_clinic_${slug}_monthly_v1`,
        publicLinkEligible: false,
        automaticCollection: true,
      });
      expect(getStripeCommercialProjection(offerKey, "year")).toMatchObject({
        offerKey,
        treatment: "public_subscribe",
        cadence: "year",
        currency: "usd",
        amountCents: annual,
        lookupKey: `klinikos_clinic_${slug}_annual_v1`,
        publicLinkEligible: false,
        automaticCollection: true,
      });
    }
  });

  it("keeps enterprise and historical aliases out of direct Stripe purchase treatments", () => {
    expect(getStripeCommercialProjection("clinic_enterprise", "one_time")).toMatchObject({
      treatment: "private_quoted",
      amountCents: null,
      lookupKey: null,
      publicLinkEligible: false,
    });
    for (const key of ["clinic_operator", "grid_professional", "grid_facility"] as const) {
      expect(getStripeCommercialProjection(key, "one_time")).toMatchObject({
        treatment: "not_directly_purchasable",
        amountCents: null,
        lookupKey: null,
        publicLinkEligible: false,
        automaticCollection: false,
      });
    }
  });

  it("contains only bounded non-PHI commercial metadata and no environment-specific Stripe object IDs", () => {
    const serialized = JSON.stringify(stripeCommercialProjections);
    expect(serialized).not.toMatch(/\b(?:price|prod|plink|cs|sub|pi)_[A-Za-z0-9]+/);
    expect(serialized.toLowerCase()).not.toContain("patient");
    expect(serialized.toLowerCase()).not.toContain("diagnosis");
    expect(serialized.toLowerCase()).not.toContain("secret");
    expect(serialized.toLowerCase()).not.toContain("credential verified");

    for (const projection of stripeCommercialProjections) {
      expect(projection.pricingVersion).toBe("2026-09-01.v1");
      expect(projection.currency).toBe("usd");
      expect(projection.entitlementBoundary.length).toBeGreaterThan(20);
      expect(projection.lookupKey === null || projection.lookupKey.startsWith("klinikos_")).toBe(true);
    }
  });
});
