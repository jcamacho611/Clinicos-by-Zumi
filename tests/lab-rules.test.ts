import { describe, expect, it } from "vitest";
import {
  createLabOrderSchema,
  createLabResultSchema,
  labResultActionRequiresProviderIdentity,
  nextLabOrderStatus,
  nextLabResultStatus,
  summarizeLabFlags,
  transitionLabOrderSchema,
  transitionLabResultSchema,
} from "@/lib/lab-rules";

describe("laboratory lifecycle rules", () => {
  const order = { status: "ready_to_send", deliveryStatus: "not_started", deliveryMethod: "fax" };

  it("requires chart diagnoses, tests, provider, and an adapter for electronic orders", () => {
    const base = { patientId: "pt-1", providerId: "provider-1", vendor: "Demo Lab", tests: [{ name: "CBC" }], diagnosisCodes: ["I10"] };
    expect(createLabOrderSchema.safeParse(base).success).toBe(true);
    expect(createLabOrderSchema.safeParse({ ...base, diagnosisCodes: [] }).success).toBe(false);
    expect(createLabOrderSchema.safeParse({ ...base, deliveryMethod: "electronic_adapter" }).success).toBe(false);
    expect(createLabOrderSchema.safeParse({ ...base, deliveryMethod: "electronic_adapter", integrationId: "integration-1" }).success).toBe(true);
  });

  it("never calls manual delivery sent before human confirmation", () => {
    expect(nextLabOrderStatus(order, "queue_delivery")).toBe("ready_to_send");
    expect(nextLabOrderStatus(order, "confirm_delivery")).toBeNull();
    expect(nextLabOrderStatus({ ...order, deliveryStatus: "pending_manual" }, "confirm_delivery")).toBe("sent");
  });

  it("keeps adapter queue and acknowledgment states distinct", () => {
    const adapter = { ...order, deliveryMethod: "electronic_adapter" };
    expect(nextLabOrderStatus(adapter, "queue_delivery")).toBe("transmission_queued");
    expect(nextLabOrderStatus({ ...adapter, status: "transmission_queued", deliveryStatus: "queued" }, "confirm_delivery")).toBe("sent");
  });

  it("requires collection time and human confirmation notes", () => {
    expect(transitionLabOrderSchema.safeParse({ action: "record_collection" }).success).toBe(false);
    expect(transitionLabOrderSchema.safeParse({ action: "record_collection", collectedAt: "2026-07-14T12:00:00.000Z" }).success).toBe(true);
    expect(transitionLabOrderSchema.safeParse({ action: "confirm_delivery" }).success).toBe(false);
    expect(transitionLabOrderSchema.safeParse({ action: "confirm_delivery", note: "Receipt confirmed with laboratory staff." }).success).toBe(true);
  });

  it("binds uploads and electronic results to traceable sources", () => {
    const base = { patientId: "pt-1", panelName: "CBC", resultedAt: "2026-07-14T12:00:00.000Z", items: [{ name: "WBC", value: "7.2" }] };
    expect(createLabResultSchema.safeParse(base).success).toBe(true);
    expect(createLabResultSchema.safeParse({ ...base, sourceType: "manual_upload" }).success).toBe(false);
    expect(createLabResultSchema.safeParse({ ...base, sourceType: "manual_upload", sourceDocumentId: "doc-1" }).success).toBe(true);
    expect(createLabResultSchema.safeParse({ ...base, sourceType: "electronic_interface" }).success).toBe(false);
    expect(createLabResultSchema.safeParse({ ...base, sourceType: "electronic_interface", integrationId: "integration-1" }).success).toBe(true);
  });

  it("treats critical flags as routing data, not interpretation", () => {
    expect(createLabResultSchema.safeParse({ patientId: "pt-1", panelName: "CMP", resultedAt: "2026-07-14T12:00:00.000Z", items: [{ name: "Potassium", value: "6.8", critical: true, abnormalFlag: "high" }] }).success).toBe(false);
    const items = [{ name: "Potassium", value: "6.8", critical: true, abnormalFlag: "critical" as const, resultStatus: "final" as const }];
    expect(summarizeLabFlags(items)).toEqual({ abnormal: true, critical: true });
  });

  it("requires provider review before release and records follow-up intent", () => {
    expect(nextLabResultStatus("needs_review", "release")).toBeNull();
    expect(nextLabResultStatus("needs_review", "review")).toBe("reviewed");
    expect(nextLabResultStatus("reviewed", "release")).toBe("released");
    expect(transitionLabResultSchema.safeParse({ action: "review" }).success).toBe(false);
    expect(transitionLabResultSchema.safeParse({ action: "review", note: "Source values reviewed and plan documented." }).success).toBe(true);
    expect(transitionLabResultSchema.safeParse({ action: "create_follow_up", note: "Contact patient for provider-directed follow-up." }).success).toBe(false);
    expect(labResultActionRequiresProviderIdentity("review")).toBe(true);
    expect(labResultActionRequiresProviderIdentity("release")).toBe(true);
    expect(labResultActionRequiresProviderIdentity("repeat_order")).toBe(true);
    expect(labResultActionRequiresProviderIdentity("notify_patient")).toBe(false);
    expect(labResultActionRequiresProviderIdentity("create_follow_up")).toBe(false);
  });
});
