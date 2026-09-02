import "server-only";

import { db } from "@/lib/db";
import type { ExpertEngagementTerms } from "@/lib/orchestration/expert-engagement-engine";

export type CreateExpertEngagementRecordInput = {
  organizationId: string;
  sourceRequestId: string;
  expertPersonId: string;
  expertRelationshipId: string;
  /**
   * Trusted server-side result of deterministic Expert Grid eligibility.
   * This repository never treats a relationship, payment, or persisted state as a
   * substitute for that eligibility decision.
   */
  matchEligible: boolean;
  terms: ExpertEngagementTerms;
  createdByPersonId: string;
  occurredAt?: Date;
};

export type ExpertEngagementRecordView = {
  id: string;
  organizationId: string;
  sourceRequestId: string;
  expertPersonId: string;
  expertRelationshipId: string;
  state: "proposed";
  version: 1;
  purpose: string;
  dataAccessClass: ExpertEngagementTerms["dataAccessClass"];
  createdAt: Date;
  grantsDataAccess: false;
};

const allowedExpertRelationshipTypes = new Set(["expert", "professional"]);

function requireNonEmpty(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required.`);
}

function validateProposalTerms(terms: ExpertEngagementTerms) {
  requireNonEmpty(terms.purpose, "Expert engagement purpose");
  if (terms.startsAt >= terms.endsAt) {
    throw new Error("Expert engagement end time must be after its start time.");
  }
  if (terms.allowedCapabilityKeys.length === 0) {
    throw new Error("Expert engagement requires at least one allowed capability.");
  }
}

/**
 * Proposal creation may persist requested scope, time, purpose and data class, but it
 * may never accept caller-supplied facts that would imply either party accepted the
 * engagement, conflicts were cleared, agreements were executed, or scoped data access
 * was approved. Those facts belong to later governed transitions and evidence rails.
 */
function canonicalProposalTerms(terms: ExpertEngagementTerms): ExpertEngagementTerms {
  return {
    ...terms,
    organizationAccepted: false,
    expertAccepted: false,
    conflictCleared: false,
    allowedCapabilityKeys: [...terms.allowedCapabilityKeys],
    allowedResourceTypes: [...terms.allowedResourceTypes],
    minimumNecessaryFields: [...terms.minimumNecessaryFields],
    agreementEvidenceRefs: {},
    scopedAuthorizationApprovedBy: null,
    scopedAuthorizationApprovedAt: null,
  };
}

function proposalSnapshot(terms: ExpertEngagementTerms) {
  return {
    state: "proposed",
    version: 1,
    purpose: terms.purpose,
    startsAt: terms.startsAt.toISOString(),
    endsAt: terms.endsAt.toISOString(),
    organizationAccepted: terms.organizationAccepted,
    expertAccepted: terms.expertAccepted,
    conflictCleared: terms.conflictCleared,
    allowedCapabilityKeys: [...terms.allowedCapabilityKeys],
    allowedResourceTypes: [...terms.allowedResourceTypes],
    dataAccessClass: terms.dataAccessClass,
    minimumNecessaryFields: [...terms.minimumNecessaryFields],
    agreementEvidenceRefs: { ...terms.agreementEvidenceRefs },
    scopedAuthorizationApprovedBy: terms.scopedAuthorizationApprovedBy ?? null,
    scopedAuthorizationApprovedAt: terms.scopedAuthorizationApprovedAt?.toISOString() ?? null,
    grantsDataAccess: false,
  };
}

/**
 * Persist a selected Expert Grid candidate as a proposed governed engagement.
 *
 * This function persists intent and scope only. It never returns a data-access grant.
 * A future active engagement must still pass `scopedAccessGrantForActiveEngagement`
 * at access time, and the downstream repository must separately enforce tenant,
 * resource, consent/release, and minimum-necessary policy.
 */
export async function createExpertEngagementRecord(
  input: CreateExpertEngagementRecordInput,
): Promise<ExpertEngagementRecordView> {
  requireNonEmpty(input.organizationId, "Expert engagement organizationId");
  requireNonEmpty(input.sourceRequestId, "Expert support request id");
  requireNonEmpty(input.expertPersonId, "Expert Person id");
  requireNonEmpty(input.expertRelationshipId, "Expert relationship id");
  requireNonEmpty(input.createdByPersonId, "Expert engagement creator Person id");

  if (!input.matchEligible) {
    throw new Error("Expert Grid eligibility is required before an engagement may be proposed.");
  }
  validateProposalTerms(input.terms);

  const occurredAt = input.occurredAt ?? new Date();
  const proposalTerms = canonicalProposalTerms(input.terms);

  return db.$transaction(async (tx) => {
    const [request, relationship] = await Promise.all([
      tx.expertSupportRequest.findUnique({
        where: { id: input.sourceRequestId },
        select: { id: true, organizationId: true, status: true, capabilityDomain: true },
      }),
      tx.personRelationship.findUnique({
        where: { id: input.expertRelationshipId },
        select: {
          id: true,
          personId: true,
          organizationId: true,
          relationshipType: true,
          status: true,
          verificationState: true,
        },
      }),
    ]);

    if (!request) throw new Error("Expert support request was not found.");
    if (request.organizationId !== input.organizationId) {
      throw new Error("Expert support request does not belong to the engagement organization.");
    }

    if (
      !relationship ||
      relationship.personId !== input.expertPersonId ||
      relationship.status !== "active" ||
      relationship.verificationState !== "verified" ||
      !allowedExpertRelationshipTypes.has(relationship.relationshipType)
    ) {
      throw new Error("Expert relationship does not match the selected verified expert Person.");
    }

    const engagement = await tx.expertEngagement.create({
      data: {
        organizationId: input.organizationId,
        sourceRequestId: input.sourceRequestId,
        expertPersonId: input.expertPersonId,
        expertRelationshipId: input.expertRelationshipId,
        state: "proposed",
        version: 1,
        purpose: proposalTerms.purpose,
        startsAt: proposalTerms.startsAt,
        endsAt: proposalTerms.endsAt,
        organizationAccepted: proposalTerms.organizationAccepted,
        expertAccepted: proposalTerms.expertAccepted,
        conflictCleared: proposalTerms.conflictCleared,
        allowedCapabilityKeys: proposalTerms.allowedCapabilityKeys,
        allowedResourceTypes: proposalTerms.allowedResourceTypes,
        dataAccessClass: proposalTerms.dataAccessClass,
        minimumNecessaryFields: proposalTerms.minimumNecessaryFields,
        agreementEvidenceRefs: proposalTerms.agreementEvidenceRefs,
        scopedAuthorizationApprovedBy: proposalTerms.scopedAuthorizationApprovedBy ?? null,
        scopedAuthorizationApprovedAt: proposalTerms.scopedAuthorizationApprovedAt ?? null,
        createdByPersonId: input.createdByPersonId,
      },
    });

    await tx.expertEngagementEvent.create({
      data: {
        engagementId: engagement.id,
        organizationId: input.organizationId,
        eventSequence: 1,
        eventType: "created",
        previousState: null,
        nextState: "proposed",
        engagementVersion: 1,
        actorPersonId: input.createdByPersonId,
        snapshot: proposalSnapshot(proposalTerms),
        occurredAt,
      },
    });

    return {
      id: engagement.id,
      organizationId: input.organizationId,
      sourceRequestId: input.sourceRequestId,
      expertPersonId: input.expertPersonId,
      expertRelationshipId: input.expertRelationshipId,
      state: "proposed",
      version: 1,
      purpose: proposalTerms.purpose,
      dataAccessClass: proposalTerms.dataAccessClass,
      createdAt: engagement.createdAt,
      grantsDataAccess: false,
    };
  });
}
