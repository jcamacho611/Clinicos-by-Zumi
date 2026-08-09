import { z } from "zod";
import { networkPurposeSchema, shareableCategorySchema } from "@/lib/network-access-rules";

export const networkHandoffCategories = [
  "referral_request",
  "capacity_request",
  "document_packet",
  "patient_navigation",
  "provider_consultation",
  "no_fault_packet",
  "imaging_request",
  "pt_request",
  "med_spa_provider_request",
] as const;

export const networkHandoffDeliveryMethods = [
  "connected_network",
  "manual",
  "fax",
  "direct_secure_message",
] as const;

export const networkHandoffStatuses = [
  "draft",
  "pending_review",
  "ready_to_send",
  "sent_connected",
  "sent_manual",
  "fax_pending",
  "direct_pending",
  "received",
  "acknowledged",
  "needs_clarification",
  "scheduled",
  "completed",
  "failed",
  "cancelled",
] as const;

export const createNetworkHandoffSchema = z.object({
  patientId: z.string().min(1),
  destinationOrganizationId: z.string().min(1),
  category: z.enum(networkHandoffCategories),
  purposeOfUse: networkPurposeSchema.default("treatment"),
  dataCategories: z.array(shareableCategorySchema).min(1).max(10).refine(
    (values) => new Set(values).size === values.length,
    "Data categories must be unique.",
  ),
  requestedAction: z.string().trim().min(12).max(700),
  priority: z.enum(["normal", "high", "urgent", "needs_provider"]).default("normal"),
  dueAt: z.coerce.date().optional(),
  deliveryMethod: z.enum(networkHandoffDeliveryMethods),
  minimumNecessarySummary: z.string().trim().min(12).max(1_000),
  humanConfirmed: z.literal(true),
});

export const networkHandoffActionSchema = z.enum([
  "send_connected",
  "send_manual",
  "queue_fax",
  "queue_direct",
  "mark_received",
  "acknowledge",
  "request_clarification",
  "schedule",
  "complete",
  "fail",
  "retry",
  "cancel",
]);
export type NetworkHandoffAction = z.infer<typeof networkHandoffActionSchema>;

export const transitionNetworkHandoffSchema = z.object({
  action: networkHandoffActionSchema,
  note: z.string().trim().min(8).max(700),
  scheduledAt: z.coerce.date().optional(),
}).superRefine((input, context) => {
  if (input.action === "schedule" && !input.scheduledAt) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "A scheduled date is required." });
  }
});

export interface NetworkHandoffState {
  status: string;
  deliveryMethod: string;
  direction: "outbound" | "inbound";
}

const sourceActions = new Set<NetworkHandoffAction>([
  "send_connected", "send_manual", "queue_fax", "queue_direct", "fail", "retry", "cancel",
]);
const destinationActions = new Set<NetworkHandoffAction>([
  "mark_received", "acknowledge", "request_clarification", "schedule", "complete", "fail",
]);

export function nextNetworkHandoffStatus(state: NetworkHandoffState, action: NetworkHandoffAction) {
  if (state.direction === "outbound" && !sourceActions.has(action)) return null;
  if (state.direction === "inbound" && !destinationActions.has(action)) return null;

  if (action === "send_connected" && state.status === "ready_to_send" && state.deliveryMethod === "connected_network") return "sent_connected";
  if (action === "send_manual" && state.status === "ready_to_send" && state.deliveryMethod === "manual") return "sent_manual";
  if (action === "queue_fax" && ["ready_to_send", "failed"].includes(state.status) && state.deliveryMethod === "fax") return "fax_pending";
  if (action === "queue_direct" && ["ready_to_send", "failed"].includes(state.status) && state.deliveryMethod === "direct_secure_message") return "direct_pending";
  if (action === "mark_received" && ["sent_connected", "sent_manual", "fax_pending", "direct_pending"].includes(state.status)) return "received";
  if (action === "acknowledge" && ["received", "needs_clarification"].includes(state.status)) return "acknowledged";
  if (action === "request_clarification" && ["sent_connected", "sent_manual", "fax_pending", "direct_pending", "received"].includes(state.status)) return "needs_clarification";
  if (action === "schedule" && ["received", "acknowledged"].includes(state.status)) return "scheduled";
  if (action === "complete" && ["acknowledged", "scheduled"].includes(state.status)) return "completed";
  if (action === "fail" && !["completed", "cancelled", "failed"].includes(state.status)) return "failed";
  if (action === "retry" && state.status === "failed") return "ready_to_send";
  if (action === "cancel" && !["completed", "cancelled"].includes(state.status)) return "cancelled";
  return null;
}

export function requiresConnectedAuthority(status: string) {
  return !["draft", "pending_review", "cancelled", "failed"].includes(status);
}
