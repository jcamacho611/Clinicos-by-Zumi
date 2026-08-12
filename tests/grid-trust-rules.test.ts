import { describe, expect, it } from "vitest";
import {
  canTransitionGridDispute,
  canTransitionGridSafetyIncident,
  gridDisputeCreateSchema,
  gridIssueBlocksSettlement,
  gridSafetyIncidentCreateSchema,
} from "@/lib/grid/trust-rules";

describe("Grid trust rules", () => {
  it("keeps marketplace disputes factual and separate from processor settlement", () => {
    const parsed = gridDisputeCreateSchema.parse({
      category: "payment_disagreement",
      summary: "The parties disagree about the cancellation charge after the reservation was released.",
      requestedOutcome: "Review the charge and recommend the correct commercial resolution.",
    });
    expect(parsed.category).toBe("payment_disagreement");
    expect(canTransitionGridDispute("under_review", "refund_recommended")).toBe(true);
    expect(canTransitionGridDispute("under_review", "closed")).toBe(true);
    expect(canTransitionGridDispute("closed", "open")).toBe(false);
  });

  it("keeps safety reporting distinct from executed restrictions", () => {
    const parsed = gridSafetyIncidentCreateSchema.parse({
      category: "credential_concern",
      severity: "high",
      summary: "The credential evidence presented during fulfillment did not match the reviewed profile.",
    });
    expect(parsed.severity).toBe("high");
    expect(canTransitionGridSafetyIncident("under_review", "restriction_recommended")).toBe(true);
    expect(canTransitionGridSafetyIncident("under_review", "resource_hold_recommended")).toBe(true);
    expect(canTransitionGridSafetyIncident("closed", "under_review")).toBe(false);
  });

  it("blocks normal settlement until an issue is actually closed", () => {
    expect(gridIssueBlocksSettlement("open")).toBe(true);
    expect(gridIssueBlocksSettlement("under_review")).toBe(true);
    expect(gridIssueBlocksSettlement("refund_recommended")).toBe(true);
    expect(gridIssueBlocksSettlement("closed")).toBe(false);
  });

  it("rejects issue reports that do not contain enough factual detail", () => {
    expect(() => gridDisputeCreateSchema.parse({ category: "other", summary: "Too short" })).toThrow();
    expect(() => gridSafetyIncidentCreateSchema.parse({ category: "other", severity: "medium", summary: "Too short" })).toThrow();
  });
});
