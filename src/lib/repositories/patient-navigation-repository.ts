import "server-only";

import { randomUUID } from "node:crypto";
import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { classifyWorkflow } from "@/lib/workflow-rules";
import { createNavigationDraftSchema, navigationDraftContent, reviewNavigationDraftSchema } from "@/lib/patient-navigation-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function riskLevelFor(value: string) {
  if (value === "Urgent") return RiskLevel.URGENT;
  if (value === "Needs Provider") return RiskLevel.NEEDS_PROVIDER;
  if (value === "Needs Staff") return RiskLevel.NEEDS_STAFF;
  return RiskLevel.NORMAL;
}

function name(patient: { firstName: string; lastName: string } | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
}

export async function listPatientNavigationWorkspace(organizationId: string) {
  const [patients, appointments, referrals, tasks, drafts, escalations] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.appointment.findMany({ where: { organizationId }, include: { patient: { select: { firstName: true, lastName: true, mrn: true } } }, orderBy: { startsAt: "asc" }, take: 30 }),
    db.referral.findMany({ where: { organizationId, status: { not: "closed" } }, orderBy: { updatedAt: "desc" }, take: 30 }),
    db.task.findMany({ where: { organizationId, category: "patient_navigation" }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 50 }),
    db.aiDraft.findMany({ where: { organizationId, sourceType: "patient_navigation" }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.escalation.findMany({ where: { organizationId, sourceType: "patient_navigation" }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  return {
    patients,
    appointments: appointments.map((appointment) => ({ id: appointment.id, patientName: name(appointment.patient), mrn: appointment.patient.mrn, startsAt: appointment.startsAt.toISOString(), status: appointment.status, notes: appointment.notes })),
    referrals: referrals.map((referral) => ({ id: referral.id, patientName: name(patientsById.get(referral.patientId)), mrn: patientsById.get(referral.patientId)?.mrn ?? "Unknown MRN", specialty: referral.specialty, status: referral.status, followUpDueAt: referral.followUpDueAt?.toISOString() ?? null })),
    tasks: tasks.map((task) => ({ id: task.id, patientName: task.patientId ? name(patientsById.get(task.patientId)) : "Organization task", title: task.title, details: task.details, status: task.status, priority: task.priority, riskLevel: task.riskLevel, dueAt: task.dueAt?.toISOString() ?? null, createdAt: task.createdAt.toISOString() })),
    drafts: drafts.map((draft) => ({ id: draft.id, patientName: draft.patientId ? name(patientsById.get(draft.patientId)) : "Unknown patient", content: draft.content, purpose: draft.purpose, riskLevel: draft.riskLevel, status: draft.status, blockedFromSend: draft.blockedFromSend, createdAt: draft.createdAt.toISOString() })),
    escalations: escalations.map((escalation) => ({ id: escalation.id, patientName: escalation.patientId ? name(patientsById.get(escalation.patientId)) : "Unknown patient", category: escalation.category, status: escalation.status, riskLevel: escalation.riskLevel, createdAt: escalation.createdAt.toISOString() })),
  };
}

export type PatientNavigationWorkspace = Awaited<ReturnType<typeof listPatientNavigationWorkspace>>;

export async function createNavigationDraft(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "tasks", "create")) throw new NetworkAccessError("Patient navigation permission is required.", 403);
  const input = createNavigationDraftSchema.parse(rawInput);
  const decision = classifyWorkflow(input.request);
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } });
    if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    const draft = await tx.aiDraft.create({ data: { organizationId: session.organizationId, patientId: patient.id, sourceType: "patient_navigation", sourceId: `navigation-request:${randomUUID()}`, purpose: "administrative_navigation", content: navigationDraftContent(name(patient), decision), riskLevel: riskLevelFor(decision.riskLevel), requiresHumanReview: true, blockedFromSend: true, status: "draft" } });
    const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient.id, category: "patient_navigation", title: `Review navigation request: ${decision.category}`, details: `draft:${draft.id} ${decision.action}`, priority: decision.riskLevel === "Urgent" ? "urgent" : decision.riskLevel === "Needs Provider" ? "high" : "normal", riskLevel: riskLevelFor(decision.riskLevel), dueAt: new Date(), status: "open", createdBy: session.userId } });
    let escalationId: string | null = null;
    if (decision.riskLevel === "Urgent") {
      const escalation = await tx.escalation.create({ data: { organizationId: session.organizationId, patientId: patient.id, sourceType: "patient_navigation", sourceId: draft.id, category: "patient_navigation_urgent", riskLevel: RiskLevel.URGENT, assignedTeam: decision.assignedTeam, status: "open" } });
      escalationId = escalation.id;
      await tx.notification.create({ data: { organizationId: session.organizationId, userId: session.userId, type: "patient_navigation_urgent", title: "Urgent navigation request requires human review", body: `${patient.firstName} ${patient.lastName}: routine automation stopped.` } });
    }
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "patient_navigation.draft_created", resourceType: "ai_draft", resourceId: draft.id, patientId: patient.id, metadata: { taskId: task.id, escalationId, category: decision.category, riskLevel: decision.riskLevel, blockedFromSend: true } } });
    return { draft, taskId: task.id, escalationId, decision };
  });
}

export async function reviewNavigationDraft(session: ClinicSession, draftId: string, rawInput: unknown) {
  if (!can(session.role, "tasks", "update")) throw new NetworkAccessError("Patient navigation review permission is required.", 403);
  const input = reviewNavigationDraftSchema.parse(rawInput);
  const draft = await db.aiDraft.findFirst({ where: { id: draftId, organizationId: session.organizationId, sourceType: "patient_navigation" } });
  if (!draft) throw new NetworkAccessError("Patient navigation draft not found for this organization.", 404);
  if (draft.status !== "draft") throw new NetworkAccessError("This navigation draft has already been reviewed.", 409);
  return db.$transaction(async (tx) => {
    const updated = await tx.aiDraft.update({ where: { id: draft.id }, data: { status: input.decision === "approve" ? "approved_for_handoff" : "rejected" } });
    await tx.aiReview.create({ data: { organizationId: session.organizationId, draftId: draft.id, reviewerId: session.userId, decision: input.decision === "approve" ? "approved_for_handoff" : "rejected", notes: input.notes } });
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: "patient_navigation", details: { contains: `draft:${draft.id}` } }, data: { status: "completed", completedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `patient_navigation.${input.decision}`, resourceType: "ai_draft", resourceId: draft.id, patientId: draft.patientId, changes: { status: { from: draft.status, to: updated.status } }, metadata: { notes: input.notes, blockedFromSend: true } } });
    return updated;
  });
}
