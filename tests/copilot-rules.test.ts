import { describe, expect, it } from "vitest";
import { buildCopilotDecision, createCopilotRunSchema, reviewCopilotRunSchema } from "../src/lib/copilot-rules";

describe("Zumi Copilot safety and routing rules", () => {
  it("stops routine processing for emergency language", () => {
    const result = buildCopilotDecision("I have chest pain and cannot breathe");
    expect(result.status).toBe("urgent_hold");
    expect(result.riskLevel).toBe("Urgent");
    expect(result.blockedActions).toContain("Routine automation");
    expect(result.draft).toContain("call 911");
  });

  it("blocks autonomous record release", () => {
    const result = buildCopilotDecision("Send the whole patient chart to the imaging center");
    expect(result.intentKey).toBe("record_release_review");
    expect(result.riskLevel).toBe("Do Not Automate");
    expect(result.blockedActions).toContain("Record release");
  });

  it("prepares a reviewable referral handoff without sending it", () => {
    const result = buildCopilotDecision("Prepare the MRI referral for our imaging partner");
    expect(result.intentKey).toBe("referral_coordination");
    expect(result.assignedTeam).toBe("Referral coordination");
    expect(result.nextAction).toContain("Network Command");
    expect(result.limitations.join(" ")).toContain("No message");
  });

  it("does not guarantee insurance coverage", () => {
    const result = buildCopilotDecision("Can you guarantee insurance covers the visit?");
    expect(result.intentKey).toBe("insurance_verification");
    expect(result.draft).toContain("cannot be guaranteed");
    expect(result.blockedActions).toContain("Coverage guarantee");
  });

  it("requires the synthetic-demo acknowledgment", () => {
    expect(createCopilotRunSchema.safeParse({ inputText: "Show overdue referrals", inputMode: "typed", demoAcknowledged: false }).success).toBe(false);
    expect(createCopilotRunSchema.safeParse({ inputText: "Show overdue referrals", inputMode: "typed", demoAcknowledged: true }).success).toBe(true);
  });

  it("requires a meaningful human review note", () => {
    expect(reviewCopilotRunSchema.safeParse({ decision: "approve", notes: "ok" }).success).toBe(false);
    expect(reviewCopilotRunSchema.safeParse({ decision: "approve", notes: "Reviewed as an administrative draft only." }).success).toBe(true);
  });
});
