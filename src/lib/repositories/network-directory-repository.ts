import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { acceptedInvitationCounterpart } from "@/lib/network-invitation-continuity";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import {
  canManageNetworkConnections,
  connectionTransition,
  createInvitationNetworkConnectionSchema,
  createNetworkConnectionSchema,
  transitionNetworkConnectionSchema,
} from "@/lib/network-directory-rules";

type Transaction = Prisma.TransactionClient;

export async function listNetworkDirectory(organizationId: string) {
  const [organizations, locations, departments, facilities, providers, connections, agreements, integrations, events] = await Promise.all([
    db.organization.findMany({
      where: { status: "active" },
      select: { id: true, name: true, slug: true, clinicType: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      where: { status: "active" },
      select: { id: true, organizationId: true, name: true, address: true, timezone: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.department.findMany({
      where: { status: "active" },
      select: { id: true, organizationId: true, locationId: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.facility.findMany({
      where: { status: { in: ["active", "verified", "pending"] } },
      select: { id: true, organizationId: true, locationId: true, name: true, type: true, npi: true, specialty: true, address: true, verifiedAt: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.provider.findMany({
      where: { status: "active" },
      select: { id: true, organizationId: true, name: true, credential: true, specialty: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.networkConnection.findMany({
      where: { OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }] },
      select: { id: true, sourceOrganizationId: true, targetOrganizationId: true, status: true, trustLevel: true, relationshipType: true, allowedPurposes: true, acceptedReferralTypes: true, services: true, capacityStatus: true, contactMethod: true, contactDetails: true, integrationStatus: true, manualFallbackMethod: true, consentRequiredCategories: true, requestedBy: true, approvedBy: true, activatedAt: true, suspendedAt: true, lastReviewedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.dataSharingAgreement.findMany({
      where: { OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }] },
      select: { id: true, sourceOrganizationId: true, targetOrganizationId: true, status: true, allowedPurposes: true, dataCategories: true, expiresAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.integration.findMany({
      where: { organizationId },
      select: { id: true, type: true, vendor: true, status: true, phase: true, riskLevel: true, baaRequired: true, lastSyncAt: true },
      orderBy: { type: "asc" },
    }),
    db.integrationEvent.findMany({
      where: { organizationId, status: { in: ["failed", "queued", "retrying"] } },
      select: { id: true, integrationId: true, resourceType: true, resourceId: true, eventType: true, status: true, errorCode: true, errorMessage: true, retryCount: true, nextRetryAt: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
  ]);

  const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const locationsByOrganization = new Map<string, typeof locations>();
  const departmentsByOrganization = new Map<string, typeof departments>();
  const facilitiesByOrganization = new Map<string, typeof facilities>();
  const providersByOrganization = new Map<string, typeof providers>();

  for (const location of locations) locationsByOrganization.set(location.organizationId, [...(locationsByOrganization.get(location.organizationId) ?? []), location]);
  for (const department of departments) departmentsByOrganization.set(department.organizationId, [...(departmentsByOrganization.get(department.organizationId) ?? []), department]);
  for (const facility of facilities) facilitiesByOrganization.set(facility.organizationId, [...(facilitiesByOrganization.get(facility.organizationId) ?? []), facility]);
  for (const provider of providers) providersByOrganization.set(provider.organizationId, [...(providersByOrganization.get(provider.organizationId) ?? []), provider]);

  const connectionByOrganization = new Map<string, (typeof connections)[number]>();
  for (const connection of connections) {
    const otherOrganizationId = connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId;
    if (!connectionByOrganization.has(otherOrganizationId)) connectionByOrganization.set(otherOrganizationId, connection);
  }

  return {
    currentOrganizationId: organizationId,
    organizations: organizations.map((organization) => {
      const connection = organization.id === organizationId ? null : connectionByOrganization.get(organization.id) ?? null;
      return {
        ...organization,
        isCurrent: organization.id === organizationId,
        locations: locationsByOrganization.get(organization.id) ?? [],
        departments: departmentsByOrganization.get(organization.id) ?? [],
        facilities: facilitiesByOrganization.get(organization.id) ?? [],
        providers: providersByOrganization.get(organization.id) ?? [],
        connection: connection
          ? {
              id: connection.id,
              direction: connection.sourceOrganizationId === organizationId ? "outbound" : "inbound",
              status: connection.status,
              trustLevel: connection.trustLevel,
              relationshipType: connection.relationshipType,
              allowedPurposes: connection.allowedPurposes,
              acceptedReferralTypes: connection.acceptedReferralTypes,
              services: connection.services,
              capacityStatus: connection.capacityStatus,
              contactMethod: connection.contactMethod,
              contactDetails: connection.contactDetails,
              integrationStatus: connection.integrationStatus,
              manualFallbackMethod: connection.manualFallbackMethod,
              consentRequiredCategories: connection.consentRequiredCategories,
              requestedBy: connection.requestedBy,
              approvedBy: connection.approvedBy,
              activatedAt: connection.activatedAt?.toISOString() ?? null,
              suspendedAt: connection.suspendedAt?.toISOString() ?? null,
              lastReviewedAt: connection.lastReviewedAt?.toISOString() ?? null,
            }
          : null,
      };
    }),
    agreements: agreements.map((agreement) => ({
      ...agreement,
      sourceName: organizationNames.get(agreement.sourceOrganizationId) ?? "Unknown organization",
      targetName: organizationNames.get(agreement.targetOrganizationId) ?? "Unknown organization",
      expiresAt: agreement.expiresAt?.toISOString() ?? null,
    })),
    integrations: integrations.map((integration) => ({
      ...integration,
      lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
    })),
    integrationEvents: events.map((event) => ({
      ...event,
      nextRetryAt: event.nextRetryAt?.toISOString() ?? null,
      occurredAt: event.occurredAt.toISOString(),
      integrationName: event.integrationId ? integrations.find((integration) => integration.id === event.integrationId)?.vendor ?? "Integration" : "Manual fallback",
    })),
  };
}

export type NetworkDirectoryWorkspace = Awaited<ReturnType<typeof listNetworkDirectory>>;

function requireNetworkConnectionCreatePermission(session: ClinicSession) {
  if (!can(session.role, "network", "create")) {
    throw new NetworkAccessError("Network relationship requests are not permitted for this role.", 403);
  }
}

async function createPendingNetworkConnection(
  tx: Transaction,
  session: ClinicSession,
  targetOrganizationId: string,
  allowedPurposes: string[],
  sourceInvitationId?: string,
) {
  if (targetOrganizationId === session.organizationId) {
    throw new NetworkAccessError("An organization cannot connect to itself.", 400);
  }

  const target = await tx.organization.findFirst({
    where: { id: targetOrganizationId, status: "active" },
    select: { id: true, name: true },
  });
  if (!target) throw new NetworkAccessError("The target organization is not an active participant.", 404);

  const relationshipPairKey = [session.organizationId, target.id].sort().join("|");
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${relationshipPairKey}, 0))`;

  const existing = await tx.networkConnection.findFirst({
    where: {
      OR: [
        { sourceOrganizationId: session.organizationId, targetOrganizationId: target.id },
        { sourceOrganizationId: target.id, targetOrganizationId: session.organizationId },
      ],
    },
  });
  if (existing) throw new NetworkAccessError(`A ${existing.status} relationship already exists with this organization.`, 409);

  const connection = await tx.networkConnection.create({
    data: {
      sourceOrganizationId: session.organizationId,
      targetOrganizationId: target.id,
      status: "pending",
      trustLevel: "unverified",
      allowedPurposes,
      requestedBy: session.userId,
    },
  });
  await tx.auditLog.createMany({
    data: [session.organizationId, target.id].map((organizationId) => ({
      organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "network.connection_requested",
      resourceType: "network_connection",
      resourceId: connection.id,
      metadata: {
        representedOrganizationId: session.organizationId,
        targetOrganizationId: target.id,
        allowedPurposes,
        ...(sourceInvitationId ? { sourceInvitationId } : {}),
      },
    })),
  });
  return connection;
}

export async function createNetworkConnection(session: ClinicSession, rawInput: unknown) {
  requireNetworkConnectionCreatePermission(session);
  const input = createNetworkConnectionSchema.parse(rawInput);
  return db.$transaction((tx) => createPendingNetworkConnection(
    tx,
    session,
    input.targetOrganizationId,
    input.allowedPurposes,
  ));
}

export async function createNetworkConnectionFromInvitation(
  session: ClinicSession,
  invitationId: string,
  rawInput: unknown,
) {
  requireNetworkConnectionCreatePermission(session);
  const input = createInvitationNetworkConnectionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const invitationLockKey = `network-invitation:${invitationId}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${invitationLockKey}, 0))`;
    const invitation = await tx.networkInvitation.findFirst({
      where: {
        id: invitationId,
        OR: [
          { invitingOrganizationId: session.organizationId },
          { targetOrganizationId: session.organizationId },
        ],
      },
      select: {
        id: true,
        status: true,
        invitingOrganizationId: true,
        targetOrganizationId: true,
      },
    });
    if (!invitation) throw new NetworkAccessError("Network invitation not found for this organization.", 404);

    const counterpartOrganizationId = acceptedInvitationCounterpart(invitation, session.organizationId);
    if (!counterpartOrganizationId) {
      throw new NetworkAccessError("Only an accepted invitation with a known organization can start relationship setup.", 409);
    }

    return createPendingNetworkConnection(
      tx,
      session,
      counterpartOrganizationId,
      input.allowedPurposes,
      invitation.id,
    );
  });
}

export async function transitionNetworkConnection(session: ClinicSession, connectionId: string, rawInput: unknown) {
  const input = transitionNetworkConnectionSchema.parse(rawInput);
  if (!canManageNetworkConnections(session.role)) throw new NetworkAccessError("Only clinic owners and administrators can manage network relationships.", 403);

  return db.$transaction(async (tx) => {
    const connectionLockKey = `network-connection:${connectionId}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${connectionLockKey}, 0))`;
    const connection = await tx.networkConnection.findFirst({
      where: { id: connectionId, OR: [{ sourceOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] },
    });
    if (!connection) throw new NetworkAccessError("Network relationship not found for this organization.", 404);
    if (input.action === "approve" && connection.targetOrganizationId !== session.organizationId) throw new NetworkAccessError("The receiving clinic must approve a connection request.", 403);
    const nextStatus = connectionTransition(connection.status, input.action);
    if (!nextStatus) throw new NetworkAccessError(`Cannot ${input.action} a ${connection.status} relationship.`, 409);

    const updated = await tx.networkConnection.update({
      where: { id: connection.id },
      data: {
        status: nextStatus,
        approvedBy: input.action === "approve" ? session.userId : connection.approvedBy,
        activatedAt: input.action === "approve" || input.action === "restore" ? new Date() : connection.activatedAt,
        suspendedAt: input.action === "suspend" ? new Date() : input.action === "restore" ? null : connection.suspendedAt,
      },
    });
    await tx.auditLog.createMany({
      data: [connection.sourceOrganizationId, connection.targetOrganizationId].map((organizationId) => ({
        organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `network.connection_${input.action}d`,
        resourceType: "network_connection",
        resourceId: connection.id,
        changes: { status: { from: connection.status, to: nextStatus } },
        metadata: { representedOrganizationId: session.organizationId, reason: input.reason },
      })),
    });
    return updated;
  });
}
