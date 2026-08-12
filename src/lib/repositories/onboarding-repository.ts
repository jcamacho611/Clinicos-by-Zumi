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

export type ProvisionedWorkspaceInput = {
  organizationId: string;
  email: string;
  ownerName: string;
  password: string;
  clinicType: string;
  locationName: string;
  city: string;
  state: string;
  timezone: string;
  teamSize: string;
  primaryGoal: string;
  currentSystems: string;
  migrationExpectation: string;
  communicationsState: string;
};

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
      : `Default Klinikos ${roleLabel(key)} role.`,
  }));
}

async function createRolePermissionFoundation(tx: Prisma.TransactionClient, organizationId: string) {
  const roles = roleRecords(organizationId);
  await tx.role.createMany({ data: roles });
  await tx.permission.createMany({
    data: roles.flatMap((role) => clinicResources.flatMap((resource) => clinicActions
      .filter((action) => can(role.key, resource, action))
      .map((action) => ({ roleId: role.id, resource, action, allowed: true })))),
  });
}

/**
 * Legacy synthetic workspace creation. The HTTP route that calls this is disabled in
 * production unless an explicit non-production synthetic-workspace flag is enabled.
 * Paid/provisioned customers use completeProvisionedOrganizationWorkspace below.
 */
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

      const organization = await tx.organization.create({
        data: { id: organizationId, name: input.organizationName, slug, clinicType: input.clinicType, status: "active", demoMode: true },
      });

      await tx.location.create({
        data: { id: locationId, organizationId, name: input.locationName, timezone: input.timezone, address: { city: input.city, state: input.state, country: "US" } },
      });
      await tx.department.createMany({ data: [{ organizationId, locationId, name: "Clinical Care" }, { organizationId, locationId, name: "Practice Operations" }] });

      const user = await tx.user.create({
        data: { id: userId, organizationId, email: input.email, name: input.ownerName, roleKey: "clinic_owner", authCredential: { create: { passwordHash } } },
      });

      await createRolePermissionFoundation(tx, organizationId);
      await tx.appointmentType.createMany({ data: defaultAppointmentTypes.map((appointmentType) => ({ organizationId, ...appointmentType })) });

      // Synthetic development workspaces may exercise product UI, but their trial is
      // deliberately empty of paid commercial modules. Variable-cost services still
      // require their own funded allowance and connector readiness.
      await tx.clinicSubscription.create({
        data: { organizationId, planKey: "synthetic-demo", status: "trialing", modules: [], trialEndsAt },
      });

      await tx.setting.createMany({
        data: [
          { organizationId, key: "onboarding.profile", value: { teamSize: input.teamSize, primaryGoal: input.primaryGoal, completedSteps: ["organization", "owner", "workspace"], mode: "synthetic_demo" } },
          { organizationId, key: "compliance.phi_mode", value: { enabled: false, reason: "Requires verified HIPAA infrastructure and organizational approval." } },
          { organizationId, key: "workspace.manual_fallbacks", value: { enabled: true, vendorConnections: "pending_connection", syntheticDataOnly: true } },
        ],
      });

      await tx.integration.createMany({
        data: pendingConnectorTemplates.map((connector) => ({ organizationId, ...connector, status: "pending_connection", phase: "Credentials, contract, BAA, and verification pending", config: { manualFallbackAvailable: true, productionTransmissionEnabled: false } })),
      });

      await tx.activityLog.create({ data: { organizationId, userId, type: "organization_onboarding_completed", description: `${input.organizationName} created a synthetic-data-only Klinikos development workspace.`, entityType: "organization", entityId: organizationId } });
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: userId,
          actorType: "user",
          action: "organization.synthetic_workspace_created",
          resourceType: "organization",
          resourceId: organizationId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: { clinicType: input.clinicType, locationId, roleKey: user.roleKey, trialEndsAt: trialEndsAt.toISOString(), syntheticDataOnly: true, productionAccessActivated: false },
        },
      });

      const identity: AuthenticatedIdentity = { userId, organizationId, organizationName: organization.name, organizationSlug: organization.slug, email: user.email, name: user.name, role: "clinic_owner", demo: true, source: "database" };
      return { identity, locationId, trialEndsAt };
    }, { timeout: 15_000 });
  } catch (error) {
    if (error instanceof OnboardingError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new OnboardingError("That email or organization workspace is already registered.", 409);
    throw error;
  }
}

/**
 * Finish a clinic workspace only after the commercial layer has already created the
 * organization shell and activated a paid subscription. No subscription or payment
 * truth is accepted from this input.
 */
