import { describe, expect, it } from "vitest";
import { COST_LINES, declaredCostLines } from "@/lib/commercial/cost-to-serve";
import {
  PUBLISHED_COST_RATE_EVIDENCE,
  publishedCostRateEvidenceFor,
} from "@/lib/commercial/cost-rate-evidence";
import {
  costLineEvidenceMatrix,
  costLinesMissingBothMonthlyCostAndPublishedRate,
  costLinesWithPublishedRateEvidence,
} from "@/lib/commercial/cost-to-serve-evidence";

describe("cost-to-serve published rate evidence", () => {
  it("only attaches published rates to real declared cost lines", () => {
    const keys = new Set(COST_LINES.map((line) => line.key));
    for (const evidence of PUBLISHED_COST_RATE_EVIDENCE) {
      expect(keys.has(evidence.costLineKey), evidence.costLineKey).toBe(true);
      expect(evidence.evidence).toBe("published_reference");
      expect(evidence.source).toMatch(/^https:\/\//);
      expect(evidence.asOf).toBe("2026-08-20");
      expect(evidence.caveats.length).toBeGreaterThan(0);
    }
  });

  it("does not turn a public unit rate into monthly clinic cost", () => {
    const monthly = new Map(declaredCostLines().map((line) => [line.key, line.cost]));
    for (const evidence of PUBLISHED_COST_RATE_EVIDENCE) {
      expect(monthly.get(evidence.costLineKey)).toMatchObject({ monthlyCents: null, evidence: "unknown" });
    }
  });

  it("normalizes Twilio base SMS price without hiding carrier-fee uncertainty", () => {
    const sms = publishedCostRateEvidenceFor("sms");
    expect(sms).toMatchObject({
      provider: "Twilio",
      rateShape: "per_unit",
      normalized: { microUsdPerUnit: 8_300 },
    });
    expect(sms?.caveats.join(" ")).toMatch(/carrier fees/i);
  });

  it("preserves Resend fixed-plan, included-volume, overage and billing-bucket structure", () => {
    expect(publishedCostRateEvidenceFor("email")).toMatchObject({
      provider: "Resend",
      rateShape: "fixed_plus_overage",
      normalized: {
        fixedMonthlyCents: 2_000,
        includedUnitsPerMonth: 50_000,
        overageMicroUsdPerUnit: 900,
        billingIncrementUnits: 1_000,
      },
    });
  });

  it("represents Stripe's public domestic-card rate as formula evidence, not a monthly guess", () => {
    expect(publishedCostRateEvidenceFor("payment_processing")).toMatchObject({
      provider: "Stripe",
      rateShape: "percent_plus_fixed",
      normalized: { basisPoints: 290, fixedCentsPerTransaction: 30 },
    });
  });

  it("preserves Stedi's volume tiers rather than selecting a fake tenant rate", () => {
    const tiers = publishedCostRateEvidenceFor("eligibility")?.normalized?.tiers;
    expect(tiers).toEqual([
      { minMonthlyUnits: 1, maxMonthlyUnits: 250, microUsdPerUnit: 300_000 },
      { minMonthlyUnits: 251, maxMonthlyUnits: 3_500, microUsdPerUnit: 150_000 },
      { minMonthlyUnits: 3_501, maxMonthlyUnits: 10_000, microUsdPerUnit: 100_000 },
      { minMonthlyUnits: 10_001, maxMonthlyUnits: null, microUsdPerUnit: 80_000 },
    ]);
  });

  it("makes evidence progress visible without changing margin completeness", () => {
    const withRate = costLinesWithPublishedRateEvidence();
    expect(withRate.map((line) => line.key).sort()).toEqual(["eligibility", "email", "payment_processing", "sms"]);
    expect(withRate.every((line) => line.monthlyCostKnown === false)).toBe(true);

    const matrix = costLineEvidenceMatrix();
    expect(matrix.length).toBe(COST_LINES.length);
    expect(costLinesMissingBothMonthlyCostAndPublishedRate().length).toBe(COST_LINES.length - 4);
  });
});
