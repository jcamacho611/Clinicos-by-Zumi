import {
  evaluateGridComposition,
  gridCompositionTemplates,
  type GridCompositionComponent,
} from "@/lib/grid/composition-engine";

export type PlacementApprovalState = {
  school: "pending" | "approved" | "rejected";
  site: "pending" | "approved" | "rejected";
  preceptor: "pending" | "accepted" | "declined";
  learner: "pending" | "accepted" | "declined";
};

export type PlacementStatus =
  | "matched"
  | "awaiting_approvals"
  | "approved"
  | "active"
  | "completed"
  | "cancelled";

export type PlacementHourEventStatus = "reported" | "approved" | "rejected";

export type PlacementHourEvent = {
  id: string;
  placementId: string;
  minutes: number;
  status: PlacementHourEventStatus;
  occurredAt: Date;
  reportedBy: string;
  reviewedBy: string | null;
  supersedesEventId: string | null;
};

export type PlacementReadiness = {
  compositionComplete: boolean;
  compositionReadyForOffer: boolean;
  approvalsComplete: boolean;
  readyToStart: boolean;
  blockers: string[];
  approvalBlockers: string[];
  grantsProfessionalAuthority: false;
  grantsClinicalAuthority: false;
  grantsLicensure: false;
};

function approvalBlockers(approvals: PlacementApprovalState) {
  const blockers: string[] = [];

  if (approvals.school !== "approved") blockers.push("school_approval_pending");
  if (approvals.site !== "approved") blockers.push("site_approval_pending");
  if (approvals.preceptor !== "accepted") blockers.push("preceptor_acceptance_pending");
  if (approvals.learner !== "accepted") blockers.push("learner_acceptance_pending");

  return blockers;
}

function compositionBlockers(
  components: GridCompositionComponent[],
  evaluation: ReturnType<typeof evaluateGridComposition>,
) {
  const blockers: string[] = [];

  if (!evaluation.complete) blockers.push("placement_composition_incomplete");

  const preceptor = components.find((component) => component.slotKey === "preceptor");
  if (
    preceptor &&
    (!preceptor.eligibilityVerified ||
      !preceptor.authorizationVerified ||
      !preceptor.availabilityVerified)
  ) {
    blockers.push("preceptor_eligibility_or_authority_unverified");
  }

  if (evaluation.ineligibleComponents.some((id) => id !== preceptor?.resourceId)) {
    blockers.push("placement_component_eligibility_unverified");
  }
  if (evaluation.unauthorizedComponents.some((id) => id !== preceptor?.resourceId)) {
    blockers.push("placement_component_authority_unverified");
  }
  if (evaluation.unavailableComponents.some((id) => id !== preceptor?.resourceId)) {
    blockers.push("placement_component_availability_unverified");
  }

  return blockers;
}

/**
 * Placement readiness is only a cross-domain orchestration result.
 *
 * Grid owns composition verification. EDU owns education/competency truth. Provider
 * credentialing owns professional authority. These states are intentionally kept
 * separate so a structurally complete placement can never manufacture permission to
 * practise, licensure, or professional eligibility.
 */
export function evaluatePlacementReadiness(input: {
  components: GridCompositionComponent[];
  approvals: PlacementApprovalState;
}): PlacementReadiness {
  const evaluation = evaluateGridComposition(
    gridCompositionTemplates.clinicalPlacement,
    input.components,
  );
  const approvalsPending = approvalBlockers(input.approvals);
  const blockers = compositionBlockers(input.components, evaluation);
  const approvalsComplete = approvalsPending.length === 0;

  return {
    compositionComplete: evaluation.complete,
    compositionReadyForOffer: evaluation.readyForOffer,
    approvalsComplete,
    readyToStart: evaluation.readyForOffer && approvalsComplete,
    blockers,
    approvalBlockers: approvalsPending,
    grantsProfessionalAuthority: false,
    grantsClinicalAuthority: false,
    grantsLicensure: false,
  };
}

const allowedTransitions: Record<PlacementStatus, readonly PlacementStatus[]> = {
  matched: ["awaiting_approvals", "cancelled"],
  awaiting_approvals: ["approved", "cancelled"],
  approved: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function transitionPlacementStatus(
  from: PlacementStatus,
  to: PlacementStatus,
): PlacementStatus {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Invalid placement transition: ${from} -> ${to}`);
  }
  return to;
}

export type ApprovedPlacementMinutes = {
  approvedMinutes: number;
  countedEventIds: string[];
  supersededEventIds: string[];
  rejectedEventIds: string[];
  pendingEventIds: string[];
};

/**
 * Derive the current approved time from an append-only event history.
 *
 * A correction points at the event it replaces. The prior event remains in history
 * but no longer contributes to the current total. Rejected or merely reported events
 * never count as approved time.
 */
export function deriveApprovedPlacementMinutes(
  events: readonly PlacementHourEvent[],
): ApprovedPlacementMinutes {
  const supersededIds = new Set(
    events
      .map((event) => event.supersedesEventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  );

  const currentEvents = events.filter((event) => !supersededIds.has(event.id));
  const counted = currentEvents.filter((event) => event.status === "approved");
  const rejected = currentEvents.filter((event) => event.status === "rejected");
  const pending = currentEvents.filter((event) => event.status === "reported");

  return {
    approvedMinutes: counted.reduce((total, event) => total + Math.max(0, event.minutes), 0),
    countedEventIds: counted.map((event) => event.id),
    supersededEventIds: events
      .filter((event) => supersededIds.has(event.id))
      .map((event) => event.id),
    rejectedEventIds: rejected.map((event) => event.id),
    pendingEventIds: pending.map((event) => event.id),
  };
}
