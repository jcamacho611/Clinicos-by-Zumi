import { describe, expect, it } from "vitest";
import { evaluateGridResourcePolicy, gridResourceCreateSchema } from "@/lib/grid/resource-rules";

const futureStart = new Date(Date.now() + 86_400_000).toISOString();
const futureEnd = new Date(Date.now() + 90_000_000).toISOString();

describe("Grid universal resource rules", () => {
  it("requires availability for healthcare space", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "space",
      policyClass: "healthcare_space",
      title: "Treatment room",
      description: "Private treatment room available to reviewed healthcare professionals.",
    }).success).toBe(false);
  });

  it("accepts a healthcare space with a real availability window", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "space",
      policyClass: "healthcare_space",
      title: "Treatment room",
      description: "Private treatment room available to reviewed healthcare professionals.",
      availability: [{ startsAt: futureStart, endsAt: futureEnd, capacity: 1 }],
    }).success).toBe(true);
  });

  it("rejects unrestricted public referral capacity", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "referral",
      policyClass: "referral_capacity",
      title: "Specialty referral capacity",
      description: "Reviewed specialty capacity for purpose-bound referral matching.",
      visibility: "public",
      availability: [{ startsAt: futureStart, endsAt: futureEnd, capacity: 4 }],
    }).success).toBe(false);
  });

  it("allows a general supply product draft without implying regulated-product eligibility", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "product",
      policyClass: "general_supply",
      title: "Non-prescription clinic consumables",
      description: "Permitted general clinic consumables available through a reviewed seller.",
      pricingModel: "per_unit",
      priceCents: 2_500,
    }).success).toBe(true);
  });

  it("never treats a regulated product as generically transaction eligible", () => {
    const result = evaluateGridResourcePolicy({
      policyClass: "regulated_product",
      status: "active",
      reviewStatus: "approved",
      availabilityCount: 1,
    });
    expect(result.eligibleForTransaction).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/dedicated transfer/i);
  });

  it("never treats a clinical service as a generic resource transaction", () => {
    const result = evaluateGridResourcePolicy({
      policyClass: "clinical_service",
      status: "active",
      reviewStatus: "approved",
      availabilityCount: 1,
    });
    expect(result.eligibleForTransaction).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/verified clinician/i);
  });

  it("allows an approved active business service without time capacity", () => {
    expect(evaluateGridResourcePolicy({
      policyClass: "business_service",
      status: "active",
      reviewStatus: "approved",
      availabilityCount: 0,
    }).eligibleForTransaction).toBe(true);
  });

  it("requires active availability for approved equipment capacity", () => {
    expect(evaluateGridResourcePolicy({
      policyClass: "equipment_capacity",
      status: "active",
      reviewStatus: "approved",
      availabilityCount: 0,
    }).eligibleForTransaction).toBe(false);
    expect(evaluateGridResourcePolicy({
      policyClass: "equipment_capacity",
      status: "active",
      reviewStatus: "approved",
      availabilityCount: 1,
    }).eligibleForTransaction).toBe(true);
  });

  it("requires latitude and longitude together", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "service",
      policyClass: "business_service",
      title: "Credentialing support",
      description: "Remote credentialing support for independent healthcare organizations.",
      latitude: 40.7,
    }).success).toBe(false);
  });

  it("requires a price for non-quote pricing models", () => {
    expect(gridResourceCreateSchema.safeParse({
      resourceType: "service",
      policyClass: "business_service",
      title: "Billing support",
      description: "Remote billing operations support for independent healthcare organizations.",
      pricingModel: "hourly",
    }).success).toBe(false);
  });
});
