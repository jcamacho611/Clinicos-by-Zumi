import { describe, expect, it } from "vitest";
import { classifyWorkflow, EMERGENCY_MESSAGE } from "../src/lib/workflow-rules";

describe("clinical workflow safety rules", () => {
  it("forces urgent human escalation for emergency symptoms", () => {
    const decision = classifyWorkflow("I have chest pain and cannot breathe");
    expect(decision.category).toBe("Emergency Symptom");
    expect(decision.riskLevel).toBe("Urgent");
    expect(decision.requiresHumanReview).toBe(true);
    expect(decision.blockedFromAutoSend).toBe(true);
    expect(decision.emergencyMessage).toBe(EMERGENCY_MESSAGE);
  });

  it("routes lab interpretation questions to provider review", () => {
    const decision = classifyWorkflow("What does my abnormal lab result mean?");
    expect(decision.category).toBe("BFM Lab Question");
    expect(decision.assignedTeam).toBe("Provider");
    expect(decision.blockedFromAutoSend).toBe(true);
  });

  it("routes medication requests to provider review", () => {
    const decision = classifyWorkflow("Please refill my prescription at my pharmacy");
    expect(decision.category).toBe("BFM Medication / Refill Question");
    expect(decision.riskLevel).toBe("Needs Provider");
  });

  it("does not promise insurance coverage", () => {
    const decision = classifyWorkflow("Can you guarantee this visit is covered by insurance?");
    expect(decision.assignedTeam).toBe("Billing");
    expect(decision.requiresHumanReview).toBe(true);
    expect(decision.blockedFromAutoSend).toBe(true);
  });

  it("keeps ordinary appointment requests in the front desk queue", () => {
    const decision = classifyWorkflow("I would like to book an appointment next week");
    expect(decision.category).toBe("Appointment Request");
    expect(decision.assignedTeam).toBe("Front Desk");
    expect(decision.blockedFromAutoSend).toBe(false);
  });
});
