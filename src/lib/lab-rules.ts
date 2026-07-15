import { z } from "zod";

export const labPrioritySchema = z.enum(["routine", "urgent", "stat"]);
export const labDeliveryMethodSchema = z.enum(["manual", "print", "fax", "electronic_adapter"]);

export const labTestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  loincCode: z.string().trim().min(3).max(32).optional(),
});

export const createLabOrderSchema = z.object({
  patientId: z.string().min(1),
  encounterId: z.string().min(1).optional(),
  providerId: z.string().min(1),
  vendor: z.string().trim().min(2).max(180),
  integrationId: z.string().min(1).optional(),
  tests: z.array(labTestSchema).min(1).max(30),
  diagnosisCodes: z.array(z.string().trim().min(2).max(20)).min(1).max(20),
  priority: labPrioritySchema.default("routine"),
  specimenType: z.string().trim().min(2).max(120).optional(),
  collectionSite: z.string().trim().min(2).max(180).optional(),
  collectionInstructions: z.string().trim().max(1_000).optional(),
  deliveryMethod: labDeliveryMethodSchema.default("manual"),
}).superRefine((input, context) => {
  if (input.deliveryMethod === "electronic_adapter" && !input.integrationId) {
    context.addIssue({ code: "custom", path: ["integrationId"], message: "An active laboratory integration is required for adapter delivery." });
  }
});

export const labOrderActionSchema = z.enum([
  "mark_ready",
  "queue_delivery",
  "confirm_delivery",
  "record_collection",
  "fail_delivery",
  "retry_delivery",
  "cancel",
]);
export type LabOrderAction = z.infer<typeof labOrderActionSchema>;

export const transitionLabOrderSchema = z.object({
  action: labOrderActionSchema,
  note: z.string().trim().max(1_000).optional(),
  collectedAt: z.coerce.date().optional(),
}).superRefine((input, context) => {
  if (["confirm_delivery", "fail_delivery", "cancel"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A note of at least 8 characters is required for this action." });
  }
  if (input.action === "record_collection" && !input.collectedAt) {
    context.addIssue({ code: "custom", path: ["collectedAt"], message: "Collection date and time are required." });
  }
});

export interface LabOrderState {
  status: string;
  deliveryStatus: string;
  deliveryMethod: string;
}

export function nextLabOrderStatus(order: LabOrderState, action: LabOrderAction) {
  if (action === "mark_ready" && order.status === "draft") return "ready_to_send";
  if (action === "queue_delivery" && order.status === "ready_to_send" && ["not_started", "failed"].includes(order.deliveryStatus)) {
    return order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send";
  }
  if (action === "confirm_delivery" && ["ready_to_send", "transmission_queued"].includes(order.status) && ["pending_manual", "queued"].includes(order.deliveryStatus)) return "sent";
  if (action === "record_collection" && order.status === "sent" && order.deliveryStatus === "delivered") return "collected";
  if (action === "fail_delivery" && ["ready_to_send", "transmission_queued"].includes(order.status) && ["pending_manual", "queued"].includes(order.deliveryStatus)) return order.status;
  if (action === "retry_delivery" && ["ready_to_send", "transmission_queued"].includes(order.status) && order.deliveryStatus === "failed") {
    return order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send";
  }
  if (action === "cancel" && !["resulted", "cancelled"].includes(order.status)) return "cancelled";
  return null;
}

export const labResultItemSchema = z.object({
  name: z.string().trim().min(2).max(160),
  loincCode: z.string().trim().min(3).max(32).optional(),
  value: z.string().trim().min(1).max(120),
  numericValue: z.number().finite().optional(),
  unit: z.string().trim().max(40).optional(),
  referenceRange: z.string().trim().max(120).optional(),
  abnormalFlag: z.enum(["normal", "high", "low", "abnormal", "critical"]).optional(),
  critical: z.boolean().default(false),
  resultStatus: z.enum(["preliminary", "final", "corrected"]).default("final"),
}).superRefine((input, context) => {
  if (input.critical && input.abnormalFlag !== "critical") {
    context.addIssue({ code: "custom", path: ["abnormalFlag"], message: "Critical result items must use the critical flag." });
  }
});

export const createLabResultSchema = z.object({
  patientId: z.string().min(1),
  orderId: z.string().min(1).optional(),
  vendor: z.string().trim().min(2).max(180).optional(),
  integrationId: z.string().min(1).optional(),
  panelName: z.string().trim().min(2).max(180),
  sourceType: z.enum(["manual_entry", "manual_upload", "electronic_interface"]).default("manual_entry"),
  sourceReference: z.string().trim().max(240).optional(),
  sourceDocumentId: z.string().min(1).optional(),
  specimenType: z.string().trim().max(120).optional(),
  collectedAt: z.coerce.date().optional(),
  resultedAt: z.coerce.date(),
  items: z.array(labResultItemSchema).min(1).max(100),
}).superRefine((input, context) => {
  if (input.sourceType === "manual_upload" && !input.sourceDocumentId) {
    context.addIssue({ code: "custom", path: ["sourceDocumentId"], message: "A patient document is required for manual upload results." });
  }
  if (input.sourceType === "electronic_interface" && !input.integrationId) {
    context.addIssue({ code: "custom", path: ["integrationId"], message: "An active laboratory integration is required for electronic results." });
  }
});

export const labResultActionSchema = z.enum([
  "review",
  "release",
  "notify_patient",
  "create_follow_up",
  "repeat_order",
]);
export type LabResultAction = z.infer<typeof labResultActionSchema>;

export function labResultActionRequiresProviderIdentity(action: LabResultAction) {
  return action === "review" || action === "release" || action === "repeat_order";
}

export const transitionLabResultSchema = z.object({
  action: labResultActionSchema,
  note: z.string().trim().max(2_000).optional(),
  followUpDueAt: z.coerce.date().optional(),
}).superRefine((input, context) => {
  if (["review", "notify_patient", "create_follow_up"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A note of at least 8 characters is required for this action." });
  }
  if (input.action === "create_follow_up" && !input.followUpDueAt) {
    context.addIssue({ code: "custom", path: ["followUpDueAt"], message: "A follow-up due date is required." });
  }
});

export const correctLabResultSchema = z.object({
  vendor: z.string().trim().min(2).max(180).optional(),
  panelName: z.string().trim().min(2).max(180),
  sourceReference: z.string().trim().max(240).optional(),
  specimenType: z.string().trim().max(120).optional(),
  collectedAt: z.coerce.date().optional(),
  resultedAt: z.coerce.date(),
  items: z.array(labResultItemSchema).min(1).max(100),
  reason: z.string().trim().min(12).max(1_000),
});

export function nextLabResultStatus(status: string, action: LabResultAction) {
  if (action === "review" && status === "needs_review") return "reviewed";
  if (action === "release" && status === "reviewed") return "released";
  if (["notify_patient", "create_follow_up", "repeat_order"].includes(action) && ["reviewed", "released"].includes(status)) return status;
  return null;
}

export function summarizeLabFlags(items: z.infer<typeof labResultItemSchema>[]) {
  return {
    abnormal: items.some((item) => item.critical || (item.abnormalFlag && item.abnormalFlag !== "normal")),
    critical: items.some((item) => item.critical || item.abnormalFlag === "critical"),
  };
}
