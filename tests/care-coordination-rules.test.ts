import { describe, expect, it } from "vitest";
import { createHandoffSchema, transitionEscalationSchema, transitionHandoffSchema, transitionTaskSchema } from "@/lib/care-coordination-rules";

describe("care coordination rules", () => {
  it("requires a patient, receiving clinician, requested action, and due-safe priority", () => {
    expect(() => createHandoffSchema.parse({ patientId: "pt-1001", receiverId: "provider-lee", type: "lab_review", summary: {}, requestedAction: "short", priority: "normal" })).toThrow();
    const handoff = createHandoffSchema.parse({ patientId: "pt-1001", receiverId: "provider-lee", type: "lab_review", summary: { situation: "Repeat review" }, requestedAction: "Review the source result and document the next step.", priority: "needs_provider" });
    expect(handoff.priority).toBe("needs_provider");
  });

  it("requires an accountable human note for handoff transitions", () => {
    expect(() => transitionHandoffSchema.parse({ action: "acknowledge", note: "short" })).toThrow();
    expect(transitionHandoffSchema.parse({ action: "resolve", note: "Provider reviewed and documented the follow-up." }).action).toBe("resolve");
  });

  it("keeps task and escalation transitions explicit", () => {
    expect(transitionTaskSchema.parse({ action: "complete", note: "Completed after human review." }).action).toBe("complete");
    expect(transitionEscalationSchema.parse({ action: "acknowledge", note: "Assigned to the provider queue for review." }).action).toBe("acknowledge");
    expect(() => transitionEscalationSchema.parse({ action: "resolve", note: "done" })).toThrow();
  });
});
