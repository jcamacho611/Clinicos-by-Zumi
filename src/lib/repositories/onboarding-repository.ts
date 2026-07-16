import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { can, clinicActions, clinicResources, clinicRoles, roleLabel } from "@/lib/auth/rbac";
import type { AuthenticatedIdentity } from "@/lib/auth/types";
import {
  defaultAppointmentTypes,
  pendingConnectorTemplates,
  slugifyOrganizationName,
  type OnboardingInput,
} from "@/lib/onboarding-rules";

interface OnboardingMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class OnboardingError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function resolveOrganizationSlug(tx: Prisma.TransactionClient, organizationName: string) {
  const base = slugifyOrganizationName(organizationName);
  const existing = await tx.organization.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? `${base}-${randomUUID().slice(0, 6)}` : base;
}

function roleRecords(organizationId: string) {
  return clinicRoles.map((key) => ({
    id: randomUUID(),
    organizationId,
    key,
    name: roleLabel(key),
    description: key === "clinic_owner"
      ? "Full organization administration with governed clinical review boundaries."
      : `Default ClinicOS ${roleLabel(key)} role.`,
  }));
}

export async function createOrganizationWorkspace(input: OnboardingInput, metadata: OnboardingMetadata) {
  const passwordHash = await hash(input.password, 12);

  try {
    return await db.$transaction(async (tx) => {
      const emailExists = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (emailExists) throw new OnboardingError("An account already exists for this email. Sign in instead.", 409);

      const organizationId = randomUUID();
      const userId = randomUUID();
      const locationId = randomUUID();
      const slug = await resolveOrganizationSlug(tx, input.organizationName);
      const trialEndsAt = new Date(Date.now() + 30 * 86_400_000);
      const roles = roleRecords(organizationId);

      const organization = await tx.organization.create({
        data: {
          id: organizationId,
          name: input.organizationName,
          slug,
          clinicType: input.clinicType,
          status: "active",
          demoMode: true,
        },
      });

      await tx.location.create({
        data: {
          id: locationId,
          organizationId,
          name: input.locationName,
          timezone: input.timezone,
          address: { city: input.city, state: input.state, country: "US" },
        },
      });

      await tx.department.createMany({
        data: [
          { organizationId, locationId, name: "Clinical Care" },
          { organizationId, locationId, name: "Practice Operations" },
        ],
      });

      const user = await tx.user.create({
        data: {
          id: userId,
          organizationId,
          email: input.email,
          name: input.ownerName,
          roleKey: "clinic_owner",
          authCredential: { create: { passwordHash } },
        },
      });

      await tx.role.createMany({ data: roles });
      await tx.permission.createMany({
        data: roles.flatMap((role) => clinicResources.flatMap((resource) => clinicActions
          .filter((action) => can(role.key, resource, action))
          .map((action) => ({ roleId: role.id, resource, action, allowed: true })))),
      });

      await tx.appointmentType.createMany({
        data: defaultAppointmentTypes.map((appointmentType) => ({ organizationId, ...appointmentType })),
      });

      await tx.clinicSubscription.create({
        data: {
          organizationId,
          planKey: "founding-clinic-free-trial",
          status: "trialing",
          modules: ["emr", "operations", "network", "revenue", "quality", "voice"],
          trialEndsAt,
        },
      });

      await tx.setting.createMany({
        data: [
          {
            organizationId,
            key: "onboarding.profile",
            value: { teamSize: input.teamSize, primaryGoal: input.primaryGoal, completedSteps: ["offer", "organization", "owner", "workspace"] },
          },
          {
            organizationId,
            key: "compliance.phi_mode",
            value: { enabled: false, reason: "Requires verified HIPAA infrastructure and organizational approval." },
          },
          {
            organizationId,
            key: "workspace.manual_fallbacks",
            value: { enabled: true, vendorConnections: "pending_connection", syntheticDataOnly: true },
          },
        ],
      });

      await tx.integration.createMany({
        data: pendingConnectorTemplates.map((connector) => ({
          organizationId,
          ...connector,
          status: "pending_connection",
          phase: "Credentials, contract, BAA, and verification pending",
          config: { manualFallbackAvailable: true, productionTransmissionEnabled: false },
        })),
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          type: "organization_onboarding_completed",
          description: `${input.organizationName} created a synthetic-data-only ClinicOS trial workspace.`,
          entityType: "organization",
          entityId: organizationId,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: userId,
          actorType: "user",
          action: "organization.onboarded",
          resourceType: "organization",
          resourceId: organizationId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: {
            clinicType: input.clinicType,
            locationId,
            roleKey: user.roleKey,
            trialEndsAt: trialEndsAt.toISOString(),
            syntheticDataOnly: true,
            paidConnectionsRequired: false,
          },
        },
      });

      const identity: AuthenticatedIdentity = {
        userId,
        organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        email: user.email,
        name: user.name,
        role: "clinic_owner",
        demo: false,
        source: "database",
      };

      return { identity, locationId, trialEndsAt };
    }, { timeout: 15_000 });
  } catch (error) {
    if (error instanceof OnboardingError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new OnboardingError("That email or organization workspace is already registered.", 409);
    }
    throw error;
  }
}
