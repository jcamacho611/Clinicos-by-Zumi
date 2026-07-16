import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { createRemoteObservationSchema, reviewRemoteObservationSchema } from "@/lib/remote-monitoring-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function patientName(patient: { firstName: string; lastName: string } | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
}

export async function listRemoteMonitoringWorkspace(session: ClinicSession) {
  if (!can(session.role, "remote_monitoring", "read")) throw new NetworkAccessError("Remote monitoring access is not permitted for this role.", 403);
  const [patients, observations, tasks, escalations] = await Promise.all([
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.remoteObservation.findMany({ where: { organizationId: session.organizationId }, orderBy: { observedAt: "desc" }, take: 100 }),
    db.task.findMany({ where: { organizationId: session.organizationId, category: "remote_monitoring" }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.escalation.findMany({ where: { organizationId: session.organizationId, sourceType: "remote_monitoring" }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "remote_monitoring.accessed", resourceType: "remote_monitoring_workspace", resourceId: session.organizationId, metadata: { observationCount: observations.length, patientCount: patients.length } } });
  return {
    patients,
    observations: observations.map((observation) => ({ id: observation.id, patientId: observation.patientId, patientName: patientName(patientsById.get(observation.patientId)), type: observation.type, value: observation.value, unit: observation.unit, source: observation.source, observedAt: observation.observedAt.toISOString(), thresholdConfig: observation.thresholdConfig, qualityFlag: observation.qualityFlag, reviewStatus: observation.reviewStatus, reviewedAt: observation.reviewedAt?.toISOString() ?? null })),
    tasks: tasks.map((task) => ({ id: task.id, title: task.title, status: task.status, riskLevel: task.riskLevel, dueAt: task.dueAt?.toISOString() ?? null })),
    escalations: escalations.map((escalation) => ({ id: escalation.id, category: escalation.category, status: escalation.status, riskLevel: escalation.riskLevel, createdAt: escalation.createdAt.toISOString() })),
  };
}

export type RemoteMonitoringWorkspace = Awaited<ReturnType<typeof listRemoteMonitoringWorkspace>>;

export async function createRemoteObservation(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "remote_monitoring", "create")) throw new NetworkAccessError("Remote observation creation is not permitted for this role.", 403);
  const input = createRemoteObservationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } });
    if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    const observation = await tx.remoteObservation.create({ data: { organizationId: session.organizationId, patientId: patient.id, type: input.type, value: input.value, unit: input.unit ?? null, source: input.sourceType === "device_adapter" ? `device_adapter:${input.deviceId ?? "pending"}` : "patient_entered_manual", observedAt: new Date(input.observedAt), thresholdConfig: { ...input.thresholdConfig, configuredBy: session.userId }, qualityFlag: input.qualityFlag ?? null, reviewStatus: "pending" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "remote_monitoring.observation_created", resourceType: "remote_observation", resourceId: observation.id, patientId: patient.id, metadata: { sourceType: input.sourceType, deviceId: input.deviceId, consentConfirmed: input.consentConfirmed, thresholdConfigured: true, manualFallback: input.sourceType === "patient_entered" } } });
    return { observation, patient: { name: patientName(patient), mrn: patient.mrn }, reviewRequired: true, clinicalInterpretation: "Human provider review required; this observation is not an autonomous clinical decision." };
  });
}

export async function reviewRemoteObservation(session: ClinicSession, observationId: string, rawInput: unknown) {
  if (!can(session.role, "remote_monitoring", "update")) throw new NetworkAccessError("Remote observation review is not permitted for this role.", 403);
  const input = reviewRemoteObservationSchema.parse(rawInput);
  const observation = await db.remoteObservation.findFirst({ where: { id: observationId, organizationId: session.organizationId } });
  if (!observation) throw new NetworkAccessError("Remote observation not found for this organization.", 404);
  if (observation.reviewStatus !== "pending") throw new NetworkAccessError("This remote observation has already been reviewed.", 409);
  return db.$transaction(async (tx) => {
    const status = input.action === "review" ? "reviewed" : input.action === "reject" ? "rejected" : "escalated";
    const updated = await tx.remoteObservation.update({ where: { id: observation.id }, data: { reviewStatus: status, reviewedBy: session.userId, reviewedAt: new Date() } });
    let taskId: string | null = null;
    let escalationId: string | null = null;
    if (input.action === "escalate") {
      const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: observation.patientId, category: "remote_monitoring", title: "Provider review: remote observation escalation", details: `observation:${observation.id} ${input.note}`, priority: "urgent", riskLevel: RiskLevel.URGENT, dueAt: new Date(), status: "open", createdBy: session.userId } });
      const escalation = await tx.escalation.create({ data: { organizationId: session.organizationId, patientId: observation.patientId, sourceType: "remote_monitoring", sourceId: observation.id, category: "remote_observation_review", riskLevel: RiskLevel.URGENT, assignedTeam: "provider", status: "open" } });
      taskId = task.id; escalationId = escalation.id;
    }
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `remote_monitoring.${input.action}`, resourceType: "remote_observation", resourceId: observation.id, patientId: observation.patientId, changes: { reviewStatus: { from: observation.reviewStatus, to: status } }, metadata: { note: input.note, taskId, escalationId, humanReview: true } } });
    return { observation: updated, taskId, escalationId, note: input.note };
  });
}
