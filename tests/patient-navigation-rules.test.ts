import { describe, expect, it } from "vitest";
import { classifyWorkflow } from "@/lib/workflow-rules";
import { createNavigationDraftSchema, navigationDraftContent, reviewNavigationDraftSchema } from "@/lib/patient-navigation-rules";

describe("patient navigation rules", () => {
  it("keeps administrative guidance separate from clinical answers", () => {
    const decision = classifyWorkflow("Can someone explain my lab result?");
    expect(decision.requiresHumanReview).toBe(true);
    expect(navigationDraftContent("Maya Thompson", decision)).toContain("provider review queue");
    expect(navigationDraftContent("Maya Thompson", decision)).not.toContain("your result means");
  });

  it("requires a patient request and an accountable review note", () => {
    expect(() => createNavigationDraftSchema.parse({ patientId: "pt-1001", request: "" })).toThrow();
    expect(() => reviewNavigationDraftSchema.parse({ decision: "approve", notes: "short" })).toThrow();
    expect(reviewNavigationDraftSchema.parse({ decision: "approve", notes: "Reviewed as an administrative handoff." }).decision).toBe("approve");
  });

  it("preserves the emergency boundary", () => {
    const decision = classifyWorkflow("I have chest pain and cannot breathe");
    expect(decision.riskLevel).toBe("Urgent");
    expect(navigationDraftContent("Maya Thompson", decision)).toContain("call 911");
  });
});
