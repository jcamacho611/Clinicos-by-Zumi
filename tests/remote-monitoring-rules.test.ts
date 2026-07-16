import { describe, expect, it } from "vitest";
import { createRemoteObservationSchema, reviewRemoteObservationSchema } from "@/lib/remote-monitoring-rules";

describe("remote monitoring rules", () => {
  it("requires explicit consent and provider threshold instructions", () => {
    expect(() => createRemoteObservationSchema.parse({ patientId: "pt-1", type: "weight", value: "180", sourceType: "patient_entered", observedAt: "2026-07-16T12:00:00.000Z", thresholdConfig: { label: "Threshold", instruction: "Review manually." }, consentConfirmed: false })).toThrow();
    expect(createRemoteObservationSchema.parse({ patientId: "pt-1", type: "weight", value: "180", sourceType: "patient_entered", observedAt: "2026-07-16T12:00:00.000Z", thresholdConfig: { label: "Threshold", instruction: "Review manually." }, consentConfirmed: true }).type).toBe("weight");
  });

  it("keeps source type explicit for adapter and manual fallback", () => {
    expect(createRemoteObservationSchema.parse({ patientId: "pt-1", type: "pulse_oximetry", value: "98", sourceType: "device_adapter", deviceId: "device-demo", observedAt: "2026-07-16T12:00:00.000Z", thresholdConfig: { label: "Provider threshold", instruction: "Route to human review." }, consentConfirmed: true }).sourceType).toBe("device_adapter");
  });

  it("requires a human note for review, rejection, or escalation", () => {
    expect(() => reviewRemoteObservationSchema.parse({ action: "escalate", note: "short" })).toThrow();
    expect(reviewRemoteObservationSchema.parse({ action: "review", note: "Provider reviewed the source and recorded the next action." }).action).toBe("review");
  });
});
