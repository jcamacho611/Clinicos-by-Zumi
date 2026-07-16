import { describe, expect, it } from "vitest";
import { createLuxeConsultationSchema, createLuxeTreatmentPlanSchema, luxeTreatmentPlanTransitionSchema, luxeTreatmentSessionTransitionSchema } from "@/lib/luxe-medi-rules";

describe("Luxe Medi workflow rules", () => {
  it("accepts consultation requests without pretending to book them", () => {
    const request = createLuxeConsultationSchema.parse({ name: "Camille Brooks", serviceId: "service-1", notes: "Please have staff call me." });
    expect(request.name).toBe("Camille Brooks");
    expect(request.serviceId).toBe("service-1");
  });

  it("requires a real patient and service for treatment plans", () => {
    expect(createLuxeTreatmentPlanSchema.parse({ patientId: "patient-1", serviceId: "service-1", name: "Provider reviewed plan" }).recommendedSessions).toBe(1);
    expect(() => createLuxeTreatmentPlanSchema.parse({ serviceId: "service-1", name: "Missing patient" })).toThrow();
  });

  it("requires meaningful human review notes for transitions", () => {
    expect(luxeTreatmentPlanTransitionSchema.parse({ action: "approve_review", note: "Provider reviewed eligibility and consent." }).action).toBe("approve_review");
    expect(luxeTreatmentSessionTransitionSchema.parse({ action: "complete", note: "Completed after provider review." }).action).toBe("complete");
    expect(() => luxeTreatmentPlanTransitionSchema.parse({ action: "activate", note: "ok" })).toThrow();
    expect(() => luxeTreatmentSessionTransitionSchema.parse({ action: "complete", note: "done" })).toThrow();
  });
});
