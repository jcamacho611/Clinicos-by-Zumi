import { z } from "zod";

export const imagingModalities = [
  "xray",
  "ct",
  "mri",
  "ultrasound",
  "mammography",
  "pet",
  "dexa",
  "fluoroscopy",
  "nuclear_medicine",
  "other",
] as const;

export const imagingDeliveryMethods = ["manual", "print", "fax", "direct", "electronic_adapter"] as const;
export const imagingAuthorizationStatuses = ["not_required", "pending", "approved", "denied", "expired"] as const;

export const createImagingOrderSchema = z.object({
  patientId: z.string().trim().min(1),
  encounterId: z.string().trim().min(1).optional(),
  providerId: z.string().trim().min(1),
  study: z.string().trim().min(2).max(180),
  modality: z.enum(imagingModalities),
  bodyPart: z.string().trim().min(2).max(120),
  laterality: z.enum(["none", "left", "right", "bilateral"]).default("none"),
  diagnosisCodes: z.array(z.string().trim().min(3).max(16)).min(1).max(12),
  clinicalIndication: z.string().trim().min(8).max(2_000),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  facility: z.string().trim().min(2).max(180),
  priorAuthorizationId: z.string().trim().min(1).optional(),
  authorizationStatus: z.enum(imagingAuthorizationStatuses).default("not_required"),
  deliveryMethod: z.enum(imagingDeliveryMethods).default("manual"),
  integrationId: z.string().trim().min(1).optional(),
}).superRefine((input, context) => {
  if (input.deliveryMethod === "electronic_adapter" && !input.integrationId) {
    context.addIssue({ code: "custom", path: ["integrationId"], message: "An active imaging integration is required for electronic delivery." });
  }
  if (input.authorizationStatus !== "not_required" && !input.priorAuthorizationId) {
    context.addIssue({ code: "custom", path: ["priorAuthorizationId"], message: "Select the patient authorization record for this status." });
  }
});

export const imagingOrderActionSchema = z.enum([
  "mark_ready",
  "queue_delivery",
  "confirm_delivery",
  "mark_scheduled",
  "mark_completed",
  "fail_delivery",
  "retry_delivery",
  "cancel",
]);
export type ImagingOrderAction = z.infer<typeof imagingOrderActionSchema>;

export const transitionImagingOrderSchema = z.object({
  action: imagingOrderActionSchema,
  note: z.string().trim().max(2_000).optional(),
  scheduledAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
}).superRefine((input, context) => {
  if (["confirm_delivery", "fail_delivery", "cancel"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A human confirmation note of at least 8 characters is required." });
  }
  if (input.action === "mark_scheduled" && !input.scheduledAt) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "The imaging appointment time is required." });
  }
  if (input.action === "mark_completed" && !input.completedAt) {
    context.addIssue({ code: "custom", path: ["completedAt"], message: "The study completion time is required." });
  }
});

export function nextImagingOrderStatus(
  order: { status: string; deliveryStatus: string; deliveryMethod: string; authorizationStatus: string },
  action: ImagingOrderAction,
) {
  if (action === "mark_ready" && order.status === "draft" && ["not_required", "approved"].includes(order.authorizationStatus)) return "ready_to_send";
  if (["queue_delivery", "retry_delivery"].includes(action) && order.status === "ready_to_send") return order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send";
  if (action === "retry_delivery" && order.deliveryStatus === "failed") return order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send";
  if (action === "confirm_delivery" && ["ready_to_send", "transmission_queued"].includes(order.status) && ["pending_manual", "queued"].includes(order.deliveryStatus)) return "sent";
  if (action === "mark_scheduled" && ["sent", "scheduled"].includes(order.status)) return "scheduled";
  if (action === "mark_completed" && ["sent", "scheduled"].includes(order.status)) return "completed";
  if (action === "fail_delivery" && ["pending_manual", "queued"].includes(order.deliveryStatus)) return order.status;
  if (action === "cancel" && !["completed", "report_received", "cancelled"].includes(order.status)) return "cancelled";
  return null;
}

export const createImagingResultSchema = z.object({
  patientId: z.string().trim().min(1),
  orderId: z.string().trim().min(1).optional(),
  integrationId: z.string().trim().min(1).optional(),
  reportDocumentId: z.string().trim().min(1).optional(),
  facility: z.string().trim().min(2).max(180),
  reportTitle: z.string().trim().min(2).max(240),
  sourceType: z.enum(["manual_upload", "structured_manual", "electronic_interface"]).default("manual_upload"),
  sourceReference: z.string().trim().max(240).optional(),
  findings: z.string().trim().max(20_000).optional(),
  impression: z.string().trim().max(10_000).optional(),
  imageReference: z.string().trim().max(1_000).optional(),
  studyPerformedAt: z.coerce.date(),
  urgentSourceFlag: z.boolean().default(false),
}).superRefine((input, context) => {
  if (input.sourceType === "manual_upload" && !input.reportDocumentId) {
    context.addIssue({ code: "custom", path: ["reportDocumentId"], message: "A patient imaging-report document is required for manual upload." });
  }
  if (input.sourceType === "electronic_interface" && !input.integrationId) {
    context.addIssue({ code: "custom", path: ["integrationId"], message: "An active imaging integration is required for electronic reports." });
  }
  if (input.sourceType === "structured_manual" && !input.findings && !input.impression) {
    context.addIssue({ code: "custom", path: ["findings"], message: "Structured manual reports require findings or an impression copied from the source report." });
  }
});

export const imagingResultActionSchema = z.enum(["review", "release", "notify_patient", "create_follow_up"]);
export type ImagingResultAction = z.infer<typeof imagingResultActionSchema>;

export function imagingResultActionRequiresProviderIdentity(action: ImagingResultAction) {
  return action === "review" || action === "release";
}

export const transitionImagingResultSchema = z.object({
  action: imagingResultActionSchema,
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

export function nextImagingResultStatus(status: string, action: ImagingResultAction) {
  if (action === "review" && status === "needs_review") return "reviewed";
  if (action === "release" && status === "reviewed") return "released";
  if (["notify_patient", "create_follow_up"].includes(action) && ["reviewed", "released"].includes(status)) return status;
  return null;
}

export const correctImagingResultSchema = z.object({
  reportTitle: z.string().trim().min(2).max(240),
  sourceReference: z.string().trim().max(240).optional(),
  findings: z.string().trim().max(20_000).optional(),
  impression: z.string().trim().max(10_000).optional(),
  imageReference: z.string().trim().max(1_000).optional(),
  studyPerformedAt: z.coerce.date(),
  urgentSourceFlag: z.boolean().default(false),
  reason: z.string().trim().min(12).max(1_000),
}).refine((input) => Boolean(input.findings || input.impression), {
  path: ["findings"],
  message: "A corrected report requires findings or an impression copied from the corrected source.",
});
