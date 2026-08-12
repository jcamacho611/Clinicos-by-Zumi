import { z } from "zod";

export const gridDisputeCategories = [
  "no_show",
  "cancellation",
  "facility_unavailable",
  "service_not_completed",
  "payment_disagreement",
  "payout_disagreement",
  "resource_unavailable",
  "other",
] as const;

export const gridDisputeStatuses = [
  "open",
  "under_review",
  "info_required",
  "resolved_requester",
  "resolved_counterparty",
  "split_resolution",
  "refund_recommended",
  "escalated",
  "closed",
] as const;

export const gridSafetyIncidentCategories = [
  "adverse_event_concern",
  "credential_concern",
  "unsafe_facility",
  "unsafe_equipment",
  "scope_concern",
  "conduct_concern",
  "other",
] as const;

export const gridSafetyIncidentStatuses = [
  "open",
  "triage_required",
  "under_review",
  "restriction_recommended",
  "resource_hold_recommended",
  "referred_to_governance",
  "closed",
] as const;

export const gridSafetySeverities = ["low", "medium", "high", "urgent"] as const;

export type GridDisputeStatus = (typeof gridDisputeStatuses)[number];
export type GridSafetyIncidentStatus = (typeof gridSafetyIncidentStatuses)[number];

export const gridDisputeCreateSchema = z.object({
  category: z.enum(gridDisputeCategories),
  summary: z.string().trim().min(12).max(2_000),
  requestedOutcome: z.string().trim().max(1_000).optional().nullable(),
});

export const gridSafetyIncidentCreateSchema = z.object({
  category: z.enum(gridSafetyIncidentCategories),
  severity: z.enum(gridSafetySeverities),
  summary: z.string().trim().min(12).max(2_000),
});

export const gridDisputeTransitionSchema = z.object({
  targetStatus: z.enum(gridDisputeStatuses),
  note: z.string().trim().min(8).max(2_000),
});

export const gridSafetyIncidentTransitionSchema = z.object({
  targetStatus: z.enum(gridSafetyIncidentStatuses),
  note: z.string().trim().min(8).max(2_000),
});

const disputeTransitions: Record<GridDisputeStatus, readonly GridDisputeStatus[]> = {
  open: ["under_review", "info_required", "escalated", "closed"],
  under_review: ["info_required", "resolved_requester", "resolved_counterparty", "split_resolution", "refund_recommended", "escalated", "closed"],
  info_required: ["under_review", "escalated", "closed"],
  resolved_requester: ["closed"],
  resolved_counterparty: ["closed"],
  split_resolution: ["closed"],
  refund_recommended: ["closed"],
  escalated: ["under_review", "closed"],
  closed: [],
};

const safetyTransitions: Record<GridSafetyIncidentStatus, readonly GridSafetyIncidentStatus[]> = {
  open: ["triage_required", "under_review", "restriction_recommended", "resource_hold_recommended", "referred_to_governance", "closed"],
  triage_required: ["under_review", "restriction_recommended", "resource_hold_recommended", "referred_to_governance", "closed"],
  under_review: ["restriction_recommended", "resource_hold_recommended", "referred_to_governance", "closed"],
  restriction_recommended: ["under_review", "referred_to_governance", "closed"],
  resource_hold_recommended: ["under_review", "referred_to_governance", "closed"],
  referred_to_governance: ["under_review", "restriction_recommended", "resource_hold_recommended", "closed"],
  closed: [],
};

export function canTransitionGridDispute(from: GridDisputeStatus, to: GridDisputeStatus) {
  return disputeTransitions[from].includes(to);
}

export function canTransitionGridSafetyIncident(from: GridSafetyIncidentStatus, to: GridSafetyIncidentStatus) {
  return safetyTransitions[from].includes(to);
}

export function gridIssueBlocksSettlement(status: string) {
  return status !== "closed";
}
