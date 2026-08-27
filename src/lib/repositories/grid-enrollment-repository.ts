import "server-only";

import { RiskLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { gridContractorEnrollmentSchema } from "@/lib/grid-rules";
import {
  ensureOrganizationRelationshipForLegacyUser,
  IdentityRelationshipConflictError,
} from "@/lib/identity/relationship-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export type GridEnrollmentIdentityProof = {
  userId: string;
  email: string;
};

/**
 * Create a pending Grid contractor application without using email equality as identity proof.
 *
 * Existing Klinikos accounts may be reused only when the API supplies a server-validated
 * authentication session that proves the exact legacy user id and normalized email. The
 * universal relationship created here is context/provenance only. It does not switch the
 * current organization, role, session, password, or provider linkage for an existing account.
 */
export async function createIdentitySafeGridContractorEnrollment(
  rawInput: unknown,
  identityProof: GridEnrollmentIdentityProof | null,
) {
  const input = gridContractorEnrollmentSchema.parse(rawInput);

  try {
    return await db.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { slug: input.organizationSlug },
        select: { id: true, demoMode: true, status: true },
      });
      if (!organization || organization.status !== "active") {
        throw new NetworkAccessError("The selected GRID organization is unavailable.", 404);
      }
      if (!organization.demoMode) {
        throw new NetworkAccessError(
          "Public contractor enrollment requires production compliance review before real information can be accepted.",
          409,
        );
      }

      if (identityProof && input.email !== identityProof.email) {
        throw new NetworkAccessError(
          "Use the email on your signed-in account or sign out before creating a different Grid account.",
          409,
        );
      }

      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          email: true,
          organizationId: true,
          roleKey: true,
          status: true,
          name: true,
        },
      });

      if (existingUser) {
        if (!identityProof) {
          throw new NetworkAccessError(
            "An account already exists for this email address. Sign in first to attach a Grid application safely.",
            409,
          );
        }
        if (
          existingUser.id !== identityProof.userId ||
          existingUser.email !== identityProof.email
        ) {
          throw new NetworkAccessError(
            "The signed-in account does not match the Grid application identity.",
            409,
          );
        }
      } else if (identityProof) {
        throw new NetworkAccessError(
          "The signed-in account could not be resolved for this Grid application.",
          409,
        );
      }

      const accountReused = Boolean(existingUser);
      if (accountReused && existingUser) {
        const duplicateApplication = await tx.organizationMembership.findFirst({
          where: {
            legacyUserId: existingUser.id,
            organizationId: organization.id,
            membershipType: "grid_contractor_applicant",
            effectiveTo: null,
          },
          select: { id: true },
        });
        if (duplicateApplication) {
          throw new NetworkAccessError(
            "A Grid contractor application already exists for this account and review organization.",
            409,
          );
        }
      }

      if (!existingUser && !input.password) {
        throw new NetworkAccessError("A password is required to create a new Grid account.", 400);
      }

      const passwordHash = !existingUser && input.password ? await hash(input.password, 12) : null;
      const applicantUser = existingUser ?? await tx.user.create({
        data: {
          organizationId: organization.id,
          email: input.email,
          name: input.fullName,
          roleKey: "contractor",
          status: "pending_approval",
          authCredential: { create: { passwordHash: passwordHash! } },
        },
      });

      const provider = await tx.provider.create({
        data: {
          organizationId: organization.id,
          userId: accountReused ? null : applicantUser.id,
          name: input.fullName,
          displayName: input.fullName,
          legalName: input.fullName,
          engagementType: "independent_contractor",
          contactEmail: input.email,
          contactPhone: input.phone,
          credential: input.credential,
          providerType: input.providerType,
          specialty: input.specialty,
          malpracticeCarrier: input.malpracticeCarrier,
          malpracticePolicyNumber: input.malpracticePolicyNumber,
          malpracticeExpiration: new Date(input.malpracticeExpiration),
          malpracticeCoverageAmountCents: input.malpracticeCoverageAmountCents,
          malpracticeEvidenceReference: input.malpracticeEvidenceReference,
          malpracticeVerificationStatus: "pending",
          certifications: input.certifications,
          services: input.servicesOffered,
          servicesOffered: input.servicesOffered,
          experienceLevel: input.experienceLevel,
          bio: input.bio,
          serviceLocations: [input.serviceArea, ...(input.partnerLocationAllowed ? ["Partner locations"] : [])],
          mobileServiceAllowed: input.mobileServiceAllowed,
          chairRentalAllowed: input.chairRentalAllowed,
          atHomeAllowed: input.atHomeAllowed,
          travelRadiusMiles: input.travelRadiusMiles,
          onCallNow: false,
          verificationStatus: "submitted",
          applicationSubmittedAt: new Date(),
          status: "pending_approval",
          credentials: {
            create: {
              organizationId: organization.id,
              type: input.licenseType,
              number: input.licenseNumber,
              state: input.licenseState,
              expiresAt: new Date(input.licenseExpiration),
              status: "active",
              verificationStatus: "pending",
              verificationSource: "GRID human primary-source review queue",
              evidenceReference: input.licenseEvidenceReference,
            },
          },
          availability: {
            create: input.availability.map((slot) => ({
              organizationId: organization.id,
              weekday: slot.dayOfWeek,
              startsAt: slot.startTime,
              endsAt: slot.endTime,
              locationType: slot.locationType,
              mobileRadius: input.travelRadiusMiles,
              onCall: false,
              status: "draft",
            })),
          },
        },
      });

      await ensureOrganizationRelationshipForLegacyUser({
        userId: applicantUser.id,
        organizationId: organization.id,
        membershipType: "grid_contractor_applicant",
        roleKey: "contractor",
        status: "pending_approval",
        sourceType: "grid_contractor_enrollment",
        sourceReference: provider.id,
      }, tx);

      await Promise.all([
        tx.task.create({
          data: {
            organizationId: organization.id,
            category: "grid_contractor_review",
            title: `Review contractor application: ${provider.displayName}`,
            details: "Verify license evidence, malpractice policy, services, scope, work settings, and availability before activating Grid access.",
            priority: "high",
            riskLevel: RiskLevel.NEEDS_STAFF,
            status: "open",
            ownerId: "credentialing",
            createdBy: applicantUser.id,
          },
        }),
        tx.auditLog.create({
          data: {
            organizationId: organization.id,
            actorId: applicantUser.id,
            actorType: accountReused ? "existing_user_applicant" : "contractor_applicant",
            action: "grid.contractor_enrolled",
            resourceType: "provider",
            resourceId: provider.id,
            metadata: {
              syntheticDemo: true,
              humanApprovalRequired: true,
              accountReused,
              accountAuthorityChanged: false,
              requestedOnCall: input.onCallNow,
            },
          },
        }),
      ]);

      return {
        providerId: provider.id,
        status: provider.verificationStatus,
        accountStatus: applicantUser.status,
        accountReused,
      };
    });
  } catch (error) {
    if (error instanceof IdentityRelationshipConflictError) {
      throw new NetworkAccessError(
        "This account has conflicting universal identity mappings and requires human review before Grid enrollment can continue.",
        409,
      );
    }
    throw error;
  }
}
