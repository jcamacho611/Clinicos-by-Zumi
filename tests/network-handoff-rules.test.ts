import { describe, expect, it } from "vitest";
import {
  createNetworkHandoffSchema,
  nextNetworkHandoffStatus,
  transitionNetworkHandoffSchema,
} from "@/lib/network-handoff-rules";

describe("governed network handoff rules", () => {
  it("requires minimum-necessary categories and an explicit human confirmation", () => {
    const valid = createNetworkHandoffSchema.safeParse({
      patientId: "pt-synthetic",
      destinationOrganizationId: "org-partner",
      category: "imaging_request",
      purposeOfUse: "treatment",
      dataCategories: ["demographics", "referrals", "imaging"],
      requestedAction: "Review the synthetic request and return a scheduling response.",
      priority: "high",
      deliveryMethod: "connected_network",
      minimumNecessarySummary: "Synthetic routing summary with no full chart payload.",
      humanConfirmed: true,
    });
    expect(valid.success).toBe(true);
    expect(createNetworkHandoffSchema.safeParse({ ...valid.data, humanConfirmed: false }).success).toBe(false);
    expect(createNetworkHandoffSchema.safeParse({ ...valid.data, dataCategories: [] }).success).toBe(false);
  });

  it("separates sender and receiver actions", () => {
    expect(nextNetworkHandoffStatus({ direction: "outbound", status: "ready_to_send", deliveryMethod: "connected_network" }, "send_connected")).toBe("sent_connected");
    expect(nextNetworkHandoffStatus({ direction: "inbound", status: "ready_to_send", deliveryMethod: "connected_network" }, "send_connected")).toBeNull();
    expect(nextNetworkHandoffStatus({ direction: "inbound", status: "sent_connected", deliveryMethod: "connected_network" }, "mark_received")).toBe("received");
    expect(nextNetworkHandoffStatus({ direction: "outbound", status: "sent_connected", deliveryMethod: "connected_network" }, "mark_received")).toBeNull();
  });

  it("keeps manual delivery pending until receipt and supports explicit recovery", () => {
    expect(nextNetworkHandoffStatus({ direction: "outbound", status: "ready_to_send", deliveryMethod: "fax" }, "queue_fax")).toBe("fax_pending");
    expect(nextNetworkHandoffStatus({ direction: "inbound", status: "fax_pending", deliveryMethod: "fax" }, "mark_received")).toBe("received");
    expect(nextNetworkHandoffStatus({ direction: "outbound", status: "failed", deliveryMethod: "fax" }, "retry")).toBe("ready_to_send");
  });

  it("requires an accountable note and a date for scheduling", () => {
    expect(transitionNetworkHandoffSchema.safeParse({ action: "acknowledge", note: "Reviewed by the receiving clinic." }).success).toBe(true);
    expect(transitionNetworkHandoffSchema.safeParse({ action: "acknowledge", note: "short" }).success).toBe(false);
    expect(transitionNetworkHandoffSchema.safeParse({ action: "schedule", note: "Scheduling confirmed by a human reviewer." }).success).toBe(false);
    expect(transitionNetworkHandoffSchema.safeParse({ action: "schedule", note: "Scheduling confirmed by a human reviewer.", scheduledAt: "2026-08-20T15:00:00.000Z" }).success).toBe(true);
  });
});
