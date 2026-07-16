import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import {
  canManageNetworkConnections,
  connectionTransition,
  createNetworkConnectionSchema,
  transitionNetworkConnectionSchema,
} from "@/lib/network-directory-rules";

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
      select: { id: true, sourceOrganizationId: true, targetOrganizationId: true, status: true, trustLevel: true, allowedPurposes: true, requestedBy: true, approvedBy: true, activatedAt: true, suspendedAt: true, updatedAt: true },
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
              allowedPurposes: connection.allowedPurposes,
              requestedBy: connection.requestedBy,
              approvedBy: connection.approvedBy,
              activatedAt: connection.activatedAt?.toISOString() ?? null,
              suspendedAt: connection.suspendedAt?.toISOString() ?? null,
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

export async function createNetworkConnection(session: ClinicSession, rawInput: unknown) {
  const input = createNetworkConnectionSchema.parse(rawInput);
  if (input.targetOrganizationId === session.organizationId) throw new NetworkAccessError("A clinic cannot connect to itself.", 400);

  return db.$transaction(async (tx) => {
    const target = await tx.organization.findFirst({ where: { id: input.targetOrganizationId, status: "active" }, select: { id: true, name: true } });
    if (!target) throw new NetworkAccessError("The target clinic is not an active participating organization.", 404);

    const existing = await tx.networkConnection.findFirst({
      where: {
        OR: [
          { sourceOrganizationId: session.organizationId, targetOrganizationId: target.id },
          { sourceOrganizationId: target.id, targetOrganizationId: session.organizationId },
        ],
      },
    });
    if (existing) throw new NetworkAccessError(`A ${existing.status} relationship already exists with this clinic.`, 409);

    const connection = await tx.networkConnection.create({
      data: {
        sourceOrganizationId: session.organizationId,
        targetOrganizationId: target.id,
        status: "pending",
        trustLevel: "standard",
        allowedPurposes: input.allowedPurposes,
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
        metadata: { representedOrganizationId: session.organizationId, targetOrganizationId: target.id, allowedPurposes: input.allowedPurposes },
      })),
    });
    return connection;
  });
}

export async function transitionNetworkConnection(session: ClinicSession, connectionId: string, rawInput: unknown) {
  const input = transitionNetworkConnectionSchema.parse(rawInput);
  if (!canManageNetworkConnections(session.role)) throw new NetworkAccessError("Only clinic owners and administrators can manage network relationships.", 403);

  return db.$transaction(async (tx) => {
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
