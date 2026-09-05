import { describe, expect, it } from "vitest";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
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
      pricingStatus: "ACTIVE_PUBLIC",
      treatment: "public_self_serve",
      rail: "checkout",
      cadence: "one_time",
      currency: "usd",
      amountCents: 50_000,
      lookupKey: "klinikos_operational_audit_one_time_v1",
      publicLinkEligible: true,
      automaticCollection: true,
    });
  });

  it("keeps qualified and starting-at services on automatic qualified checkout or invoice rails, never generic public links", () => {
    expect(getStripeCommercialProjection("implementation_blueprint", "one_time")).toMatchObject({
      pricingStatus: "ACTIVE_PUBLIC",
      treatment: "private_quoted",
      rail: "quote_invoice",
      amountCents: 150_000,
      lookupKey: "klinikos_implementation_blueprint_one_time_v1",
      publicLinkEligible: false,
      automaticCollection: true,
    });
    expect(getStripeCommercialProjection("founding_clinic_implementation", "one_time")).toMatchObject({
      pricingStatus: "ACTIVE_PUBLIC",
      treatment: "private_quoted",
      rail: "quote_invoice",
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
        pricingStatus: "ACTIVE_PUBLIC",
        treatment: "public_subscribe",
        rail: "billing",
        cadence: "month",
        currency: "usd",
        amountCents: monthly,
        lookupKey: `klinikos_clinic_${slug}_monthly_v1`,
        publicLinkEligible: false,
        automaticCollection: true,
      });
      expect(getStripeCommercialProjection(offerKey, "year")).toMatchObject({
        offerKey,
        pricingStatus: "ACTIVE_PUBLIC",
        treatment: "public_subscribe",
        rail: "billing",
        cadence: "year",
        currency: "usd",
        amountCents: annual,
        lookupKey: `klinikos_clinic_${slug}_annual_v1`,
        publicLinkEligible: false,
        automaticCollection: true,
      });
    }
  });

  it("keeps enterprise and historical aliases on the correct non-public rails", () => {
    expect(getStripeCommercialProjection("clinic_enterprise", "one_time")).toMatchObject({
      pricingStatus: "ACTIVE_PRIVATE",
      treatment: "private_quoted",
      rail: "quote_invoice",
      amountCents: null,
      lookupKey: null,
      publicLinkEligible: false,
    });
    for (const key of ["clinic_operator", "grid_professional", "grid_facility"] as const) {
      expect(getStripeCommercialProjection(key, "one_time")).toMatchObject({
        pricingStatus: "RETIRED",
        treatment: "not_directly_purchasable",
        rail: "none",
        amountCents: null,
        lookupKey: null,
        publicLinkEligible: false,
        automaticCollection: false,
      });
    }
  });

  it("inherits pricing status from the canonical Offer Registry instead of inventing processor state", () => {
    for (const projection of stripeCommercialProjections) {
      expect(projection.pricingStatus).toBe(getCommercialProduct(projection.offerKey)?.pricingStatus);
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
