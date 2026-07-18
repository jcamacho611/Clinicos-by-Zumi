import "server-only";

import { db } from "@/lib/db";

interface PortalActor {
  accountId: string;
  patientId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordPortalAccess(actor: PortalActor, action = "portal.dashboard_viewed") {
  await db.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: actor.accountId,
      actorType: "patient",
      action,
      resourceType: "patient_portal",
      resourceId: actor.patientId,
      patientId: actor.patientId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      metadata: { purposeOfUse: "patient_access", minimumNecessary: true },
    },
  });
}

export async function getPortalDashboardForPatient(organizationId: string, patientId: string) {
  const patient = await db.patient.findFirst({
    where: { id: patientId, organizationId, status: "active", portalStatus: "active" },
    select: { id: true, firstName: true, lastName: true, preferredName: true, mrn: true, email: true, phone: true, preferredLanguage: true },
  });
  if (!patient) return null;

  const [appointments, appointmentTypes, providers, formAssignments, documents, labResults, imagingResults, instructions, balance, invoices, messages, accessHistory] = await Promise.all([
    db.appointment.findMany({ where: { organizationId, patientId }, orderBy: { startsAt: "desc" }, take: 8 }),
    db.appointmentType.findMany({ where: { organizationId }, select: { id: true, name: true } }),
    db.provider.findMany({ where: { organizationId }, select: { id: true, name: true, credential: true } }),
    db.formAssignment.findMany({ where: { organizationId, patientId, status: { not: "cancelled" } }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.document.findMany({ where: { organizationId, patientId, status: "active", patientVisible: true, internalOnly: false, releaseStatus: "approved", releaseApprovedAt: { not: null } }, select: { id: true, name: true, description: true, mimeType: true, version: true, releaseApprovedAt: true, createdAt: true }, orderBy: { releaseApprovedAt: "desc" }, take: 12 }),
    db.labResult.findMany({ where: { organizationId, patientId, patientVisible: true, releaseApprovedAt: { not: null } }, select: { id: true, panelName: true, vendor: true, resultedAt: true, releasedAt: true, status: true }, orderBy: { releasedAt: "desc" }, take: 8 }),
    db.imagingResult.findMany({ where: { organizationId, patientId, patientVisible: true, releaseApprovedAt: { not: null } }, select: { id: true, reportTitle: true, facility: true, studyPerformedAt: true, releasedAt: true, status: true }, orderBy: { releasedAt: "desc" }, take: 8 }),
    db.patientInstruction.findMany({ where: { organizationId, patientId, patientVisible: true, releasedAt: { not: null } }, select: { id: true, content: true, releasedAt: true }, orderBy: { releasedAt: "desc" }, take: 8 }),
    db.patientBalance.findFirst({ where: { organizationId, patientId }, orderBy: { asOf: "desc" } }),
    db.invoice.findMany({ where: { organizationId, patientId, status: { not: "draft" } }, select: { id: true, number: true, totalCents: true, balanceCents: true, status: true, dueAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.message.findMany({ where: { organizationId, patientId, channel: "portal", OR: [{ direction: "INBOUND" }, { direction: "OUTBOUND", approvedAt: { not: null } }] }, select: { id: true, direction: true, body: true, sentAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.auditLog.findMany({ where: { organizationId, patientId, actorType: "patient", action: { startsWith: "portal." } }, select: { id: true, action: true, resourceType: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const appointmentTypeById = new Map(appointmentTypes.map((item) => [item.id, item.name]));
  const providerById = new Map(providers.map((item) => [item.id, `${item.name}, ${item.credential}`]));
  return {
    patient: { ...patient, displayName: patient.preferredName ?? patient.firstName },
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      type: appointment.appointmentTypeId ? appointmentTypeById.get(appointment.appointmentTypeId) ?? "Clinic visit" : "Clinic visit",
      provider: appointment.providerId ? providerById.get(appointment.providerId) ?? "Care team" : "Care team",
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      telemedicine: appointment.telemedicine,
    })),
    forms: formAssignments.map((assignment) => ({ id: assignment.id, status: assignment.status, dueAt: assignment.dueAt?.toISOString() ?? null, completionMode: assignment.completionMode })),
    records: [
      ...documents.map((document) => ({ id: document.id, kind: "Document", title: document.name, detail: document.description ?? `${document.mimeType} · version ${document.version}`, releasedAt: document.releaseApprovedAt?.toISOString() ?? document.createdAt.toISOString() })),
      ...labResults.map((result) => ({ id: result.id, kind: "Lab result", title: result.panelName, detail: result.vendor ?? "Clinic result", releasedAt: (result.releasedAt ?? result.resultedAt)?.toISOString() ?? null })),
      ...imagingResults.map((result) => ({ id: result.id, kind: "Imaging report", title: result.reportTitle, detail: result.facility ?? "Imaging provider", releasedAt: (result.releasedAt ?? result.studyPerformedAt)?.toISOString() ?? null })),
      ...instructions.map((instruction) => ({ id: instruction.id, kind: "Care instruction", title: "Instructions from your care team", detail: instruction.content, releasedAt: instruction.releasedAt?.toISOString() ?? null })),
    ].sort((left, right) => (right.releasedAt ?? "").localeCompare(left.releasedAt ?? "")),
    financial: {
      balanceCents: balance?.balanceCents ?? 0,
      asOf: balance?.asOf.toISOString() ?? null,
      invoices: invoices.map((invoice) => ({ ...invoice, dueAt: invoice.dueAt?.toISOString() ?? null })),
    },
    messages: messages.map((message) => ({ ...message, sentAt: (message.sentAt ?? message.createdAt).toISOString() })),
    accessHistory: accessHistory.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  };
}

export type PortalDashboard = NonNullable<Awaited<ReturnType<typeof getPortalDashboardForPatient>>>;
