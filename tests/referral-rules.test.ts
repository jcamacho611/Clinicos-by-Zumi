import { describe, expect, it } from "vitest";
import { createReferralSchema, nextReferralStatus, transitionReferralSchema } from "@/lib/referral-rules";

describe("closed-loop referral rules", () => {
  it("requires a connected organization for network delivery", () => {
    const base = { patientId: "pt-1", specialty: "Cardiology", reason: "Persistent symptoms", clinicalQuestion: "Please evaluate symptoms", deliveryMethod: "connected_network" };
    expect(createReferralSchema.safeParse(base).success).toBe(false);
    expect(createReferralSchema.safeParse({ ...base, destinationOrganizationId: "org-2" }).success).toBe(true);
  });

  it("keeps source and destination actions separate", () => {
    const outbound = { status: "ready_to_send", deliveryStatus: "not_started", destinationType: "connected", direction: "outbound" as const };
    expect(nextReferralStatus(outbound, "send")).toBe("sent");
    expect(nextReferralStatus(outbound, "accept")).toBeNull();
    expect(nextReferralStatus({ ...outbound, status: "sent", direction: "inbound" }, "acknowledge")).toBe("received");
  });

  it("never reports a manual fallback as sent before confirmation", () => {
    const manual = { status: "ready_to_send", deliveryStatus: "not_started", destinationType: "external", direction: "outbound" as const };
    expect(nextReferralStatus(manual, "queue_manual_delivery")).toBe("ready_to_send");
    expect(nextReferralStatus({ ...manual, deliveryStatus: "pending_manual" }, "confirm_manual_delivery")).toBe("sent");
    expect(nextReferralStatus(manual, "confirm_manual_delivery")).toBeNull();
  });

  it("requires failure, decline, and manual confirmation notes", () => {
    expect(transitionReferralSchema.safeParse({ action: "fail_delivery" }).success).toBe(false);
    expect(transitionReferralSchema.safeParse({ action: "decline", note: "Not accepted by specialty office." }).success).toBe(true);
    expect(transitionReferralSchema.safeParse({ action: "record_patient_outreach" }).success).toBe(false);
    expect(transitionReferralSchema.safeParse({ action: "record_patient_outreach", note: "Patient reached and scheduling instructions reviewed." }).success).toBe(true);
  });

  it("requires an appointment for scheduling and evidence for consultation return", () => {
    expect(transitionReferralSchema.safeParse({ action: "schedule" }).success).toBe(false);
    expect(transitionReferralSchema.safeParse({ action: "schedule", appointmentAt: "2026-08-01T14:00:00.000Z" }).success).toBe(true);
    expect(transitionReferralSchema.safeParse({ action: "consultation_received" }).success).toBe(false);
    expect(transitionReferralSchema.safeParse({ action: "consultation_received", specialistResponse: "Specialist completed evaluation and returned recommendations." }).success).toBe(true);
  });
});
