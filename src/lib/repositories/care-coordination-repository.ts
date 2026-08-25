import "server-only";

import { RiskLevel, type Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { createHandoffSchema, transitionEscalationSchema, transitionHandoffSchema, transitionTaskSchema } from "@/lib/care-coordination-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { resolveEscalationWaiting } from "@/lib/safety/escalation-waiting";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) { return value?.toISOString() ?? null; }
function riskForPriority(priority: string) { return priority === "urgent" ? RiskLevel.URGENT : priority === "needs_provider" || priority === "high" ? RiskLevel.NEEDS_PROVIDER : RiskLevel.NORMAL; }
function patientName(patient: { firstName: string; lastName: string } | undefined) { return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient"; }

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireHandoff(tx: Transaction, organizationId: string, handoffId: string) {
  const handoff = await tx.careHandoff.findFirst({ where: { id: handoffId, organizationId } });
  if (!handoff) throw new NetworkAccessError("Care handoff not found for this organization.", 404);
  return handoff;
}

export async function listCareCoordinationWorkspace(organizationId: string, userId?: string) {
  const [patients, providers, handoffs, tasks, escalations, notifications] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId, status: "active" }, select: { id: true, userId: true, name: true, credential: true, specialty: true }, orderBy: { name: "asc" } }),
    db.careHandoff.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.task.findMany({ where: { organizationId }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }], take: 100 }),
    db.escalation.findMany({ where: { organizationId }, orderBy: [{ status: "asc" }, { riskLevel: "desc" }, { createdAt: "desc" }], take: 100 }),
    userId ? db.notification.findMany({ where: { organizationId, userId }, orderBy: { createdAt: "desc" }, take: 50 }) : Promise.resolve([]),
  ]);
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const providerLabel = (id: string | null) => id && providersById.get(id) ? `${providersById.get(id)!.name}, ${providersById.get(id)!.credential}` : "Organization partner";
  return {
    patients,
    providers,
    handoffs: handoffs.map((handoff) => ({ ...handoff, patientName: patientName(patientsById.get(handoff.patientId)), patientMrn: patientsById.get(handoff.patientId)?.mrn ?? "Unknown MRN", senderName: providerLabel(handoff.senderId), receiverName: providerLabel(handoff.receiverId), dueAt: iso(handoff.dueAt), acknowledgedAt: iso(handoff.acknowledgedAt), resolvedAt: iso(handoff.resolvedAt), createdAt: handoff.createdAt.toISOString(), updatedAt: handoff.updatedAt.toISOString() })),
    tasks: tasks.map((task) => ({ ...task, patientName: task.patientId ? patientName(patientsById.get(task.patientId)) : "Organization task", dueAt: iso(task.dueAt), completedAt: iso(task.completedAt), createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() })),
    escalations: escalations.map((escalation) => ({
      ...escalation,
      patientName: escalation.patientId ? patientName(patientsById.get(escalation.patientId)) : "Organization escalation",
      // How long this has gone unacknowledged, computed here rather than stored, so the
      // queue shows silence rather than only showing what happened.
      waiting: resolveEscalationWaiting({ status: escalation.status, riskLevel: escalation.riskLevel, createdAt: escalation.createdAt }),
      reviewedAt: iso(escalation.reviewedAt),
      createdAt: escalation.createdAt.toISOString(),
      updatedAt: escalation.updatedAt.toISOString(),
    })),
    notifications: notifications.map((notification) => ({ ...notification, readAt: iso(notification.readAt), createdAt: notification.createdAt.toISOString(), updatedAt: notification.updatedAt.toISOString() })),
  };
}

export type CareCoordinationWorkspace = Awaited<ReturnType<typeof listCareCoordinationWorkspace>>;

