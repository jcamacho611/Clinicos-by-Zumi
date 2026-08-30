export type PlacementStatus =
  | "matched"
  | "approval_pending"
  | "approved"
  | "active"
  | "completed"
  | "rejected"
  | "cancelled";

export type PlacementApprovalActor = "learner" | "school" | "site" | "preceptor";
export type PlacementApprovalDecision = "approved" | "rejected";
export type PlacementApprovalState = "pending" | PlacementApprovalDecision;

export type PlacementApprovalRecord = {
  actor: PlacementApprovalActor;
  decision: PlacementApprovalDecision;
  decidedAt: Date;
  evidenceRef: string;
};

export type PlacementTransition = {
  from: PlacementStatus;
  to: PlacementStatus;
  at: Date;
  evidenceRef: string;
};

export type PlacementAuthority = {
  /** Permission to begin this placement workflow, not clinical practice authority. */
  mayStartPlacement: boolean;
  /** A placement never manufactures independent clinical authority. */
  clinicalAuthority: false;
  /** A placement never manufactures a professional license or credential. */
  professionalAuthority: false;
};

export type EduPlacementLifecycle = {
  placementId: string;
  learnerPersonId: string;
  institutionId: string;
  siteOrganizationId: string;
  preceptorPersonId: string;
  gridCompositionKey: string;
  matchedAt: Date;
  status: PlacementStatus;
  approvals: Record<PlacementApprovalActor, PlacementApprovalState>;
  approvalHistory: PlacementApprovalRecord[];
  timeline: PlacementTransition[];
  authority: PlacementAuthority;
};

export type CreatePlacementLifecycleInput = {
  placementId: string;
  learnerPersonId: string;
  institutionId: string;
  siteOrganizationId: string;
  preceptorPersonId: string;
  gridCompositionKey: string;
  matchedAt: Date;
};

export type RecordPlacementApprovalInput = PlacementApprovalRecord;

export type PlacementTransitionInput = {
  to: "active" | "completed" | "cancelled";
  at: Date;
  evidenceRef: string;
};

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function authorityFor(status: PlacementStatus): PlacementAuthority {
  return {
    // All required parties have approved. This means the placement workflow may
    // begin; it does NOT mean the learner gained a license or independent scope.
    mayStartPlacement: status === "approved",
    clinicalAuthority: false,
    professionalAuthority: false,
  };
}

function statusFromApprovals(
  approvals: Record<PlacementApprovalActor, PlacementApprovalState>,
): PlacementStatus {
  if (Object.values(approvals).includes("rejected")) return "rejected";
  if (Object.values(approvals).every((decision) => decision === "approved")) return "approved";
  return "approval_pending";
}

function appendTransition(
  placement: EduPlacementLifecycle,
  to: PlacementStatus,
  at: Date,
  evidenceRef: string,
): PlacementTransition[] {
  if (placement.status === to) return [...placement.timeline];
  return [
    ...placement.timeline,
    {
      from: placement.status,
      to,
      at,
      evidenceRef,
    },
  ];
}

/**
 * Start EDU's placement lifecycle after Grid has produced a candidate composition.
 *
 * Grid owns discovery/matching/composition. EDU owns the separate acceptance,
 * approval, and placement lifecycle. A match therefore enters as `matched` with zero
 * acceptance, approval, or professional authority.
 */
export function createPlacementLifecycle(
  input: CreatePlacementLifecycleInput,
): EduPlacementLifecycle {
  return {
    placementId: requireText(input.placementId, "placementId"),
    learnerPersonId: requireText(input.learnerPersonId, "learnerPersonId"),
    institutionId: requireText(input.institutionId, "institutionId"),
    siteOrganizationId: requireText(input.siteOrganizationId, "siteOrganizationId"),
    preceptorPersonId: requireText(input.preceptorPersonId, "preceptorPersonId"),
    gridCompositionKey: requireText(input.gridCompositionKey, "gridCompositionKey"),
    matchedAt: input.matchedAt,
    status: "matched",
    approvals: {
      learner: "pending",
      school: "pending",
      site: "pending",
      preceptor: "pending",
    },
    approvalHistory: [],
    timeline: [],
    authority: authorityFor("matched"),
  };
}

/**
 * Record one required party's decision. Learner acceptance is deliberately separate
 * from school, site, and preceptor approval. Decisions are evidence-bearing events;
 * they are appended to history rather than silently overwriting the past.
 */
export function recordPlacementApproval(
  placement: EduPlacementLifecycle,
  input: RecordPlacementApprovalInput,
): EduPlacementLifecycle {
  if (["active", "completed", "cancelled", "rejected"].includes(placement.status)) {
    throw new Error(`Placement approvals cannot change while status is ${placement.status}.`);
  }

  const evidenceRef = requireText(input.evidenceRef, "approval evidenceRef");
  const currentDecision = placement.approvals[input.actor];
  if (currentDecision !== "pending") {
    throw new Error(`${input.actor} already recorded a placement approval decision.`);
  }

  const approvals = {
    ...placement.approvals,
    [input.actor]: input.decision,
  };
  const nextStatus = statusFromApprovals(approvals);

  return {
    ...placement,
    approvals,
    approvalHistory: [
      ...placement.approvalHistory,
      {
        actor: input.actor,
        decision: input.decision,
        decidedAt: input.decidedAt,
        evidenceRef,
      },
    ],
    timeline: appendTransition(placement, nextStatus, input.decidedAt, evidenceRef),
    status: nextStatus,
    authority: authorityFor(nextStatus),
  };
}

/**
 * Advance only the placement itself. This function deliberately cannot create
 * learner acceptance, school/site/preceptor approvals, licensure, or independent
 * clinical authority.
 */
export function transitionPlacement(
  placement: EduPlacementLifecycle,
  input: PlacementTransitionInput,
): EduPlacementLifecycle {
  const evidenceRef = requireText(input.evidenceRef, "transition evidenceRef");

  if (input.to === "active") {
    if (placement.status !== "approved") {
      throw new Error(
        "A placement must be accepted by the learner and approved by school, site, and preceptor before it can become active.",
      );
    }
  } else if (input.to === "completed") {
    if (placement.status !== "active") {
      throw new Error("Only an active placement can be completed.");
    }
  } else if (input.to === "cancelled") {
    if (["completed", "rejected", "cancelled"].includes(placement.status)) {
      throw new Error(`A ${placement.status} placement cannot be cancelled.`);
    }
  }

  const nextStatus = input.to;
  return {
    ...placement,
    status: nextStatus,
    timeline: appendTransition(placement, nextStatus, input.at, evidenceRef),
    authority: authorityFor(nextStatus),
  };
}