export async function completeProvisionedOrganizationWorkspace(input: ProvisionedWorkspaceInput, metadata: OnboardingMetadata) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hash(input.password, 12);

  try {
    return await db.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({ where: { id: input.organizationId }, select: { id: true, name: true, slug: true, status: true, demoMode: true } });
      if (!organization || organization.status !== "active") throw new OnboardingError("This activation link is not attached to an active Klinikos organization.", 409);

      const paidRows = await tx.$queryRaw<Array<{ id: string; paymentConfirmedAt: Date | null }>>(Prisma.sql`
        SELECT "id", "paymentConfirmedAt"
        FROM "subscriptions"
        WHERE "organizationId" = ${organization.id}
          AND "status" = 'active'
          AND ("currentPeriodEndsAt" IS NULL OR "currentPeriodEndsAt" > CURRENT_TIMESTAMP)
        ORDER BY "createdAt" DESC
        LIMIT 1
        FOR SHARE
      `);
      if (!paidRows[0]?.paymentConfirmedAt) throw new OnboardingError("Paid Klinikos access has not been confirmed for this organization.", 409);

      const existingEmail = await tx.user.findUnique({ where: { email }, select: { id: true, organizationId: true, status: true } });
      if (existingEmail) {
        if (existingEmail.organizationId === organization.id && existingEmail.status === "active") {
          throw new OnboardingError("This activation has already been completed. Sign in instead.", 409);
        }
        throw new OnboardingError("An account already exists for this email. Contact Klinikos support before continuing.", 409);
      }

      const userId = randomUUID();
      const locationId = randomUUID();
      await tx.organization.update({ where: { id: organization.id }, data: { clinicType: input.clinicType, demoMode: false } });
      await tx.location.create({ data: { id: locationId, organizationId: organization.id, name: input.locationName, timezone: input.timezone, address: { city: input.city, state: input.state, country: "US" } } });
      await tx.department.createMany({ data: [{ organizationId: organization.id, locationId, name: "Clinical Care" }, { organizationId: organization.id, locationId, name: "Practice Operations" }] });

      const user = await tx.user.create({ data: { id: userId, organizationId: organization.id, email, name: input.ownerName, roleKey: "clinic_owner", authCredential: { create: { passwordHash } } } });
      await createRolePermissionFoundation(tx, organization.id);
      await tx.appointmentType.createMany({ data: defaultAppointmentTypes.map((appointmentType) => ({ organizationId: organization.id, ...appointmentType })) });

      await tx.setting.createMany({
        data: [
          { organizationId: organization.id, key: "onboarding.profile", value: { teamSize: input.teamSize, primaryGoal: input.primaryGoal, currentSystems: input.currentSystems, migrationExpectation: input.migrationExpectation, communicationsState: input.communicationsState, completedSteps: ["commercial_access", "organization", "owner", "location", "systems", "workspace"], mode: "paid_activation" } },
          { organizationId: organization.id, key: "compliance.phi_mode", value: { enabled: false, reason: "Production patient-data use requires separate infrastructure, contractual, security, and organizational approval." } },
          { organizationId: organization.id, key: "workspace.manual_fallbacks", value: { enabled: true, vendorConnections: "pending_connection", syntheticDataOnly: true, note: "Paid software access does not itself approve production PHI use." } },
        ],
      });
      await tx.integration.createMany({ data: pendingConnectorTemplates.map((connector) => ({ organizationId: organization.id, ...connector, status: "pending_connection", phase: "Credentials, contract, BAA, enrollment, and verification pending", config: { manualFallbackAvailable: true, productionTransmissionEnabled: false } })) });

      await tx.activityLog.create({ data: { organizationId: organization.id, userId, type: "organization_onboarding_completed", description: `${organization.name} completed paid Klinikos workspace activation.`, entityType: "organization", entityId: organization.id } });
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorId: userId,
          actorType: "user",
          action: "organization.paid_activation_completed",
          resourceType: "organization",
          resourceId: organization.id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: { locationId, roleKey: user.roleKey, syntheticDataOnlyUntilProductionReview: true, onboardingComplete: true },
        },
      });

      const identity: AuthenticatedIdentity = { userId, organizationId: organization.id, organizationName: organization.name, organizationSlug: organization.slug, email: user.email, name: user.name, role: "clinic_owner", demo: false, source: "database" };
      return { identity, locationId };
    }, { timeout: 15_000 });
  } catch (error) {
    if (error instanceof OnboardingError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new OnboardingError("This activation has already been completed or conflicts with an existing account.", 409);
    throw error;
  }
}
