import { z } from "zod";

export const referralPrioritySchema = z.enum(["routine", "urgent", "stat"]);
export const referralDeliveryMethodSchema = z.enum(["connected_network", "manual", "fax", "direct_secure_message"]);
export const referralAuthorizationSchema = z.enum(["not_required", "pending", "approved", "denied"]);

export const createReferralSchema = z.object({
  patientId: z.string().min(1),
  encounterId: z.string().min(1).optional(),
  specialty: z.string().trim().min(2).max(120),
  destinationOrganizationId: z.string().min(1).optional(),
  destinationFacilityId: z.string().min(1).optional(),
  destinationName: z.string().trim().min(2).max(180).optional(),
  reason: z.string().trim().min(8).max(1_000),
  clinicalQuestion: z.string().trim().min(8).max(1_000),
  priority: referralPrioritySchema.default("routine"),
  authorizationStatus: referralAuthorizationSchema.default("not_required"),
  deliveryMethod: referralDeliveryMethodSchema,
  supportingDocumentIds: z.array(z.string().min(1)).max(25).default([]),
  followUpInDays: z.number().int().min(1).max(90).default(7),
}).superRefine((input, context) => {
  if (input.deliveryMethod === "connected_network" && !input.destinationOrganizationId) {
    context.addIssue({ code: "custom", path: ["destinationOrganizationId"], message: "A connected destination organization is required." });
  }
  if (input.deliveryMethod !== "connected_network" && !input.destinationName) {
    context.addIssue({ code: "custom", path: ["destinationName"], message: "An external destination name is required." });
  }
});

export const referralActionSchema = z.enum([
  "mark_ready",
  "send",
  "queue_manual_delivery",
  "confirm_manual_delivery",
  "acknowledge",
  "accept",
  "decline",
  "schedule",
  "complete",
  "consultation_received",
  "record_patient_outreach",
  "close",
  "fail_delivery",
  "retry_delivery",
]);
export type ReferralAction = z.infer<typeof referralActionSchema>;

export const transitionReferralSchema = z.object({
  action: referralActionSchema,
  note: z.string().trim().max(1_000).optional(),
  appointmentAt: z.coerce.date().optional(),
  consultationNoteDocumentId: z.string().min(1).optional(),
  specialistResponse: z.string().trim().max(4_000).optional(),
}).superRefine((input, context) => {
  if (["decline", "confirm_manual_delivery", "fail_delivery", "record_patient_outreach"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A note of at least 8 characters is required for this action." });
  }
  if (input.action === "schedule" && !input.appointmentAt) {
    context.addIssue({ code: "custom", path: ["appointmentAt"], message: "An appointment date is required." });
  }
  if (input.action === "consultation_received" && !input.consultationNoteDocumentId && (!input.specialistResponse || input.specialistResponse.length < 12)) {
    context.addIssue({ code: "custom", path: ["specialistResponse"], message: "A consultation document or specialist response is required." });
  }
});

export interface ReferralStateInput {
  status: string;
  deliveryStatus: string;
  destinationType: string;
  direction: "outbound" | "inbound";
}

const sourceActions = new Set<ReferralAction>([
  "mark_ready", "send", "queue_manual_delivery", "confirm_manual_delivery", "record_patient_outreach", "close", "fail_delivery", "retry_delivery",
]);
const destinationActions = new Set<ReferralAction>([
  "acknowledge", "accept", "decline", "schedule", "complete", "consultation_received",
]);

const transitions: Record<ReferralAction, { from: string[]; to?: string }> = {
  mark_ready: { from: ["draft"], to: "ready_to_send" },
  send: { from: ["ready_to_send"], to: "sent" },
  queue_manual_delivery: { from: ["ready_to_send"] },
  confirm_manual_delivery: { from: ["ready_to_send"], to: "sent" },
  acknowledge: { from: ["sent"], to: "received" },
  accept: { from: ["received"], to: "accepted" },
  decline: { from: ["sent", "received"], to: "declined" },
  schedule: { from: ["accepted"], to: "scheduled" },
  complete: { from: ["accepted", "scheduled"], to: "completed" },
  consultation_received: { from: ["completed"], to: "consultation_received" },
  record_patient_outreach: { from: ["sent", "received", "accepted", "scheduled", "completed", "consultation_received"] },
  close: { from: ["consultation_received"], to: "closed" },
  fail_delivery: { from: ["ready_to_send", "sent"] },
  retry_delivery: { from: ["ready_to_send", "sent"] },
};

export function nextReferralStatus(referral: ReferralStateInput, action: ReferralAction) {
  if (referral.direction === "outbound" && !sourceActions.has(action)) return null;
  if (referral.direction === "inbound" && !destinationActions.has(action)) return null;
  const transition = transitions[action];
  if (!transition.from.includes(referral.status)) return null;
  if (action === "send" && referral.destinationType !== "connected") return null;
  if (["queue_manual_delivery", "confirm_manual_delivery"].includes(action) && referral.destinationType !== "external") return null;
  if (action === "confirm_manual_delivery" && referral.deliveryStatus !== "pending_manual") return null;
  if (action === "retry_delivery" && referral.deliveryStatus !== "failed") return null;
  if (action === "fail_delivery" && !["pending_manual", "delivered"].includes(referral.deliveryStatus)) return null;
  return transition.to ?? referral.status;
}

export function referralIsOpen(status: string) {
  return !["closed", "declined", "cancelled"].includes(status);
}
