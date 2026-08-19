import type { ExpertDataAccessClass, ExpertEngagementNeed } from "@/lib/orchestration/expert-grid-engine";

export type ExpertEngagementState =
  | "proposed"
  | "terms_pending"
  | "agreements_pending"
  | "access_pending"
  | "ready"
  | "active"
  | "deliverable_submitted"
  | "review_required"
  | "completed"
  | "blocked"
  | "cancelled";

export type ExpertEngagementTerms = {
  organizationAccepted: boolean;
  expertAccepted: boolean;
  conflictCleared: boolean;
  purpose: string;
  startsAt: Date;
  endsAt: Date;
  allowedCapabilityKeys: string[];
  allowedResourceTypes: string[];
  dataAccessClass: ExpertDataAccessClass;
  minimumNecessaryFields: string[];
  agreementEvidenceRefs: Record<string, string>;
  scopedAuthorizationApprovedBy?: string | null;
  scopedAuthorizationApprovedAt?: Date | null;
};

export type ExpertEngagement = {
  id: string;
  organizationId: string;
  expertParticipantId: string;
  needId: string;
  state: ExpertEngagementState;
  terms: ExpertEngagementTerms;
  createdAt: Date;
  activatedAt?: Date | null;
  completedAt?: Date | null;
};

export type ExpertEngagementReadiness = {
  ready: boolean;
  state: ExpertEngagementState;
  blockers: string[];
};

function requiresScopedAuthorization(accessClass: ExpertDataAccessClass) {
  return accessClass !== "none";
}

export function evaluateExpertEngagementReadiness(input: {
  engagement: ExpertEngagement;
  need: ExpertEngagementNeed;
  matchEligible: boolean;
  now?: Date;
}): ExpertEngagementReadiness {
  const now = input.now ?? new Date();
  const blockers: string[] = [];
  const { engagement, need } = input;

  if (engagement.organizationId !== need.organizationId) blockers.push("Engagement organization does not match the governed Grid need.");
  if (engagement.needId !== need.id) blockers.push("Engagement is not bound to the selected governed Grid need.");
  if (!input.matchEligible) blockers.push("The selected expert did not pass deterministic Expert Grid eligibility.");
  if (!engagement.terms.organizationAccepted) blockers.push("Organization terms acceptance is required.");
  if (!engagement.terms.expertAccepted) blockers.push("Expert terms acceptance is required.");
  if (!engagement.terms.conflictCleared) blockers.push("Conflict-of-interest review is not cleared.");
  if (!engagement.terms.purpose.trim()) blockers.push("A specific permitted engagement purpose is required.");
  if (engagement.terms.startsAt >= engagement.terms.endsAt) blockers.push("Engagement end time must be after its start time.");
  if (engagement.terms.endsAt <= now) blockers.push("Engagement authorization window has expired.");
  if (!engagement.terms.allowedCapabilityKeys.includes(need.capabilityKey)) blockers.push("Engagement capabilities do not include the capability required by the Grid need.");

  if (engagement.terms.dataAccessClass !== need.requiredDataAccessClass) {
    blockers.push("Engagement data-access class must exactly match the approved Grid need before activation.");
  }

  if (requiresScopedAuthorization(engagement.terms.dataAccessClass)) {
    if (!engagement.terms.allowedResourceTypes.length) blockers.push("Scoped resource types are required before expert data access.");
    if (!engagement.terms.minimumNecessaryFields.length) blockers.push("Minimum-necessary field scope is required before expert data access.");
    if (!engagement.terms.scopedAuthorizationApprovedBy || !engagement.terms.scopedAuthorizationApprovedAt) {
      blockers.push("Explicit scoped data-access authorization is required.");
    }
  }

  for (const agreementKey of need.requiredAgreementEvidenceKeys) {
    const evidenceRef = engagement.terms.agreementEvidenceRefs[agreementKey];
    if (!evidenceRef?.trim()) blockers.push(`Required agreement evidence is missing: ${agreementKey}.`);
  }

  return {
    ready: blockers.length === 0,
    state: blockers.length === 0 ? "ready" : "blocked",
    blockers,
  };
}

export function activateExpertEngagement(input: {
  engagement: ExpertEngagement;
  need: ExpertEngagementNeed;
  matchEligible: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const readiness = evaluateExpertEngagementReadiness({ ...input, now });
  if (!readiness.ready) return { activated: false as const, engagement: { ...input.engagement, state: "blocked" as const }, blockers: readiness.blockers };

  return {
    activated: true as const,
    engagement: {
      ...input.engagement,
      state: "active" as const,
      activatedAt: now,
    },
    blockers: [],
  };
}

export type ExpertScopedAccessGrant = {
  engagementId: string;
  organizationId: string;
  expertParticipantId: string;
  purpose: string;
  capabilityKeys: string[];
  resourceTypes: string[];
  minimumNecessaryFields: string[];
  dataAccessClass: ExpertDataAccessClass;
  validFrom: Date;
  validUntil: Date;
};

export function scopedAccessGrantForActiveEngagement(input: {
  engagement: ExpertEngagement;
  need: ExpertEngagementNeed;
  matchEligible: boolean;
  now?: Date;
}): ExpertScopedAccessGrant | null {
  const now = input.now ?? new Date();
  if (input.engagement.state !== "active") return null;

  // Re-evaluate the same governed need/match/agreement/data-scope policy at the
  // moment access is requested. Persisted `active` state alone is not authority.
  const readiness = evaluateExpertEngagementReadiness({
    engagement: input.engagement,
    need: input.need,
    matchEligible: input.matchEligible,
    now,
  });
  if (!readiness.ready) return null;

  return {
    engagementId: input.engagement.id,
    organizationId: input.engagement.organizationId,
    expertParticipantId: input.engagement.expertParticipantId,
    purpose: input.engagement.terms.purpose,
    capabilityKeys: [...input.engagement.terms.allowedCapabilityKeys],
    resourceTypes: [...input.engagement.terms.allowedResourceTypes],
    minimumNecessaryFields: [...input.engagement.terms.minimumNecessaryFields],
    dataAccessClass: input.engagement.terms.dataAccessClass,
    validFrom: input.engagement.terms.startsAt,
    validUntil: input.engagement.terms.endsAt,
  };
}

/**
 * A scoped access grant is an authorization envelope, not data. Repositories must
 * still enforce tenant scope, resource authorization, patient release/consent when
 * applicable, and minimum-necessary projection on every read. Grid matching or
 * engagement activation never bypasses canonical Klinikos authorization.
 */
export function expertEngagementCompletion(input: {
  engagement: ExpertEngagement;
  deliverableEvidenceRefs: readonly string[];
  requiresOrganizationReview: boolean;
  now?: Date;
}) {
  if (input.engagement.state !== "active" && input.engagement.state !== "deliverable_submitted") {
    return { ok: false as const, engagement: input.engagement, reason: "Only an active expert engagement can submit completion evidence." };
  }
  if (input.deliverableEvidenceRefs.length === 0) {
    return { ok: false as const, engagement: input.engagement, reason: "Completion requires attributable deliverable evidence." };
  }

  const now = input.now ?? new Date();
  return {
    ok: true as const,
    engagement: {
      ...input.engagement,
      state: input.requiresOrganizationReview ? "review_required" as const : "completed" as const,
      completedAt: input.requiresOrganizationReview ? null : now,
    },
    reason: input.requiresOrganizationReview
      ? "Deliverable evidence was submitted and now requires organization review."
      : "Deliverable evidence was accepted as the configured completion condition.",
  };
}
