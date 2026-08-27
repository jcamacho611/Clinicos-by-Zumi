import { z } from "zod";

export const relationshipClaimTypes = [
  "organization_owner",
  "organization_admin",
  "organization_staff",
  "professional_identity",
  "organization_partner",
] as const;

export const relationshipClaimTargetTypes = [
  "existing_organization",
  "new_organization_presence",
  "professional_profile",
] as const;

export const relationshipClaimVerificationStatuses = [
  "submitted",
  "evidence_required",
  "in_review",
  "verified",
  "rejected",
] as const;

export const relationshipClaimReviewActions = [
  "start_review",
  "request_evidence",
  "verify",
  "reject",
] as const;

export type RelationshipClaimType = (typeof relationshipClaimTypes)[number];
export type RelationshipClaimTargetType = (typeof relationshipClaimTargetTypes)[number];
export type RelationshipClaimVerificationStatus = (typeof relationshipClaimVerificationStatuses)[number];
export type RelationshipClaimReviewAction = (typeof relationshipClaimReviewActions)[number];

const organizationClaimTypes = new Set<RelationshipClaimType>([
  "organization_owner",
  "organization_admin",
  "organization_staff",
  "organization_partner",
]);

export const relationshipClaimSubmissionSchema = z
  .object({
    claimType: z.enum(relationshipClaimTypes),
    targetType: z.enum(relationshipClaimTargetTypes),
    targetOrganizationId: z.string().trim().min(1).max(191).optional(),
    targetProviderId: z.string().trim().min(1).max(191).optional(),
    claimedOrganizationName: z.string().trim().min(2).max(240).optional(),
    claimedRoleKey: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.targetType === "existing_organization") {
      if (!organizationClaimTypes.has(value.claimType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["claimType"],
          message: "Existing organization targets require an organization relationship claim.",
        });
      }
      if (!value.targetOrganizationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetOrganizationId"],
          message: "An existing organization target must be identified by its server-safe organization ID.",
        });
      }
      if (value.targetProviderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetProviderId"],
          message: "Provider targets are not valid for organization relationship claims.",
        });
      }
      return;
    }

    if (value.targetType === "new_organization_presence") {
      if (!organizationClaimTypes.has(value.claimType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["claimType"],
          message: "New organization presence targets require an organization relationship claim.",
        });
      }
      if (!value.claimedOrganizationName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["claimedOrganizationName"],
          message: "A claimed organization name is required to request a new organization presence.",
        });
      }
      if (value.targetOrganizationId || value.targetProviderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetType"],
          message: "A new organization presence cannot manufacture an existing organization or provider target.",
        });
      }
      return;
    }

    if (value.claimType !== "professional_identity") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["claimType"],
        message: "Professional profile targets require the professional identity claim type.",
      });
    }
    if (!value.targetProviderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetProviderId"],
        message: "A professional profile target must be identified by its provider ID.",
      });
    }
    if (value.targetOrganizationId || value.claimedOrganizationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetType"],
        message: "Professional identity claims cannot manufacture organization context.",
      });
    }
  });

const reviewTransitions: Record<
  RelationshipClaimVerificationStatus,
  Partial<Record<RelationshipClaimReviewAction, RelationshipClaimVerificationStatus>>
> = {
  submitted: {
    start_review: "in_review",
    request_evidence: "evidence_required",
  },
  evidence_required: {
    start_review: "in_review",
  },
  in_review: {
    request_evidence: "evidence_required",
    verify: "verified",
    reject: "rejected",
  },
  verified: {},
  rejected: {},
};

export function assertRelationshipClaimReviewTransition(
  current: string,
  action: string,
): RelationshipClaimVerificationStatus {
  const currentResult = z.enum(relationshipClaimVerificationStatuses).safeParse(current);
  const actionResult = z.enum(relationshipClaimReviewActions).safeParse(action);

  if (!currentResult.success || !actionResult.success) {
    throw new Error("Invalid relationship claim review transition.");
  }

  const next = reviewTransitions[currentResult.data][actionResult.data];
  if (!next) {
    throw new Error(`Relationship claim cannot transition from ${current} via ${action}.`);
  }

  return next;
}
