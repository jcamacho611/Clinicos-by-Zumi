import "server-only";

import { MessageDirection, type Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { addCareTeamMemberSchema, careTeamMemberTransitionSchema, careTeamMessageSchema, careTeamRoomTransitionSchema, createCareTeamSchema } from "@/lib/care-team-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) { return value?.toISOString() ?? null; }

async function requireRoom(tx: Transaction, session: ClinicSession, roomId: string) {
  const room = await tx.careTeamRoom.findFirst({
    where: { id: roomId, OR: [{ organizationId: session.organizationId }, { members: { some: { representedOrganizationId: session.organizationId, status: "active" } } }] },
    include: { patient: { select: { id: true, firstName: true, lastName: true, mrn: true } }, members: true },
  });
  if (!room) throw new NetworkAccessError("Care Team Room is not available to this organization.", 404);
  if (room.organizationId !== session.organizationId) {
    const connection = await tx.networkConnection.findFirst({ where: { status: "active", OR: [{ sourceOrganizationId: room.organizationId, targetOrganizationId: session.organizationId }, { sourceOrganizationId: session.organizationId, targetOrganizationId: room.organizationId }] }, select: { id: true } });
    if (!connection) throw new NetworkAccessError("An active network relationship is required for this Care Team Room.", 403);
  }
  return room;
}

function memberLabel(member: { role: string; status: string; accessLevel: string; providerId: string | null; userId: string | null; representedOrganizationId: string }, providers: Map<string, { name: string; credential: string }>, organizations: Map<string, string>) {
  const provider = member.providerId ? providers.get(member.providerId) : undefined;
  return { id: member.representedOrganizationId, organization: organizations.get(member.representedOrganizationId) ?? "Connected organization", role: member.role, status: member.status, accessLevel: member.accessLevel, provider: provider ? `${provider.name}, ${provider.credential}` : member.userId ? "Assigned user" : "Organization member" };
}

export async function listCareTeamWorkspace(session: ClinicSession) {
  if (!can(session.role, "care_teams", "read")) throw new NetworkAccessError("Care Team Room access is not permitted for this role.", 403);
  const rooms = await db.careTeamRoom.findMany({
    where: { OR: [{ organizationId: session.organizationId }, { members: { some: { representedOrganizationId: session.organizationId, status: "active" } } }] },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      members: true,
      messageThreads: { orderBy: { updatedAt: "desc" }, take: 1, include: { messages: { orderBy: { createdAt: "asc" }, take: 40, select: { id: true, body: true, direction: true, createdBy: true, createdAt: true, sentAt: true } } } },
      tasks: { orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 20, select: { id: true, title: true, details: true, status: true, priority: true, dueAt: true, ownerId: true, createdAt: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, name: true, categoryId: true, reviewStatus: true, releaseStatus: true, patientVisible: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const providerIds = [...new Set(rooms.flatMap((room) => room.members.map((member) => member.providerId).filter(Boolean) as string[]))];
  const organizationIds = [...new Set(rooms.flatMap((room) => [room.organizationId, ...room.members.map((member) => member.representedOrganizationId)]))];
  const [providers, organizations, audits] = await Promise.all([
    providerIds.length ? db.provider.findMany({ where: { id: { in: providerIds } }, select: { id: true, name: true, credential: true } }) : Promise.resolve([]),
    db.organization.findMany({ where: { id: { in: organizationIds } }, select: { id: true, name: true } }),
    rooms.length ? db.auditLog.findMany({ where: { organizationId: session.organizationId, resourceType: "care_team_room", resourceId: { in: rooms.map((room) => room.id) } }, orderBy: { createdAt: "desc" }, take: 50 }) : Promise.resolve([]),
  ]);
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization.name]));
  return {
    currentOrganizationId: session.organizationId,
    rooms: rooms.map((room) => ({
      id: room.id,
      organizationId: room.organizationId,
      name: room.name,
      sourceType: room.sourceType,
      status: room.status,
      patient: room.patient,
      sharedPlan: room.sharedPlan,
      members: room.members.map((member) => memberLabel(member, providerMap, organizationMap)),
      messages: room.messageThreads[0]?.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString(), sentAt: iso(message.sentAt) })) ?? [],
      tasks: room.tasks.map((task) => ({ ...task, dueAt: iso(task.dueAt), createdAt: task.createdAt.toISOString() })),
      documents: room.documents.map((document) => ({ ...document, createdAt: document.createdAt.toISOString() })),
      updatedAt: room.updatedAt.toISOString(),
    })),
    patients: await db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: { lastName: "asc" } }),
    organizations: await db.organization.findMany({ where: { status: "active", id: { not: session.organizationId } }, select: { id: true, name: true, clinicType: true }, orderBy: { name: "asc" } }),
    auditHistory: audits.map((audit) => ({ id: audit.id, action: audit.action, resourceId: audit.resourceId, createdAt: audit.createdAt.toISOString() })),
  };
}

