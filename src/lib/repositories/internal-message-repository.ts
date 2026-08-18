import "server-only";

import { MessageDirection } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import type { CreateInternalMessageInput, CreateInternalThreadInput } from "@/lib/internal-message-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export async function listInternalMessagingWorkspace(session: ClinicSession) {
  if (!can(session.role, "messages", "read")) throw new NetworkAccessError("Message access is not permitted for this role.", 403);

  const threads = await db.messageThread.findMany({
    where: { organizationId: session.organizationId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const patientIds = [...new Set(threads.map((thread) => thread.patientId).filter((value): value is string => Boolean(value)))];
  const authorIds = [...new Set(threads.flatMap((thread) => thread.messages.map((message) => message.createdBy)).filter((value): value is string => Boolean(value)))];
  const [patients, authors, patientOptions] = await Promise.all([
    patientIds.length ? db.patient.findMany({ where: { organizationId: session.organizationId, id: { in: patientIds } }, select: { id: true, firstName: true, lastName: true, mrn: true } }) : Promise.resolve([]),
    authorIds.length ? db.user.findMany({ where: { organizationId: session.organizationId, id: { in: authorIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    can(session.role, "messages", "create") ? db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }) : Promise.resolve([]),
  ]);

  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const authorsById = new Map(authors.map((author) => [author.id, author.name]));

  return {
    canCreate: can(session.role, "messages", "create"),
    patients: patientOptions.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })),
    threads: threads.map((thread) => {
      const patient = thread.patientId ? patientsById.get(thread.patientId) : undefined;
      return {
        id: thread.id,
        subject: thread.subject ?? "Internal coordination",
        category: thread.category,
        status: thread.status,
        riskLevel: thread.riskLevel,
        requiresHumanReview: thread.requiresHumanReview,
        assignedTeam: thread.assignedTeam,
        patientId: thread.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Organization thread",
        patientMrn: patient?.mrn ?? null,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        messages: thread.messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          channel: message.channel,
          body: message.body,
          riskLevel: message.riskLevel,
          requiresHumanReview: message.requiresHumanReview,
          approvedBy: message.approvedBy,
          sentAt: message.sentAt?.toISOString() ?? null,
          createdAt: message.createdAt.toISOString(),
          createdBy: message.createdBy,
          authorName: message.createdBy ? authorsById.get(message.createdBy) ?? "Team member" : "System",
        })),
      };
    }),
  };
}

export type InternalMessagingWorkspace = Awaited<ReturnType<typeof listInternalMessagingWorkspace>>;

export async function createInternalThread(session: ClinicSession, input: CreateInternalThreadInput) {
  if (!can(session.role, "messages", "create")) throw new NetworkAccessError("Message creation permission is required.", 403);

  return db.$transaction(async (tx) => {
    const patient = input.patientId
      ? await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } })
      : null;
    if (input.patientId && !patient) throw new NetworkAccessError("Patient not found for this organization.", 404);

    const thread = await tx.messageThread.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient?.id ?? null,
        subject: input.subject,
        category: input.category,
        assignedTeam: input.assignedTeam || null,
        status: "open",
      },
    });
    const now = new Date();
    const message = await tx.message.create({
      data: {
        organizationId: session.organizationId,
        threadId: thread.id,
        patientId: patient?.id ?? null,
        direction: MessageDirection.INTERNAL,
        channel: "klinikos_internal",
        body: input.body,
        createdBy: session.userId,
        sentAt: now,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "message_thread.internal_created",
        resourceType: "message_thread",
        resourceId: thread.id,
        patientId: patient?.id ?? null,
        metadata: { messageId: message.id, channel: "klinikos_internal", assignedTeam: input.assignedTeam ?? null },
      },
    });
    return { threadId: thread.id, messageId: message.id };
  });
}

export async function createInternalMessage(session: ClinicSession, threadId: string, input: CreateInternalMessageInput) {
  if (!can(session.role, "messages", "create")) throw new NetworkAccessError("Message creation permission is required.", 403);

  return db.$transaction(async (tx) => {
    const thread = await tx.messageThread.findFirst({ where: { id: threadId, organizationId: session.organizationId }, select: { id: true, patientId: true } });
    if (!thread) throw new NetworkAccessError("Message thread not found for this organization.", 404);

    const now = new Date();
    const message = await tx.message.create({
      data: {
        organizationId: session.organizationId,
        threadId: thread.id,
        patientId: thread.patientId,
        direction: MessageDirection.INTERNAL,
        channel: "klinikos_internal",
        body: input.body,
        createdBy: session.userId,
        sentAt: now,
      },
    });
    await tx.messageThread.update({ where: { id: thread.id }, data: { status: "open" } });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "message.internal_created",
        resourceType: "message",
        resourceId: message.id,
        patientId: thread.patientId,
        metadata: { threadId: thread.id, channel: "klinikos_internal" },
      },
    });
    return { messageId: message.id };
  });
}
