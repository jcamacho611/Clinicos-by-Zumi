import "server-only";

import { z } from "zod";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { resolveUniversalPersonForLegacyUser } from "@/lib/identity/legacy-person-resolution";
import {
  assertRelationshipClaimReviewTransition,
  relationshipClaimReviewActions,
  relationshipClaimSubmissionSchema,
  type RelationshipClaimType,
} from "@/lib/identity/relationship-claim-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const reviewSchema = z.object({
  action: z.enum(relationshipClaimReviewActions),
  note: z.string().trim().min(8).max(2_000),
}).strict();

function assertProductionSession(session: ClinicSession) {
  if (session.demo) {
    throw new NetworkAccessError("Relationship claims require an authenticated production account.", 403);
  }
}

function verifiedMembershipType(claimType: RelationshipClaimType) {
  switch (claimType) {
    case "organization_owner": return "verified_organization_owner";
    case "organization_admin": return "verified_organization_admin";
    case "organization_staff": return "verified_organization_staff";
    case "organization_partner": return "verified_organization_partner";
    case "professional_identity": return "verified_professional_identity";
  }
}

function sameClaim(
  existing: {
    claimType: string;
    targetType: string;
    targetOrganizationId: string | null;
    targetProviderId: string | null;
    claimedOrganizationName: string | null;
    claimedRoleKey: string | null;
  },
  input: z.infer<typeof relationshipClaimSubmissionSchema>,
) {
  return existing.claimType === input.claimType
    && existing.targetType === input.targetType
    && existing.targetOrganizationId === (input.targetOrganizationId ?? null)
    && existing.targetProviderId === (input.targetProviderId ?? null)
    && existing.claimedOrganizationName === (input.claimedOrganizationName ?? null)
    && existing.claimedRoleKey === (input.claimedRoleKey ?? null);
}

async function resolveTarget(
  tx: typeof db,
  input: z.infer<typeof relationshipClaimSubmissionSchema>,
) {
  if (input.targetType === "existing_organization") {
    const organization = await tx.organization.findFirst({
      where: { id: input.targetOrganizationId!, status: "active" },
      select: { id: true, name: true, status: true },
    });
    if (!organization) {
      throw new NetworkAccessError("The organization target is not available for a relationship claim.", 404);
    }
    return { organizationId: organization.id, providerId: null };
  }

  if (input.targetType === "professional_profile") {
    const provider = await tx.provider.findFirst({
      where: { id: input.targetProviderId! },
      select: { id: true },
    });
    if (!provider) {
      throw new NetworkAccessError("The professional profile target is not available for a relationship claim.", 404);
    }
    return { organizationId: null, providerId: provider.id };
  }

  // The claim vocabulary supports this target, but the actual Grid presence creation
  // remains a separate, explicitly unverified workflow implemented in the next slice.
  return { organizationId: null, providerId: null };
}

export async function submitRelationshipClaim(session: ClinicSession, rawInput: unknown) {
  assertProductionSession(session);
  const input = relationshipClaimSubmissionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const { personId, legacyUser } = await resolveUniversalPersonForLegacyUser(session.userId, tx);
    if (legacyUser.id !== session.userId || legacyUser.email.toLowerCase() !== session.email.toLowerCase()) {
      throw new NetworkAccessError("Authenticated identity does not match the relationship claimant.", 403);
    }

    const target = await resolveTarget(tx as typeof db, input);
    const activeClaims = await tx.relationshipClaim.findMany({
      where: {
        personId,
        lifecycleStatus: "active",
        targetType: input.targetType,
        targetOrganizationId: input.targetOrganizationId ?? null,
        targetProviderId: input.targetProviderId ?? null,
      },
      orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
    });

    const equivalent = activeClaims.find((claim) => sameClaim(claim, input));
    if (equivalent) return equivalent;
    if (activeClaims.length > 0) {
      throw new NetworkAccessError(
        "A conflicting active relationship claim already exists and requires review before another claim can be submitted.",
        409,
      );
    }

    const claim = await tx.relationshipClaim.create({
      data: {
        personId,
        legacyUserId: legacyUser.id,
        claimType: input.claimType,
        targetType: input.targetType,
        targetOrganizationId: input.targetOrganizationId ?? null,
        targetProviderId: input.targetProviderId ?? null,
        claimedOrganizationName: input.claimedOrganizationName ?? null,
        claimedRoleKey: input.claimedRoleKey ?? null,
        lifecycleStatus: "active",
        verificationStatus: "submitted",
        sourceType: "user_assertion",
        sourceReference: `session:${session.sessionId}`,
      },
    });

    if (target.organizationId) {
      await tx.organizationMembership.upsert({
        where: { id: `orgclaim_${claim.id}` },
        update: {},
        create: {
          id: `orgclaim_${claim.id}`,
          personId,
          organizationId: target.organizationId,
          legacyUserId: legacyUser.id,
          membershipType: "organization_claimant",
          roleKey: input.claimedRoleKey ?? null,
          status: "pending_verification",
          sourceType: "relationship_claim",
          sourceReference: claim.id,
        },
      });

      await tx.task.create({
        data: {
          organizationId: target.organizationId,
          category: "identity_relationship_claim_review",
          title: "Review relationship claim",
          details: `relationship-claim:${claim.id} type:${claim.claimType}`,
          ownerId: null,
          priority: "high",
          riskLevel: "NEEDS_STAFF",
          dueAt: null,
          status: "open",
          createdBy: legacyUser.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: target.organizationId ?? legacyUser.organizationId,
        actorId: legacyUser.id,
        actorType: "user",
        action: "identity.relationship_claim_submitted",
        resourceType: "relationship_claim",
        resourceId: claim.id,
        metadata: {
          claimType: claim.claimType,
          targetType: claim.targetType,
          targetOrganizationId: target.organizationId,
          targetProviderId: target.providerId,
          verificationStatus: claim.verificationStatus,
        },
      },
    });

    return claim;
  });
}

