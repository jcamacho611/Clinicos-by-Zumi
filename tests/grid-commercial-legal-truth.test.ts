import { describe, expect, it } from "vitest";
import {
  GRID_FEE_POLICY,
  computeGridPlatformFeeCents,
  gridPolicyHasCounselClearance,
  type GridFeePolicyDeclaration,
} from "@/lib/commercial/grid-economics";
import { getLegalDocument } from "@/lib/legal/document-registry";

function clearedFixture(evidence: GridFeePolicyDeclaration["legalReviewEvidence"]): GridFeePolicyDeclaration {
  return {
    resourceClass: "fixture",
    label: "Fixture",
    whatIsExchanged: "A test-only non-clinical transaction.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: null,
    maximumFeeCents: null,
    legalReview: "counsel_cleared",
    legalReviewEvidence: evidence,
    rationale: "Test fixture only.",
    version: 1,
  };
}

describe("Grid commercial legal truth", () => {
  it("does not treat a fee-bearing business proposal as an active charge", () => {
    const feeBearing = GRID_FEE_POLICY.filter((policy) => policy.feeModel !== "none");
    expect(feeBearing.length).toBeGreaterThan(0);
    expect(feeBearing.every((policy) => !gridPolicyHasCounselClearance(policy))).toBe(true);
    expect(computeGridPlatformFeeCents("space", 100_000)).toBeNull();
    expect(computeGridPlatformFeeCents("provider", 100_000)).toBeNull();
  });

  it("keeps an explicit no-fee policy at zero without inventing monetization", () => {
    expect(computeGridPlatformFeeCents("regulated_clinical_service", 100_000)).toBe(0);
    expect(computeGridPlatformFeeCents("referral", 100_000)).toBe(0);
  });

  it("requires durable review evidence before counsel-cleared can become chargeable", () => {
    expect(gridPolicyHasCounselClearance(clearedFixture(null))).toBe(false);
    expect(gridPolicyHasCounselClearance(clearedFixture({
      reviewedBy: "Healthcare counsel",
      reviewedAt: "2026-08-20",
      evidenceRef: "legal-review-record-1",
      jurisdictionScope: ["New York"],
    }))).toBe(true);
  });

  it("does not let unapproved Grid marketplace terms coexist with an evidence-free active fee declaration", () => {
    const gridTerms = getLegalDocument("grid_marketplace_terms");
    expect(gridTerms).toMatchObject({ counselReviewRequired: true, productionApproved: false });

    if (!gridTerms?.productionApproved) {
      const activeFeeWithoutEvidence = GRID_FEE_POLICY.filter(
        (policy) => policy.feeModel !== "none" && policy.legalReview === "counsel_cleared" && !policy.legalReviewEvidence,
      );
      expect(activeFeeWithoutEvidence).toEqual([]);
    }
  });
});
