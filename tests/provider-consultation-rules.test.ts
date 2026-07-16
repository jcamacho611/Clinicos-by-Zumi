import { describe, expect, it } from "vitest";
import { createProviderConsultationSchema, consultationRisk, transitionProviderConsultationSchema } from "@/lib/provider-consultation-rules";

describe("provider consultation rules", () => {
  it("requires a substantive clinical question", () => {
    expect(() => createProviderConsultationSchema.parse({ patientId: "pt-1001", specialty: "Cardiology", clinicalQuestion: "short" })).toThrow();
    expect(createProviderConsultationSchema.parse({ patientId: "pt-1001", specialty: "Cardiology", clinicalQuestion: "Please review the documented question and return a provider note.", priority: "urgent" }).priority).toBe("urgent");
  });

  it("maps urgency to human review risk", () => {
    expect(consultationRisk("urgent")).toBe("URGENT");
    expect(consultationRisk("high")).toBe("NEEDS_PROVIDER");
    expect(consultationRisk("routine")).toBe("NORMAL");
  });

  it("requires a scheduled time and human note for transitions", () => {
    expect(() => transitionProviderConsultationSchema.parse({ action: "schedule", note: "Provider reviewed and accepted." })).toThrow();
    expect(transitionProviderConsultationSchema.parse({ action: "accept", note: "Provider reviewed and accepted the consultation." }).action).toBe("accept");
  });
});
