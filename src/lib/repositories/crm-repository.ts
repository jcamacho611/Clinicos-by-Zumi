import "server-only";

import { MessageDirection } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { createLeadMessageSchema, createLeadSchema, leadValueDollars, transitionLeadSchema } from "@/lib/crm-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function dateOrNull(value?: string | null) { return value ? new Date(value) : null; }
function isCancellationObserved(lead: { bookingStatus: string }) { return lead.bookingStatus === "cancellation_observed"; }
function countsAsBookedEstimate(lead: { status: string; bookingStatus: string }) { return !isCancellationObserved(lead) && ["booked", "completed"].includes(lead.status); }

export async function listCRMWorkspace(session: ClinicSession) {
  if (!can(session.role, "crm", "read")) throw new NetworkAccessError("CRM access is not permitted for this role.", 403);
  const [leads, tasks, messages] = await Promise.all([
    db.lead.findMany({ where: { organizationId: session.organizationId }, include: { patient: { select: { firstName: true, lastName: true, mrn: true } } }, orderBy: [{ status: "asc" }, { followUpDueAt: "asc" }, { updatedAt: "desc" }], take: 200 }),
    db.task.findMany({ where: { organizationId: session.organizationId, category: { in: ["lead_follow_up", "lead_reactivation", "lead_booking"] } }, orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 100 }),
    db.message.findMany({ where: { organizationId: session.organizationId, leadId: { not: null } }, orderBy: { createdAt: "desc" }, take: 120 }),
  ]);
  const now = new Date();
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "crm.workspace_accessed", resourceType: "crm_workspace", resourceId: session.organizationId, metadata: { leadCount: leads.length, openLeadCount: leads.filter((lead) => !["lost", "completed"].includes(lead.status)).length } } });
  const leadViews = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    campaignSource: lead.campaignSource,
    serviceInterest: lead.serviceInterest,
    appointmentInterest: lead.appointmentInterest,
    estimatedValueCents: lead.estimatedValueCents,
    estimatedValue: leadValueDollars(lead.estimatedValueCents),
    pipelineStage: lead.pipelineStage,
    status: lead.status,
    assignedTo: lead.assignedTo,
    followUpDueAt: lead.followUpDueAt?.toISOString() ?? null,
    overdue: Boolean(lead.followUpDueAt && lead.followUpDueAt < now && (isCancellationObserved(lead) || !["lost", "completed", "booked"].includes(lead.status))),
    contactAttempts: lead.contactAttempts,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    bookingStatus: lead.bookingStatus,
    paymentStatus: lead.paymentStatus,
    formStatus: lead.formStatus,
    lostReason: lead.lostReason,
    notes: lead.notes,
    patient: lead.patient ? { name: `${lead.patient.firstName} ${lead.patient.lastName}`, mrn: lead.patient.mrn } : null,
    updatedAt: lead.updatedAt.toISOString(),
  }));
  return {
    leads: leadViews,
    tasks: tasks.map((task) => ({ id: task.id, title: task.title, details: task.details, status: task.status, priority: task.priority, dueAt: task.dueAt?.toISOString() ?? null })),
    messages: messages.map((message) => ({ id: message.id, leadId: message.leadId, channel: message.channel, body: message.body, direction: message.direction, sentAt: message.sentAt?.toISOString() ?? null, createdAt: message.createdAt.toISOString() })),
    metrics: {
      openLeads: leadViews.filter((lead) => !["lost", "completed"].includes(lead.status)).length,
      followUpsDue: leadViews.filter((lead) => lead.overdue || (lead.followUpDueAt && new Date(lead.followUpDueAt).toDateString() === now.toDateString())).length,
      booked: leadViews.filter(countsAsBookedEstimate).length,
      estimatedPipelineCents: leadViews.filter((lead) => !["lost", "completed"].includes(lead.status)).reduce((sum, lead) => sum + lead.estimatedValueCents, 0),
      bookedEstimatedCents: leadViews.filter(countsAsBookedEstimate).reduce((sum, lead) => sum + lead.estimatedValueCents, 0),
      lostEstimatedCents: leadViews.filter((lead) => lead.status === "lost").reduce((sum, lead) => sum + lead.estimatedValueCents, 0),
      cancellationReviewEstimatedCents: leadViews.filter((lead) => isCancellationObserved(lead)).reduce((sum, lead) => sum + lead.estimatedValueCents, 0),
    },
  };
}

export type CRMWorkspace = Awaited<ReturnType<typeof listCRMWorkspace>>;