export type CareTeamWorkspace = Awaited<ReturnType<typeof listCareTeamWorkspace>>;

export async function createCareTeamRoom(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "care_teams", "create")) throw new NetworkAccessError("Care Team Room creation is not permitted for this role.", 403);
  const input = createCareTeamSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } });
    if (!patient) throw new NetworkAccessError("Patient is not available for this organization.", 404);
    const provider = await tx.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, status: "active" }, select: { id: true } });
    const sharedPlan = input.sharedPlan ? JSON.parse(JSON.stringify(input.sharedPlan)) as Prisma.InputJsonObject : { goals: [], nextActions: [], humanReviewRequired: true };
    const room = await tx.careTeamRoom.create({ data: { organizationId: session.organizationId, patientId: patient.id, name: input.name, sourceType: input.sourceType, sharedPlan } });
    await tx.careTeamMember.create({ data: { careTeamRoomId: room.id, representedOrganizationId: session.organizationId, userId: session.userId, providerId: provider?.id, role: "care_coordinator", accessLevel: "care_coordination", status: "active", joinedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "care_team_room.created", resourceType: "care_team_room", resourceId: room.id, patientId: patient.id, metadata: { sourceType: input.sourceType, humanReviewRequired: true } } });
    return room;
  });
}

export async function addCareTeamMember(session: ClinicSession, roomId: string, rawInput: unknown) {
  if (!can(session.role, "care_teams", "manage")) throw new NetworkAccessError("Care Team Room membership management is not permitted for this role.", 403);
  const input = addCareTeamMemberSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const room = await tx.careTeamRoom.findFirst({ where: { id: roomId, organizationId: session.organizationId }, select: { id: true, patientId: true, organizationId: true } });
    if (!room) throw new NetworkAccessError("Only the owning organization can manage this Care Team Room.", 403);
    const organization = await tx.organization.findFirst({ where: { id: input.representedOrganizationId, status: "active" }, select: { id: true } });
    if (!organization) throw new NetworkAccessError("Represented organization is not active.", 404);
    if (input.representedOrganizationId !== session.organizationId) {
      const connection = await tx.networkConnection.findFirst({ where: { status: "active", OR: [{ sourceOrganizationId: session.organizationId, targetOrganizationId: input.representedOrganizationId }, { sourceOrganizationId: input.representedOrganizationId, targetOrganizationId: session.organizationId }] }, select: { id: true } });
      if (!connection) throw new NetworkAccessError("An active network relationship is required before inviting this organization.", 403);
    }
    if (input.providerId) {
      const provider = await tx.provider.findFirst({ where: { id: input.providerId, organizationId: input.representedOrganizationId, status: "active" }, select: { id: true } });
      if (!provider) throw new NetworkAccessError("Provider is not active in the represented organization.", 404);
    }
    const existing = await tx.careTeamMember.findFirst({ where: { careTeamRoomId: room.id, representedOrganizationId: input.representedOrganizationId, status: { in: ["invited", "active"] } }, select: { id: true } });
    if (existing) throw new NetworkAccessError("This organization already has a current Care Team Room membership.", 409);
    const member = await tx.careTeamMember.create({ data: { careTeamRoomId: room.id, representedOrganizationId: input.representedOrganizationId, providerId: input.providerId ?? null, userId: input.userId ?? null, role: input.role, accessLevel: input.accessLevel, status: input.representedOrganizationId === session.organizationId ? "active" : "invited", joinedAt: input.representedOrganizationId === session.organizationId ? new Date() : null } });
    if (input.userId && input.representedOrganizationId !== session.organizationId) await tx.notification.create({ data: { organizationId: input.representedOrganizationId, userId: input.userId, type: "care_team_invitation", title: "Care Team Room invitation", body: "A connected clinic invited you to review a minimum-necessary care coordination room." } });
    await tx.auditLog.createMany({ data: [room.organizationId, input.representedOrganizationId].filter((id, index, all) => all.indexOf(id) === index).map((organizationId) => ({ organizationId, actorId: session.userId, actorType: "user", action: "care_team_member.invited", resourceType: "care_team_room", resourceId: room.id, patientId: room.patientId, metadata: { memberId: member.id, representedOrganizationId: input.representedOrganizationId, accessLevel: input.accessLevel } })) });
    return member;
  });
}

