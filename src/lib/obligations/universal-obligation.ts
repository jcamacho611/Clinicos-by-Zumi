export const UNIVERSAL_OBLIGATION_STATES = [
  "EXPECTED",
  "OWNED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "FULFILLED",
  "VERIFIED",
  "RECONCILED",
  "CLOSED",
  "BLOCKED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
  "REOPENED",
] as const;

export type UniversalObligationState = (typeof UNIVERSAL_OBLIGATION_STATES)[number];
export type UniversalObligationSourceType = "task" | "referral";

export interface UniversalObligationProjection {
  readonly id: string;
  readonly sourceType: UniversalObligationSourceType;
  readonly sourceId: string;
  readonly organizationId: string;
  readonly patientId: string | null;
  readonly title: string;
  readonly sourceStatus: string;
  readonly state: UniversalObligationState;
  readonly ownerReference: string | null;
  readonly dueAt: string | null;
  readonly open: boolean;
  readonly overdue: boolean;
  readonly priority: string | null;
  readonly riskLevel: string | null;
  readonly updatedAt: string;
}

export interface TaskObligationSource {
  readonly id: string;
  readonly organizationId: string;
  readonly patientId: string | null;
  readonly title: string;
  readonly status: string;
  readonly ownerId: string | null;
  readonly priority: string;
  readonly riskLevel: string;
  readonly dueAt: string | null;
  readonly completedAt: string | null;
  readonly updatedAt: string;
}

export interface ReferralObligationSource {
  readonly id: string;
  readonly organizationId: string;
  readonly patientId: string;
  readonly specialty: string;
  readonly destination: string | null;
  readonly status: string;
  readonly deliveryStatus: string;
  readonly followUpDueAt: string | null;
  readonly closedLoopAt: string | null;
  readonly updatedAt: string;
}

function isOverdue(dueAt: string | null, open: boolean, now: Date) {
  if (!open || !dueAt) return false;
  const due = new Date(dueAt);
  return Number.isFinite(due.getTime()) && due < now;
}

export function projectTaskObligation(
  source: TaskObligationSource,
  now = new Date(),
): UniversalObligationProjection {
  const closed = source.status === "completed";
  const state: UniversalObligationState = closed
    ? "CLOSED"
    : source.ownerId
      ? "OWNED"
      : "EXPECTED";

  return {
    id: `task:${source.id}`,
    sourceType: "task",
    sourceId: source.id,
    organizationId: source.organizationId,
    patientId: source.patientId,
    title: source.title,
    sourceStatus: source.status,
    state,
    ownerReference: source.ownerId,
    dueAt: source.dueAt,
    open: !closed,
    overdue: isOverdue(source.dueAt, !closed, now),
    priority: source.priority,
    riskLevel: source.riskLevel,
    updatedAt: source.updatedAt,
  };
}

function referralState(source: ReferralObligationSource): UniversalObligationState {
  if (source.status === "closed" || source.closedLoopAt) return "CLOSED";
  if (source.status === "declined" || source.deliveryStatus === "failed") return "BLOCKED";
  if (source.status === "consultation_received") return "VERIFIED";
  if (source.status === "completed") return "FULFILLED";
  if (source.status === "received") return "ACKNOWLEDGED";
  if (["sent", "accepted", "scheduled"].includes(source.status)) return "IN_PROGRESS";
  if (source.status === "ready_to_send") return "OWNED";
  return "EXPECTED";
}

export function projectReferralObligation(
  source: ReferralObligationSource,
  now = new Date(),
): UniversalObligationProjection {
  const state = referralState(source);
  const open = state !== "CLOSED" && state !== "CANCELLED" && state !== "EXPIRED";
  const destination = source.destination?.trim();

  return {
    id: `referral:${source.id}`,
    sourceType: "referral",
    sourceId: source.id,
    organizationId: source.organizationId,
    patientId: source.patientId,
    title: destination
      ? `${source.specialty} referral · ${destination}`
      : `${source.specialty} referral`,
    sourceStatus: source.status,
    state,
    ownerReference: source.organizationId,
    dueAt: source.followUpDueAt,
    open,
    overdue: isOverdue(source.followUpDueAt, open, now),
    priority: null,
    riskLevel: null,
    updatedAt: source.updatedAt,
  };
}