export async function createLead(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "crm", "create")) throw new NetworkAccessError("Lead creation is not permitted for this role.", 403);
  const input = createLeadSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    if (input.patientId) {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } });
      if (!patient) throw new NetworkAccessError("Patient link is not valid for this organization.", 404);
    }
    if (input.assignedTo) {
      const user = await tx.user.findFirst({ where: { id: input.assignedTo, organizationId: session.organizationId, status: "active" }, select: { id: true } });
      if (!user) throw new NetworkAccessError("Assigned staff member is not valid for this organization.", 404);
    }
    const lead = await tx.lead.create({ data: { organizationId: session.organizationId, patientId: input.patientId ?? null, name: input.name, email: input.email ?? null, phone: input.phone ?? null, source: input.source, campaignSource: input.campaignSource ?? null, serviceInterest: input.serviceInterest ?? null, appointmentInterest: input.appointmentInterest ?? null, estimatedValueCents: input.estimatedValueCents, assignedTo: input.assignedTo ?? null, followUpDueAt: dateOrNull(input.followUpDueAt), notes: input.notes ?? null } });
    const task = input.followUpDueAt ? await tx.task.create({ data: { organizationId: session.organizationId, category: "lead_follow_up", title: `Follow up with ${lead.name}`, details: `lead:${lead.id} ${lead.serviceInterest ?? "New lead"}`, ownerId: input.assignedTo ?? null, priority: "high", riskLevel: "NEEDS_STAFF", dueAt: dateOrNull(input.followUpDueAt), status: "open", createdBy: session.userId } }) : null;
    await tx.leadEvent.create({ data: { organizationId: session.organizationId, leadId: lead.id, actorId: session.userId, eventType: "created", toStatus: lead.status, note: "Lead captured into the tenant CRM.", metadata: { source: lead.source, taskId: task?.id ?? null } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "crm.lead_created", resourceType: "lead", resourceId: lead.id, metadata: { source: lead.source, estimatedValueCents: lead.estimatedValueCents, patientId: lead.patientId, taskId: task?.id ?? null } } });
    return { lead, taskId: task?.id ?? null };
  });
}

export async function transitionLead(session: ClinicSession, leadId: string, rawInput: unknown) {
  if (!can(session.role, "crm", "update")) throw new NetworkAccessError("Lead updates are not permitted for this role.", 403);
  const input = transitionLeadSchema.parse(rawInput);
  const lead = await db.lead.findFirst({ where: { id: leadId, organizationId: session.organizationId } });
  if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);
  const status = input.action === "contact" || input.action === "follow_up" ? "contacted" : input.action === "book" ? "booked" : input.action === "lose" ? "lost" : input.action === "complete" ? "completed" : "new";
  const pipelineStage = input.action === "follow_up" ? "follow_up_needed" : status;
  const now = new Date();
  return db.$transaction(async (tx) => {
    const updated = await tx.lead.update({ where: { id: lead.id }, data: { status, pipelineStage, contactAttempts: ["contact", "follow_up"].includes(input.action) ? { increment: 1 } : undefined, lastContactedAt: ["contact", "follow_up"].includes(input.action) ? now : undefined, bookingStatus: input.action === "book" ? "booked" : input.action === "complete" ? "completed" : lead.bookingStatus, lostReason: input.action === "lose" ? input.lostReason ?? "No reason documented." : input.action === "reactivate" ? null : lead.lostReason, followUpDueAt: input.followUpDueAt !== undefined ? dateOrNull(input.followUpDueAt) : input.action === "contact" ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : lead.followUpDueAt } });
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: { in: ["lead_follow_up", "lead_reactivation", "lead_booking"] }, details: { contains: `lead:${lead.id}` }, status: { not: "completed" } }, data: { status: ["lost", "completed", "booked"].includes(status) ? "completed" : "open", completedAt: ["lost", "completed", "booked"].includes(status) ? now : null } });
    if (["contact", "follow_up", "reactivate"].includes(input.action) && updated.followUpDueAt) await tx.task.create({ data: { organizationId: session.organizationId, category: input.action === "reactivate" ? "lead_reactivation" : "lead_follow_up", title: `Follow up with ${updated.name}`, details: `lead:${updated.id} ${input.note}`, ownerId: updated.assignedTo, priority: "high", riskLevel: "NEEDS_STAFF", dueAt: updated.followUpDueAt, status: "open", createdBy: session.userId } });
    await tx.leadEvent.create({ data: { organizationId: session.organizationId, leadId: lead.id, actorId: session.userId, eventType: input.action, fromStatus: lead.status, toStatus: updated.status, note: input.note, metadata: { lostReason: input.lostReason ?? null } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `crm.lead_${input.action}`, resourceType: "lead", resourceId: lead.id, changes: { status: { from: lead.status, to: updated.status }, pipelineStage: { from: lead.pipelineStage, to: updated.pipelineStage } }, metadata: { note: input.note, lostReason: input.lostReason ?? null } } });
    return updated;
  });
}

export async function createLeadMessage(session: ClinicSession, leadId: string, rawInput: unknown) {
  if (!can(session.role, "crm", "update")) throw new NetworkAccessError("Lead communications are not permitted for this role.", 403);
  const input = createLeadMessageSchema.parse(rawInput);
  const lead = await db.lead.findFirst({ where: { id: leadId, organizationId: session.organizationId } });
  if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);
  return db.$transaction(async (tx) => {
    const thread = await tx.messageThread.findFirst({ where: { organizationId: session.organizationId, leadId, status: "open" }, orderBy: { updatedAt: "desc" } }) ?? await tx.messageThread.create({ data: { organizationId: session.organizationId, leadId, patientId: lead.patientId, category: `lead_${input.channel}`, subject: `${lead.name} · ${lead.serviceInterest ?? "Lead"}`, status: "open" } });
    const message = await tx.message.create({ data: { organizationId: session.organizationId, threadId: thread.id, leadId, patientId: lead.patientId, direction: MessageDirection[input.direction], channel: input.channel, body: input.body, sentAt: input.direction === "OUTBOUND" ? new Date() : null, createdBy: session.userId } });
    await tx.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    await tx.leadEvent.create({ data: { organizationId: session.organizationId, leadId, actorId: session.userId, eventType: `message_${input.direction.toLowerCase()}`, note: input.body, metadata: { channel: input.channel, threadId: thread.id, messageId: message.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "crm.lead_message_created", resourceType: "lead", resourceId: leadId, metadata: { channel: input.channel, direction: input.direction, threadId: thread.id, messageId: message.id } } });
    return message;
  });
}