export async function transitionCareTeamMember(session: ClinicSession, roomId: string, memberId: string, rawInput: unknown) {
  const input = careTeamMemberTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const room = await requireRoom(tx, session, roomId);
    const member = room.members.find((candidate) => candidate.id === memberId);
    if (!member) throw new NetworkAccessError("Care Team Room member is not available.", 404);
    const isOwner = room.organizationId === session.organizationId && can(session.role, "care_teams", "manage");
    const isTarget = member.representedOrganizationId === session.organizationId;
    if (input.action === "accept" && !isTarget) throw new NetworkAccessError("Only the represented organization can accept this membership.", 403);
    if (input.action !== "accept" && !isOwner) throw new NetworkAccessError("Only the owning clinic administrator can change this membership.", 403);
    const status = input.action === "accept" || input.action === "reinstate" ? "active" : "removed";
    const updated = await tx.careTeamMember.update({ where: { id: member.id }, data: { status, joinedAt: status === "active" ? member.joinedAt ?? new Date() : member.joinedAt, removedAt: status === "removed" ? new Date() : null } });
    await tx.auditLog.createMany({ data: [room.organizationId, member.representedOrganizationId].filter((id, index, all) => all.indexOf(id) === index).map((organizationId) => ({ organizationId, actorId: session.userId, actorType: "user", action: `care_team_member.${input.action}`, resourceType: "care_team_room", resourceId: room.id, patientId: room.patientId, changes: { status: { from: member.status, to: updated.status } }, metadata: { memberId: member.id, note: input.note } })) });
    return updated;
  });
}

export async function transitionCareTeamRoom(session: ClinicSession, roomId: string, rawInput: unknown) {
  if (!can(session.role, "care_teams", "manage")) throw new NetworkAccessError("Care Team Room management is not permitted for this role.", 403);
  const input = careTeamRoomTransitionSchema.parse(rawInput);
  const room = await db.careTeamRoom.findFirst({ where: { id: roomId, organizationId: session.organizationId } });
  if (!room) throw new NetworkAccessError("Care Team Room not found for this organization.", 404);
  const status = input.action === "close" ? "closed" : "active";
  return db.$transaction(async (tx) => {
    const updated = await tx.careTeamRoom.update({ where: { id: room.id }, data: { status } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `care_team_room.${input.action}`, resourceType: "care_team_room", resourceId: room.id, patientId: room.patientId, changes: { status: { from: room.status, to: status } }, metadata: { note: input.note } } });
    return updated;
  });
}

export async function createCareTeamMessage(session: ClinicSession, roomId: string, rawInput: unknown) {
  if (!can(session.role, "care_teams", "create")) throw new NetworkAccessError("Care Team Room messaging is not permitted for this role.", 403);
  const input = careTeamMessageSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const room = await requireRoom(tx, session, roomId);
    const member = room.members.find((candidate) => candidate.representedOrganizationId === session.organizationId && candidate.status === "active");
    if (room.organizationId !== session.organizationId && !member) throw new NetworkAccessError("An active Care Team Room membership is required to post a message.", 403);
    if (room.status !== "active") throw new NetworkAccessError("Closed Care Team Rooms cannot receive new messages.", 409);
    const thread = await tx.messageThread.findFirst({ where: { organizationId: room.organizationId, careTeamRoomId: room.id, status: "open" } }) ?? await tx.messageThread.create({ data: { organizationId: room.organizationId, patientId: room.patientId, careTeamRoomId: room.id, category: "care_team", subject: room.name, status: "open" } });
    const message = await tx.message.create({ data: { organizationId: room.organizationId, threadId: thread.id, patientId: room.patientId, direction: MessageDirection.INTERNAL, channel: "secure_care_team", body: input.body, createdBy: session.userId, sentAt: new Date() } });
    await tx.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    await tx.auditLog.createMany({ data: [room.organizationId, session.organizationId].filter((id, index, all) => all.indexOf(id) === index).map((organizationId) => ({ organizationId, actorId: session.userId, actorType: "user", action: "care_team_message.created", resourceType: "care_team_room", resourceId: room.id, patientId: room.patientId, metadata: { messageId: message.id, threadId: thread.id, minimumNecessary: true } })) });
    return message;
  });
}