export async function createCareHandoff(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "tasks", "create")) throw new NetworkAccessError("Care-handoff creation permission is required.", 403);
  const input = createHandoffSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    const receiver = await tx.provider.findFirst({ where: { id: input.receiverId, organizationId: session.organizationId, status: "active" }, select: { id: true, userId: true, name: true } });
    if (!receiver) throw new NetworkAccessError("Receiving clinician is not active in this organization.", 404);
    const sender = await tx.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, status: "active" }, select: { id: true } });
    const handoff = await tx.careHandoff.create({ data: { organizationId: session.organizationId, patientId: patient.id, senderId: sender?.id ?? session.userId, receiverId: receiver.id, type: input.type, summary: input.summary, requestedAction: input.requestedAction, priority: input.priority, dueAt: input.dueAt, status: "sent" } });
    const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient.id, category: "care_handoff", title: `Acknowledge ${input.type} handoff`, details: `handoff:${handoff.id} ${input.requestedAction}`, ownerId: receiver.userId, priority: input.priority === "needs_provider" ? "high" : input.priority, riskLevel: riskForPriority(input.priority), dueAt: input.dueAt, status: "open", createdBy: session.userId } });
    if (receiver.userId) await tx.notification.create({ data: { organizationId: session.organizationId, userId: receiver.userId, type: "care_handoff", title: `New ${input.type} handoff`, body: `${patient.firstName} ${patient.lastName}: ${input.requestedAction}` } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "care_handoff.created", resourceType: "care_handoff", resourceId: handoff.id, patientId: patient.id, metadata: { receiverId: receiver.id, taskId: task.id, type: input.type, priority: input.priority } } });
    return handoff;
  });
}

export async function transitionCareHandoff(session: ClinicSession, handoffId: string, rawInput: unknown) {
  if (!can(session.role, "tasks", "update")) throw new NetworkAccessError("Care-handoff transition permission is required.", 403);
  const input = transitionHandoffSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const handoff = await requireHandoff(tx, session.organizationId, handoffId);
    const nextStatus = input.action === "acknowledge" ? "acknowledged" : input.action === "reject" ? "rejected" : input.action === "clarify" ? "clarification_requested" : input.action === "resolve" ? "resolved" : handoff.status;
    const updated = input.action === "escalate"
      ? handoff
      : await tx.careHandoff.update({ where: { id: handoff.id }, data: { status: nextStatus, acknowledgedAt: input.action === "acknowledge" ? new Date() : handoff.acknowledgedAt, resolvedAt: input.action === "resolve" ? new Date() : handoff.resolvedAt } });
    if (input.action === "escalate") await tx.escalation.create({ data: { organizationId: session.organizationId, patientId: handoff.patientId, sourceType: "care_handoff", sourceId: handoff.id, category: "overdue_care_handoff", riskLevel: RiskLevel.URGENT, assignedTeam: "clinical_provider", status: "open" } });
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: "care_handoff", details: { contains: `handoff:${handoff.id}` } }, data: { status: input.action === "resolve" ? "completed" : "open", completedAt: input.action === "resolve" ? new Date() : null } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `care_handoff.${input.action}`, resourceType: "care_handoff", resourceId: handoff.id, patientId: handoff.patientId, changes: { status: { from: handoff.status, to: nextStatus } }, metadata: { note: input.note, escalationCreated: input.action === "escalate" } } });
    return updated;
  });
}

export async function transitionTask(session: ClinicSession, taskId: string, rawInput: unknown) {
  if (!can(session.role, "tasks", "update")) throw new NetworkAccessError("Task transition permission is required.", 403);
  const input = transitionTaskSchema.parse(rawInput);
  const task = await db.task.findFirst({ where: { id: taskId, organizationId: session.organizationId } });
  if (!task) throw new NetworkAccessError("Task not found for this organization.", 404);
  const updated = await db.$transaction(async (tx) => {
    const result = await tx.task.update({ where: { id: task.id }, data: { status: input.action === "complete" ? "completed" : "open", completedAt: input.action === "complete" ? new Date() : null } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `task.${input.action}`, resourceType: "task", resourceId: task.id, patientId: task.patientId, changes: { status: { from: task.status, to: result.status } }, metadata: { note: input.note } } });
    return result;
  });
  return updated;
}

export async function transitionEscalation(session: ClinicSession, escalationId: string, rawInput: unknown) {
  if (!can(session.role, "escalations", "update")) throw new NetworkAccessError("Escalation transition permission is required.", 403);
  const input = transitionEscalationSchema.parse(rawInput);
  const escalation = await db.escalation.findFirst({ where: { id: escalationId, organizationId: session.organizationId } });
  if (!escalation) throw new NetworkAccessError("Escalation not found for this organization.", 404);
  const nextStatus = input.action === "acknowledge" ? "in_review" : input.action === "resolve" ? "resolved" : "open";
  return db.$transaction(async (tx) => {
    const updated = await tx.escalation.update({ where: { id: escalation.id }, data: { status: nextStatus, reviewedBy: session.userId, reviewedAt: new Date(), resolution: input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `escalation.${input.action}`, resourceType: "escalation", resourceId: escalation.id, patientId: escalation.patientId, changes: { status: { from: escalation.status, to: nextStatus } }, metadata: { note: input.note } } });
    return updated;
  });
}
