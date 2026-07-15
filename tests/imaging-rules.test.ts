import { describe, expect, it } from "vitest";
import {
  correctImagingResultSchema,
  createImagingOrderSchema,
  createImagingResultSchema,
  imagingResultActionRequiresProviderIdentity,
  nextImagingOrderStatus,
  nextImagingResultStatus,
  transitionImagingOrderSchema,
  transitionImagingResultSchema,
} from "@/lib/imaging-rules";

describe("imaging and radiology lifecycle rules", () => {
  const orderInput = {
    patientId: "pt-1",
    providerId: "provider-1",
    study: "MRI lumbar spine without contrast",
    modality: "mri",
    bodyPart: "Lumbar spine",
    diagnosisCodes: ["M54.50"],
    clinicalIndication: "Persistent low back pain after conservative care.",
    facility: "Community Imaging",
  };

  it("requires a chart diagnosis, indication, provider, modality, and facility", () => {
    expect(createImagingOrderSchema.safeParse(orderInput).success).toBe(true);
    expect(createImagingOrderSchema.safeParse({ ...orderInput, diagnosisCodes: [] }).success).toBe(false);
    expect(createImagingOrderSchema.safeParse({ ...orderInput, clinicalIndication: "pain" }).success).toBe(false);
  });

  it("binds authorization and electronic delivery to auditable records", () => {
    expect(createImagingOrderSchema.safeParse({ ...orderInput, authorizationStatus: "pending" }).success).toBe(false);
    expect(createImagingOrderSchema.safeParse({ ...orderInput, authorizationStatus: "pending", priorAuthorizationId: "pa-1" }).success).toBe(true);
    expect(createImagingOrderSchema.safeParse({ ...orderInput, deliveryMethod: "electronic_adapter" }).success).toBe(false);
    expect(createImagingOrderSchema.safeParse({ ...orderInput, deliveryMethod: "electronic_adapter", integrationId: "integration-1" }).success).toBe(true);
  });

  it("blocks readiness until authorization is approved or not required", () => {
    const draft = { status: "draft", deliveryStatus: "not_started", deliveryMethod: "fax", authorizationStatus: "pending" };
    expect(nextImagingOrderStatus(draft, "mark_ready")).toBeNull();
    expect(nextImagingOrderStatus({ ...draft, authorizationStatus: "approved" }, "mark_ready")).toBe("ready_to_send");
  });

  it("never represents delivery before a human or adapter acknowledgment", () => {
    const ready = { status: "ready_to_send", deliveryStatus: "not_started", deliveryMethod: "fax", authorizationStatus: "not_required" };
    expect(nextImagingOrderStatus(ready, "queue_delivery")).toBe("ready_to_send");
    expect(nextImagingOrderStatus(ready, "confirm_delivery")).toBeNull();
    expect(nextImagingOrderStatus({ ...ready, deliveryStatus: "pending_manual" }, "confirm_delivery")).toBe("sent");
    expect(transitionImagingOrderSchema.safeParse({ action: "confirm_delivery" }).success).toBe(false);
  });

  it("requires scheduling and completion timestamps", () => {
    expect(transitionImagingOrderSchema.safeParse({ action: "mark_scheduled" }).success).toBe(false);
    expect(transitionImagingOrderSchema.safeParse({ action: "mark_scheduled", scheduledAt: "2026-07-20T14:00:00.000Z" }).success).toBe(true);
    expect(transitionImagingOrderSchema.safeParse({ action: "mark_completed", completedAt: "2026-07-20T15:00:00.000Z" }).success).toBe(true);
  });

  it("binds uploaded and electronic reports to traceable sources", () => {
    const report = { patientId: "pt-1", facility: "Community Imaging", reportTitle: "MRI lumbar spine", sourceType: "manual_upload", studyPerformedAt: "2026-07-20T15:00:00.000Z" };
    expect(createImagingResultSchema.safeParse(report).success).toBe(false);
    expect(createImagingResultSchema.safeParse({ ...report, reportDocumentId: "doc-1" }).success).toBe(true);
    expect(createImagingResultSchema.safeParse({ ...report, sourceType: "electronic_interface", integrationId: "integration-1" }).success).toBe(true);
  });

  it("requires provider identity for review/release and re-reviews corrections", () => {
    expect(nextImagingResultStatus("needs_review", "release")).toBeNull();
    expect(nextImagingResultStatus("needs_review", "review")).toBe("reviewed");
    expect(nextImagingResultStatus("reviewed", "release")).toBe("released");
    expect(imagingResultActionRequiresProviderIdentity("review")).toBe(true);
    expect(imagingResultActionRequiresProviderIdentity("release")).toBe(true);
    expect(imagingResultActionRequiresProviderIdentity("notify_patient")).toBe(false);
    expect(transitionImagingResultSchema.safeParse({ action: "review" }).success).toBe(false);
    expect(correctImagingResultSchema.safeParse({ reportTitle: "MRI", studyPerformedAt: "2026-07-20T15:00:00.000Z", reason: "Corrected report supplied by radiology." }).success).toBe(false);
  });
});
