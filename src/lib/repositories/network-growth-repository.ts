import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { deriveAcceptedRelationshipGaps } from "@/lib/network-invitation-continuity";
import {
  networkInvitationSchema,
  networkInvitationTransition,
  networkInvitationTransitionSchema,
} from "@/lib/network-growth-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function iso(value: Date | null | undefined) { return value?.toISOString() ?? null; }
function canManage(role: ClinicSession["role"]) { return can(role, "network", "manage"); }

export async function listNetworkGrowthWorkspace(session: ClinicSession) {
  if (!can(session.role, "network", "read")) throw new NetworkAccessError("Network access is not permitted for this role.", 403);
  const [invitations, acceptedRelationshipInvitations, organizations, facilities, providers, referrals, connections, audits] = await Promise.all([
    db.networkInvitation.findMany({ where: { OR: [{ invitingOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] }, include: { invitingOrganization: { select: { name: true } }, targetOrganization: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.networkInvitation.findMany({ where: { status: "accepted", OR: [{ invitingOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] }, select: { id: true, status: true, invitingOrganizationId: true, targetOrganizationId: true, inviteeName: true, inviteeType: true, specialty: true, invitingOrganization: { select: { name: true } }, targetOrganization: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }),
    db.organization.findMany({ where: { status: "active" }, select: { id: true, name: true, clinicType: true }, orderBy: { name: "asc" } }),
    db.facility.findMany({ where: { status: { in: ["active", "verified"] } }, select: { organizationId: true, specialty: true, address: true } }),
    db.provider.findMany({ where: { status: "active" }, select: { organizationId: true, specialty: true } }),
    db.referral.findMany({ where: { organizationId: session.organizationId }, select: { id: true, status: true, destinationOrganizationId: true, createdAt: true } }),
    db.networkConnection.findMany({ where: { OR: [{ sourceOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] }, select: { id: true, status: true, sourceOrganizationId: true, targetOrganizationId: true, updatedAt: true } }),
    db.auditLog.findMany({ where: { organizationId: session.organizationId, action: { startsWith: "network.growth" } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const specialtyCounts = new Map<string, number>();
  for (const provider of providers) if (provider.organizationId === session.organizationId && provider.specialty) specialtyCounts.set(provider.specialty, (specialtyCounts.get(provider.specialty) ?? 0) + 1);
  for (const facility of facilities) if (facility.organizationId === session.organizationId && facility.specialty) specialtyCounts.set(facility.specialty, (specialtyCounts.get(facility.specialty) ?? 0) + 1);
  const knownSpecialties = ["Cardiology", "Behavioral Health", "Orthopedics", "Imaging", "Laboratory", "Pharmacy"];
  const gaps = knownSpecialties.filter((specialty) => !specialtyCounts.has(specialty));
  const relationshipGaps = deriveAcceptedRelationshipGaps({
    currentOrganizationId: session.organizationId,
    invitations: acceptedRelationshipInvitations.map((invitation) => ({
      id: invitation.id,
      status: invitation.status,
      invitingOrganizationId: invitation.invitingOrganizationId,
      targetOrganizationId: invitation.targetOrganizationId,
      invitingOrganizationName: invitation.invitingOrganization.name,
      targetOrganizationName: invitation.targetOrganization?.name ?? null,
      inviteeName: invitation.inviteeName,
      inviteeType: invitation.inviteeType,
      specialty: invitation.specialty,
    })),
    connections,
  });
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "network.growth_accessed", resourceType: "network_growth", resourceId: session.organizationId, metadata: { invitationCount: invitations.length, activeConnections: connections.filter((connection) => connection.status === "active").length, relationshipSetupNeeded: relationshipGaps.length } } });
  return {
    currentOrganizationId: session.organizationId,
    invitations: invitations.map((invitation) => ({ id: invitation.id, inviteeType: invitation.inviteeType, inviteeName: invitation.inviteeName, inviteeEmail: invitation.inviteeEmail, specialty: invitation.specialty, location: invitation.location, status: invitation.status, notes: invitation.notes, invitingOrganization: invitation.invitingOrganization.name, targetOrganization: invitation.targetOrganization?.name ?? null, invitingOrganizationId: invitation.invitingOrganizationId, targetOrganizationId: invitation.targetOrganizationId, expiresAt: iso(invitation.expiresAt), createdAt: invitation.createdAt.toISOString(), updatedAt: invitation.updatedAt.toISOString() })),
    organizations: organizations.filter((organization) => organization.id !== session.organizationId).map((organization) => ({ ...organization })),
    relationshipGaps,
    insights: { activeConnections: connections.filter((connection) => connection.status === "active").length, pendingConnections: connections.filter((connection) => connection.status === "pending").length, sentInvitations: invitations.filter((invitation) => invitation.invitingOrganizationId === session.organizationId).length, pendingInvitations: invitations.filter((invitation) => ["sent", "pending_verification", "verified"].includes(invitation.status)).length, acceptedInvitations: acceptedRelationshipInvitations.length, relationshipSetupNeeded: relationshipGaps.length, referralCount: referrals.length, connectedReferralCount: referrals.filter((referral) => referral.destinationOrganizationId).length, specialtyGaps: gaps, coverageOrganizations: new Set(facilities.filter((facility) => facility.organizationId === session.organizationId).map((facility) => facility.organizationId)).size + 1 },
    auditHistory: audits.map((audit) => ({ id: audit.id, action: audit.action, createdAt: audit.createdAt.toISOString() })),
  };
}

export type NetworkGrowthWorkspace = Awaited<ReturnType<typeof listNetworkGrowthWorkspace>>;

export async function createNetworkInvitation(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "network", "create")) throw new NetworkAccessError("Network invitation creation is not permitted for this role.", 403);
  const input = networkInvitationSchema.parse(rawInput);
  const invitation = await db.$transaction(async (tx) => {
    if (input.targetOrganizationId) {
      const target = await tx.organization.findFirst({ where: { id: input.targetOrganizationId, status: "active" }, select: { id: true } });
      if (!target || target.id === session.organizationId) throw new NetworkAccessError("Target organization is not valid for this invitation.", 400);
    }
    const created = await tx.networkInvitation.create({ data: { invitingOrganizationId: session.organizationId, targetOrganizationId: input.targetOrganizationId ?? null, inviteeType: input.inviteeType, inviteeName: input.inviteeName, inviteeEmail: input.inviteeEmail ?? null, specialty: input.specialty ?? null, location: input.location ?? null, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, notes: input.notes ?? null, status: input.targetOrganizationId ? "sent" : "pending_verification", requestedBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "network.growth_invitation_created", resourceType: "network_invitation", resourceId: created.id, metadata: { inviteeType: created.inviteeType, targetOrganizationId: created.targetOrganizationId, manualFallback: !created.targetOrganizationId } } });
    return created;
  });
  return invitation;
}

export async function transitionNetworkInvitation(session: ClinicSession, invitationId: string, rawInput: unknown) {
  const input = networkInvitationTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const invitationLockKey = `network-invitation:${invitationId}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${invitationLockKey}, 0))`;
    const invitation = await tx.networkInvitation.findFirst({ where: { id: invitationId, OR: [{ invitingOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] } });
    if (!invitation) throw new NetworkAccessError("Network invitation not found for this organization.", 404);
    const sourceSide = invitation.invitingOrganizationId === session.organizationId;
    const targetSide = invitation.targetOrganizationId === session.organizationId;
    if (input.action === "accept" && !invitation.targetOrganizationId) throw new NetworkAccessError("An external invitation must be linked to the receiving organization before it can be accepted.", 409);
    if (input.action === "accept" && !targetSide) throw new NetworkAccessError("Only the invited organization can accept this invitation.", 403);
    if (["verify", "cancel", "suspend", "restore"].includes(input.action) && (!sourceSide || !canManage(session.role))) throw new NetworkAccessError("Only the inviting clinic administrator can perform this transition.", 403);
    if (input.action === "reject" && !sourceSide && !targetSide) throw new NetworkAccessError("Invitation access is not permitted.", 403);
    const status = networkInvitationTransition(invitation.status, input.action);
    if (!status) throw new NetworkAccessError(`Cannot ${input.action} a ${invitation.status} invitation.`, 409);
    const now = new Date();
    if (input.action === "accept" && invitation.expiresAt && invitation.expiresAt <= now) {
      throw new NetworkAccessError("This invitation expired before it was accepted.", 409);
    }
    const updated = await tx.networkInvitation.update({ where: { id: invitation.id }, data: { status, verifiedBy: input.action === "verify" ? session.userId : invitation.verifiedBy, verifiedAt: input.action === "verify" ? now : invitation.verifiedAt, acceptedBy: input.action === "accept" ? session.userId : invitation.acceptedBy, acceptedAt: input.action === "accept" ? now : invitation.acceptedAt, rejectedBy: input.action === "reject" ? session.userId : invitation.rejectedBy, rejectedAt: input.action === "reject" ? now : invitation.rejectedAt, notes: input.note } });
    const organizations = [...new Set([invitation.invitingOrganizationId, invitation.targetOrganizationId].filter(Boolean) as string[])];
    await tx.auditLog.createMany({ data: organizations.map((organizationId) => ({ organizationId, actorId: session.userId, actorType: "user", action: `network.growth_invitation_${input.action}d`, resourceType: "network_invitation", resourceId: invitation.id, changes: { status: { from: invitation.status, to: updated.status } }, metadata: { note: input.note, representedOrganizationId: session.organizationId } })) });
    return updated;
  });
}