export async function reviewRelationshipClaim(
  session: ClinicSession,
  claimId: string,
  rawInput: unknown,
) {
  assertProductionSession(session);
  const input = reviewSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const claim = await tx.relationshipClaim.findFirst({
      where: { id: claimId, lifecycleStatus: "active" },
    });
    if (!claim) throw new NetworkAccessError("Relationship claim was not found.", 404);
    if (!claim.targetOrganizationId) {
      throw new NetworkAccessError("This claim does not have an organization review context.", 409);
    }
    if (session.organizationId !== claim.targetOrganizationId) {
      throw new NetworkAccessError("Relationship claims can only be reviewed inside the target organization.", 403);
    }
    if (!can(session.role, "identity", "manage")) {
      throw new NetworkAccessError("Identity management permission is required to review this claim.", 403);
    }
    if (claim.legacyUserId === session.userId) {
      throw new NetworkAccessError("A claimant cannot review their own relationship claim.", 403);
    }

    const reviewer = await tx.user.findUnique({
      where: { id: session.userId },
      select: { id: true, organizationId: true, email: true, name: true, roleKey: true, status: true },
    });
    if (
      !reviewer
      || reviewer.status !== "active"
      || reviewer.organizationId !== claim.targetOrganizationId
      || reviewer.id !== session.userId
      || reviewer.email.toLowerCase() !== session.email.toLowerCase()
    ) {
      throw new NetworkAccessError("Reviewer identity is not valid for the target organization.", 403);
    }

    const nextStatus = assertRelationshipClaimReviewTransition(claim.verificationStatus, input.action);
    const now = new Date();
    const updated = await tx.relationshipClaim.update({
      where: { id: claim.id },
      data: {
        verificationStatus: nextStatus,
        reviewedAt: now,
        reviewedBy: reviewer.id,
        reviewNote: input.note,
        rejectionReason: input.action === "reject" ? input.note : null,
      },
    });

    if (nextStatus === "verified") {
      const projection = await tx.organizationMembership.findFirst({
        where: {
          personId: claim.personId,
          organizationId: claim.targetOrganizationId,
          sourceType: "relationship_claim",
          sourceReference: claim.id,
        },
      });
      if (!projection) {
        throw new NetworkAccessError("Claim relationship projection is missing and requires human review.", 409);
      }
      await tx.organizationMembership.update({
        where: { id: projection.id },
        data: {
          membershipType: verifiedMembershipType(claim.claimType as RelationshipClaimType),
          status: "verified_relationship",
          roleKey: claim.claimedRoleKey,
        },
      });
    }

    if (nextStatus === "verified" || nextStatus === "rejected") {
      await tx.task.updateMany({
        where: {
          organizationId: claim.targetOrganizationId,
          category: "identity_relationship_claim_review",
          details: { contains: `relationship-claim:${claim.id}` },
          status: { not: "completed" },
        },
        data: { status: "completed", completedAt: now },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: claim.targetOrganizationId,
        actorId: reviewer.id,
        actorType: "user",
        action: `identity.relationship_claim_${input.action}`,
        resourceType: "relationship_claim",
        resourceId: claim.id,
        changes: {
          verificationStatus: { from: claim.verificationStatus, to: nextStatus },
        },
        metadata: {
          claimType: claim.claimType,
          claimantUserId: claim.legacyUserId,
          note: input.note,
        },
      },
    });

    return updated;
  });
}

export async function listRelationshipClaimsForPerson(session: ClinicSession) {
  assertProductionSession(session);
  return db.$transaction(async (tx) => {
    const { personId, legacyUser } = await resolveUniversalPersonForLegacyUser(session.userId, tx);
    if (legacyUser.email.toLowerCase() !== session.email.toLowerCase()) {
      throw new NetworkAccessError("Authenticated identity does not match the requested relationship history.", 403);
    }
    return tx.relationshipClaim.findMany({
      where: { personId },
      orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
    });
  });
}
