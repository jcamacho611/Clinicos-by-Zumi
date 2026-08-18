import { describe, expect, it } from "vitest";
import { recordInsuranceVerificationSchema } from "@/lib/insurance-rules";

describe("manual insurance verification evidence rules", () => {
  it("accepts bounded manual evidence with a real source", () => {
    expect(recordInsuranceVerificationSchema.safeParse({
      insuranceId: "coverage-1",
      eligibilityStatus: "active",
      copayCents: 2500,
      deductibleCents: 38000,
      coinsurancePercent: 20,
      effectiveDate: "2026-01-01",
      terminationDate: "2026-12-31",
      source: "Payer portal checked by staff",
      notes: "Reference stored in clinic workflow.",
    }).success).toBe(true);
  });

  it("requires a source and a controlled eligibility state", () => {
    expect(recordInsuranceVerificationSchema.safeParse({ insuranceId: "coverage-1", eligibilityStatus: "active", source: "" }).success).toBe(false);
    expect(recordInsuranceVerificationSchema.safeParse({ insuranceId: "coverage-1", eligibilityStatus: "guaranteed", source: "payer portal" }).success).toBe(false);
  });

  it("rejects invalid benefit values and reversed coverage dates", () => {
    expect(recordInsuranceVerificationSchema.safeParse({ insuranceId: "coverage-1", eligibilityStatus: "active", source: "payer portal", coinsurancePercent: 101 }).success).toBe(false);
    expect(recordInsuranceVerificationSchema.safeParse({ insuranceId: "coverage-1", eligibilityStatus: "active", source: "payer portal", copayCents: -1 }).success).toBe(false);
    expect(recordInsuranceVerificationSchema.safeParse({ insuranceId: "coverage-1", eligibilityStatus: "active", source: "payer portal", effectiveDate: "2026-12-31", terminationDate: "2026-01-01" }).success).toBe(false);
  });
});
