import "server-only";

import type { Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  acknowledgeMedicationWarningSchema,
  createMedicationSchema,
  createPrescriptionSchema,
  createReconciliationSchema,
  createRefillRequestSchema,
  deterministicMedicationWarnings,
  nextPrescriptionStatus,
  nextReconciliationStatus,
  nextRefillStatus,
  transitionPrescriptionSchema,
  transitionReconciliationSchema,
  transitionRefillSchema,
} from "@/lib/medication-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;
const activeIntegrationStatuses = ["active", "connected"];

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function integrationConfig(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireMedication(tx: Transaction, organizationId: string, patientId: string, medicationId: string) {
  const medication = await tx.medication.findFirst({ where: { id: medicationId, organizationId, patientId } });
  if (!medication) throw new NetworkAccessError("Medication not found for this patient and organization.", 404);
  return medication;
}

async function requirePharmacy(tx: Transaction, organizationId: string, patientId: string, pharmacyId?: string) {
  if (!pharmacyId) return null;
  const pharmacy = await tx.patientPharmacy.findFirst({ where: { id: pharmacyId, organizationId, patientId, status: "active" } });
  if (!pharmacy) throw new NetworkAccessError("Pharmacy not found for this patient and organization.", 404);
  return pharmacy;
}

async function requireProvider(tx: Transaction, organizationId: string, providerId: string) {
  const provider = await tx.provider.findFirst({ where: { id: providerId, organizationId, status: "active" } });
  if (!provider) throw new NetworkAccessError("Provider not found for this organization.", 404);
  return provider;
}

async function requireMedicationSigner(tx: Transaction, session: ClinicSession, expectedProviderId?: string) {
  if (!can(session.role, "medications", "sign")) throw new NetworkAccessError("Medication provider-signing permission is required for this action.", 403);
  const provider = await tx.provider.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId, status: "active" },
    select: { id: true, name: true, credential: true },
  });
  if (!provider) throw new NetworkAccessError("An active provider identity in this organization is required for medication approval.", 403);
  if (expectedProviderId && provider.id !== expectedProviderId) throw new NetworkAccessError("Only the assigned prescribing provider may approve this prescription.", 403);
  return provider;
}

async function requirePrescribingIntegration(tx: Transaction, organizationId: string, integrationId: string, requireEpcs = false) {
  const integration = await tx.integration.findFirst({
    where: { id: integrationId, organizationId, type: "e_prescribing", status: { in: activeIntegrationStatuses } },
  });
  if (!integration) throw new NetworkAccessError("The e-prescribing adapter is not active for this organization.", 409);
  if (requireEpcs && integrationConfig(integration.config).epcsVerified !== true) {
    throw new NetworkAccessError("Controlled-substance workflow requires an active adapter explicitly verified for EPCS.", 409);
  }
  return integration;
}

async function recordWarnings(tx: Transaction, input: {
  organizationId: string;
  patientId: string;
  medicationId?: string;
  refillRequestId?: string;
  prescriptionId?: string;
  medicationName: string;
  actorId: string;
}) {
  const [allergies, activeMedications] = await Promise.all([
    tx.allergy.findMany({ where: { organizationId: input.organizationId, patientId: input.patientId, status: "active" }, select: { id: true, substance: true, reaction: true, severity: true } }),
    tx.medication.findMany({ where: { organizationId: input.organizationId, patientId: input.patientId, status: "active" }, select: { id: true, name: true } }),
  ]);
  const warningRows = deterministicMedicationWarnings({ medicationId: input.medicationId, medicationName: input.medicationName, allergies, activeMedications });
  for (const warning of warningRows) {
    const created = await tx.medicationWarning.create({ data: { ...warning, organizationId: input.organizationId, patientId: input.patientId, medicationId: input.medicationId, refillRequestId: input.refillRequestId, prescriptionId: input.prescriptionId } });
    await tx.task.create({
      data: {
        organizationId: input.organizationId,
        patientId: input.patientId,
        category: "medication_safety_review",
        title: warning.severity === "urgent" ? "Urgent medication warning requires provider review" : "Medication warning requires provider review",
        details: `${warning.summary} Rule source: ${warning.source}. ClinicOS has not made a clinical determination.`,
        priority: warning.severity === "urgent" ? "urgent" : "high",
        riskLevel: warning.severity === "urgent" ? "URGENT" : "NEEDS_PROVIDER",
        dueAt: new Date(),
        createdBy: input.actorId,
      },
    });
    if (warning.severity === "urgent") {
      await tx.escalation.create({ data: { organizationId: input.organizationId, patientId: input.patientId, sourceType: "medication_warning", sourceId: created.id, category: warning.warningType, riskLevel: "URGENT", assignedTeam: "clinical_provider" } });
    }
  }
  return warningRows.length;
}

export async function listMedicationWorkspace(organizationId: string) {
  const [patients, providers, pharmacies, medications, reconciliations, refills, prescriptions, warnings, events, integrations] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId, status: "active" }, select: { id: true, userId: true, name: true, credential: true }, orderBy: { name: "asc" } }),
    db.patientPharmacy.findMany({ where: { organizationId, status: "active" }, orderBy: [{ preferred: "desc" }, { name: "asc" }] }),
    db.medication.findMany({ where: { organizationId }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 250 }),
    db.medicationReconciliation.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.refillRequest.findMany({ where: { organizationId }, orderBy: [{ urgency: "desc" }, { updatedAt: "desc" }], take: 150 }),
    db.prescription.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 150 }),
    db.medicationWarning.findMany({ where: { organizationId }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200 }),
    db.medicationEvent.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 250 }),
    db.integration.findMany({ where: { organizationId, type: { in: ["e_prescribing", "pharmacy", "pdmp", "formulary"] } }, orderBy: [{ type: "asc" }, { vendor: "asc" }] }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const medicationMap = new Map(medications.map((medication) => [medication.id, medication]));
  const pharmacyMap = new Map(pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));
  const patientName = (id: string) => {
    const patient = patientMap.get(id);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
  };
  return {
    patients: patients.map((patient) => ({ ...patient, name: `${patient.firstName} ${patient.lastName}` })),
    providers: providers.map((provider) => ({ ...provider, label: `${provider.name}, ${provider.credential}` })),
    pharmacies: pharmacies.map((pharmacy) => ({ ...pharmacy, verifiedAt: iso(pharmacy.verifiedAt), createdAt: pharmacy.createdAt.toISOString(), updatedAt: pharmacy.updatedAt.toISOString() })),
    medications: medications.map((medication) => ({ ...medication, patientName: patientName(medication.patientId), providerName: medication.prescribingProviderId ? providerMap.get(medication.prescribingProviderId)?.name ?? "Unknown provider" : null, pharmacyName: medication.pharmacyId ? pharmacyMap.get(medication.pharmacyId)?.name ?? "Unknown pharmacy" : null, startDate: iso(medication.startDate), endDate: iso(medication.endDate), reconciledAt: iso(medication.reconciledAt), discontinuedAt: iso(medication.discontinuedAt), createdAt: medication.createdAt.toISOString(), updatedAt: medication.updatedAt.toISOString() })),
    reconciliations: reconciliations.map((record) => ({ ...record, patientName: patientName(record.patientId), completedAt: iso(record.completedAt), reopenedAt: iso(record.reopenedAt), createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() })),
    refills: refills.map((refill) => ({ ...refill, patientName: patientName(refill.patientId), medicationName: medicationMap.get(refill.medicationId)?.name ?? "Unknown medication", providerName: refill.providerId ? providerMap.get(refill.providerId)?.name ?? "Unknown provider" : null, pharmacyName: refill.pharmacyId ? pharmacyMap.get(refill.pharmacyId)?.name ?? "Unknown pharmacy" : null, decidedAt: iso(refill.decidedAt), transmittedAt: iso(refill.transmittedAt), lastAttemptAt: iso(refill.lastAttemptAt), completedAt: iso(refill.completedAt), createdAt: refill.createdAt.toISOString(), updatedAt: refill.updatedAt.toISOString() })),
    prescriptions: prescriptions.map((prescription) => ({ ...prescription, patientName: patientName(prescription.patientId), medicationName: medicationMap.get(prescription.medicationId)?.name ?? "Unknown medication", providerName: providerMap.get(prescription.providerId)?.name ?? "Unknown provider", pharmacyName: prescription.pharmacyId ? pharmacyMap.get(prescription.pharmacyId)?.name ?? "Unknown pharmacy" : null, approvedAt: iso(prescription.approvedAt), transmittedAt: iso(prescription.transmittedAt), lastAttemptAt: iso(prescription.lastAttemptAt), cancelledAt: iso(prescription.cancelledAt), createdAt: prescription.createdAt.toISOString(), updatedAt: prescription.updatedAt.toISOString() })),
    warnings: warnings.map((warning) => ({ ...warning, patientName: patientName(warning.patientId), medicationName: warning.medicationId ? medicationMap.get(warning.medicationId)?.name ?? "Unknown medication" : null, acknowledgedAt: iso(warning.acknowledgedAt), createdAt: warning.createdAt.toISOString(), updatedAt: warning.updatedAt.toISOString() })),
    events: events.map((event) => ({ ...event, patientName: patientName(event.patientId), createdAt: event.createdAt.toISOString() })),
    integrations: integrations.map((integration) => ({ id: integration.id, type: integration.type, vendor: integration.vendor, status: integration.status, phase: integration.phase, active: activeIntegrationStatuses.includes(integration.status), epcsVerified: integrationConfig(integration.config).epcsVerified === true, lastSyncAt: iso(integration.lastSyncAt) })),
  };
}

export type MedicationWorkspace = Awaited<ReturnType<typeof listMedicationWorkspace>>;

export async function listMedicationHistoryForPatient(organizationId: string, patientId: string) {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true } });
  if (!patient) return { medications: [], reconciliations: [], refills: [], prescriptions: [], warnings: [], pharmacies: [], events: [] };
  const [medications, reconciliations, refills, prescriptions, warnings, pharmacies, events] = await Promise.all([
    db.medication.findMany({ where: { organizationId, patientId }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] }),
    db.medicationReconciliation.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.refillRequest.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.prescription.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.medicationWarning.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.patientPharmacy.findMany({ where: { organizationId, patientId, status: "active" }, orderBy: [{ preferred: "desc" }, { name: "asc" }] }),
    db.medicationEvent.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return {
    medications: medications.map((item) => ({ ...item, startDate: iso(item.startDate), endDate: iso(item.endDate), reconciledAt: iso(item.reconciledAt), discontinuedAt: iso(item.discontinuedAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    reconciliations: reconciliations.map((item) => ({ ...item, completedAt: iso(item.completedAt), reopenedAt: iso(item.reopenedAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    refills: refills.map((item) => ({ ...item, decidedAt: iso(item.decidedAt), transmittedAt: iso(item.transmittedAt), lastAttemptAt: iso(item.lastAttemptAt), completedAt: iso(item.completedAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    prescriptions: prescriptions.map((item) => ({ ...item, approvedAt: iso(item.approvedAt), transmittedAt: iso(item.transmittedAt), lastAttemptAt: iso(item.lastAttemptAt), cancelledAt: iso(item.cancelledAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    warnings: warnings.map((item) => ({ ...item, acknowledgedAt: iso(item.acknowledgedAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    pharmacies: pharmacies.map((item) => ({ ...item, verifiedAt: iso(item.verifiedAt), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    events: events.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export type PatientMedicationHistory = Awaited<ReturnType<typeof listMedicationHistoryForPatient>>;

export async function createMedication(session: ClinicSession, rawInput: unknown) {
  const input = createMedicationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const provider = input.providerId ? await requireProvider(tx, session.organizationId, input.providerId) : null;
    if (input.source === "provider_entered") await requireMedicationSigner(tx, session, provider?.id);
    await requirePharmacy(tx, session.organizationId, input.patientId, input.pharmacyId);
    if (input.encounterId) {
      const encounter = await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId: session.organizationId, patientId: input.patientId } });
      if (!encounter) throw new NetworkAccessError("Encounter not found for this patient and organization.", 404);
    }
    const medication = await tx.medication.create({ data: { organizationId: session.organizationId, patientId: input.patientId, name: input.name, genericName: input.genericName, brandName: input.brandName, rxNormCode: input.rxNormCode, strength: input.strength, dose: input.dose, frequency: input.frequency, route: input.route, quantity: input.quantity, refillsAuthorized: input.refillsAuthorized, indication: input.indication, source: input.source, patientReported: input.source === "patient_reported", prescribingProviderId: provider?.id, encounterId: input.encounterId, pharmacyId: input.pharmacyId, startDate: input.startDate, reconciliationStatus: "unreconciled", provenance: { source: input.source, syntheticDemo: session.demo }, createdBy: session.userId } });
    const warningCount = await recordWarnings(tx, { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, medicationName: medication.name, actorId: session.userId });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, actorId: session.userId, eventType: "medication_created", toStatus: medication.status, metadata: { source: input.source, warningCount } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "medication.created", resourceType: "medication", resourceId: medication.id, patientId: input.patientId, metadata: { source: input.source, providerId: provider?.id, warningCount } } });
    return medication;
  });
}

export async function createMedicationReconciliation(session: ClinicSession, rawInput: unknown) {
  const input = createReconciliationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const count = await tx.medication.count({ where: { organizationId: session.organizationId, patientId: input.patientId, id: { in: input.medicationIds } } });
    if (count !== new Set(input.medicationIds).size) throw new NetworkAccessError("Every reconciliation medication must belong to this patient and organization.", 400);
    if (input.encounterId && !(await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId: session.organizationId, patientId: input.patientId } }))) throw new NetworkAccessError("Encounter not found for this patient and organization.", 404);
    const record = await tx.medicationReconciliation.create({ data: { organizationId: session.organizationId, patientId: input.patientId, encounterId: input.encounterId, source: input.source, summary: input.summary, discrepancies: input.discrepancies, medicationIds: [...new Set(input.medicationIds)], createdBy: session.userId } });
    await tx.task.create({ data: { organizationId: session.organizationId, patientId: input.patientId, encounterId: input.encounterId, category: "medication_reconciliation", title: "Medication reconciliation requires provider completion", details: input.summary ?? "Review medication sources, discrepancies, and current use before completing reconciliation.", priority: input.discrepancies.length ? "high" : "normal", riskLevel: "NEEDS_PROVIDER", dueAt: new Date(), createdBy: session.userId } });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: input.patientId, reconciliationId: record.id, actorId: session.userId, eventType: "reconciliation_created", toStatus: record.status, metadata: { medicationIds: record.medicationIds, discrepancyCount: input.discrepancies.length } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "medication_reconciliation.created", resourceType: "medication_reconciliation", resourceId: record.id, patientId: input.patientId, metadata: { medicationIds: record.medicationIds, discrepancyCount: input.discrepancies.length } } });
    return record;
  });
}

export async function transitionMedicationReconciliation(session: ClinicSession, reconciliationId: string, rawInput: unknown) {
  const input = transitionReconciliationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const record = await tx.medicationReconciliation.findFirst({ where: { id: reconciliationId, organizationId: session.organizationId } });
    if (!record) throw new NetworkAccessError("Medication reconciliation not found.", 404);
    const nextStatus = nextReconciliationStatus(record.status, input.action);
    if (!nextStatus) throw new NetworkAccessError(`Cannot ${input.action} a ${record.status} reconciliation.`, 409);
    const signer = await requireMedicationSigner(tx, session);
    const now = new Date();
    const updated = await tx.medicationReconciliation.updateMany({ where: { id: record.id, organizationId: session.organizationId, status: record.status }, data: input.action === "complete" ? { status: nextStatus, completedBy: signer.id, completedAt: now } : { status: nextStatus, reopenedBy: signer.id, reopenedAt: now, completedBy: null, completedAt: null } });
    if (updated.count !== 1) throw new NetworkAccessError("Reconciliation changed while you were reviewing it. Refresh and retry.", 409);
    if (input.action === "complete") {
      await tx.medication.updateMany({ where: { organizationId: session.organizationId, patientId: record.patientId, id: { in: record.medicationIds } }, data: { reconciliationStatus: "reconciled", reconciledBy: signer.id, reconciledAt: now } });
      await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: record.patientId, category: "medication_reconciliation", status: "open" }, data: { status: "completed", completedAt: now } });
    } else {
      await tx.medication.updateMany({ where: { organizationId: session.organizationId, patientId: record.patientId, id: { in: record.medicationIds } }, data: { reconciliationStatus: "review_due", reconciledBy: null, reconciledAt: null } });
    }
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: record.patientId, reconciliationId: record.id, actorId: session.userId, eventType: `reconciliation_${input.action}`, fromStatus: record.status, toStatus: nextStatus, note: input.note, metadata: { providerId: signer.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `medication_reconciliation.${input.action}`, resourceType: "medication_reconciliation", resourceId: record.id, patientId: record.patientId, metadata: { fromStatus: record.status, toStatus: nextStatus, providerId: signer.id, note: input.note } } });
    return tx.medicationReconciliation.findUniqueOrThrow({ where: { id: record.id } });
  });
}

export async function createRefillRequest(session: ClinicSession, rawInput: unknown) {
  const input = createRefillRequestSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const medication = await requireMedication(tx, session.organizationId, input.patientId, input.medicationId);
    if (medication.status !== "active") throw new NetworkAccessError("Refills can only be requested for an active medication record.", 409);
    await requirePharmacy(tx, session.organizationId, input.patientId, input.pharmacyId);
    if (input.providerId) await requireProvider(tx, session.organizationId, input.providerId);
    const refill = await tx.refillRequest.create({ data: { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, pharmacyId: input.pharmacyId, providerId: input.providerId, requestSource: input.requestSource, requestNote: input.requestNote, urgency: input.urgency, quantityRequested: input.quantityRequested, createdBy: session.userId } });
    await tx.task.create({ data: { organizationId: session.organizationId, patientId: input.patientId, category: "refill_review", title: `${input.urgency === "urgent" ? "Urgent " : ""}refill request requires provider review`, details: `${medication.name}${input.requestNote ? `: ${input.requestNote}` : ""}. ClinicOS cannot approve refills.`, priority: input.urgency === "urgent" ? "urgent" : input.urgency === "high" ? "high" : "normal", riskLevel: input.urgency === "urgent" ? "URGENT" : "NEEDS_PROVIDER", dueAt: new Date(), ownerId: input.providerId, createdBy: session.userId } });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, refillRequestId: refill.id, actorId: session.userId, eventType: "refill_requested", toStatus: refill.status, metadata: { source: input.requestSource, urgency: input.urgency } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "refill_request.created", resourceType: "refill_request", resourceId: refill.id, patientId: input.patientId, metadata: { medicationId: medication.id, source: input.requestSource, urgency: input.urgency } } });
    return refill;
  });
}

export async function transitionRefillRequest(session: ClinicSession, refillId: string, rawInput: unknown) {
  const input = transitionRefillSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const refill = await tx.refillRequest.findFirst({ where: { id: refillId, organizationId: session.organizationId } });
    if (!refill) throw new NetworkAccessError("Refill request not found.", 404);
    const nextStatus = nextRefillStatus(refill.status, input.action);
    if (!nextStatus) throw new NetworkAccessError(`Cannot ${input.action} a ${refill.status} refill request.`, 409);
    const now = new Date();
    let signer: Awaited<ReturnType<typeof requireMedicationSigner>> | null = null;
    if (["approve", "deny"].includes(input.action)) signer = await requireMedicationSigner(tx, session);
    if (input.providerId) await requireProvider(tx, session.organizationId, input.providerId);
    const assignedProviderId = signer?.id ?? input.providerId ?? refill.providerId;
    let integration = null;
    const deliveryMethod = input.deliveryMethod ?? refill.deliveryMethod;
    const integrationId = input.integrationId ?? refill.integrationId;
    if (["queue", "retry"].includes(input.action) && deliveryMethod === "electronic_adapter") {
      if (!integrationId) throw new NetworkAccessError("An active e-prescribing integration is required for electronic delivery.", 409);
      integration = await requirePrescribingIntegration(tx, session.organizationId, integrationId);
    }
    const data: Prisma.RefillRequestUpdateManyMutationInput = { status: nextStatus, providerId: assignedProviderId };
    if (["approve", "deny"].includes(input.action)) Object.assign(data, { providerDecision: input.action === "approve" ? "approved" : "denied", decisionReason: input.note, decidedBy: signer!.id, decidedAt: now });
    if (["queue", "retry"].includes(input.action)) Object.assign(data, { deliveryMethod, integrationId: integration?.id ?? integrationId, transmissionStatus: "queued", lastAttemptAt: now, failureReason: null, retryCount: input.action === "retry" ? { increment: 1 } : undefined });
    if (input.action === "confirm_sent") Object.assign(data, { transmissionStatus: "sent", transmittedAt: now, externalReference: input.externalReference, manualConfirmation: input.manualConfirmation });
    if (input.action === "fail") Object.assign(data, { transmissionStatus: "failed", failureReason: input.note, lastAttemptAt: now });
    if (input.action === "complete") Object.assign(data, { completedAt: now });
    const changed = await tx.refillRequest.updateMany({ where: { id: refill.id, organizationId: session.organizationId, status: refill.status }, data });
    if (changed.count !== 1) throw new NetworkAccessError("Refill request changed while you were reviewing it. Refresh and retry.", 409);
    if (["approve", "deny", "cancel", "complete"].includes(input.action)) await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: refill.patientId, category: "refill_review", status: "open" }, data: { status: "completed", completedAt: now } });
    if (["queue", "retry", "confirm_sent", "fail"].includes(input.action)) await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: integration?.id ?? integrationId, resourceType: "refill_request", resourceId: refill.id, direction: "outbound", eventType: `refill_${input.action}`, status: input.action === "confirm_sent" ? "acknowledged" : input.action === "fail" ? "failed" : "queued", errorMessage: input.action === "fail" ? input.note : null, retryCount: input.action === "retry" ? refill.retryCount + 1 : refill.retryCount, metadata: { deliveryMethod, externalReference: input.externalReference, manualConfirmation: input.manualConfirmation } } });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: refill.patientId, medicationId: refill.medicationId, refillRequestId: refill.id, actorId: session.userId, eventType: `refill_${input.action}`, fromStatus: refill.status, toStatus: nextStatus, note: input.note, metadata: { providerId: assignedProviderId, deliveryMethod } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `refill_request.${input.action}`, resourceType: "refill_request", resourceId: refill.id, patientId: refill.patientId, metadata: { fromStatus: refill.status, toStatus: nextStatus, providerId: assignedProviderId, deliveryMethod, note: input.note } } });
    return tx.refillRequest.findUniqueOrThrow({ where: { id: refill.id } });
  });
}

export async function createPrescription(session: ClinicSession, rawInput: unknown) {
  const input = createPrescriptionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const medication = await requireMedication(tx, session.organizationId, input.patientId, input.medicationId);
    await requireProvider(tx, session.organizationId, input.providerId);
    const pharmacy = await requirePharmacy(tx, session.organizationId, input.patientId, input.pharmacyId);
    if (input.refillRequestId) {
      const refill = await tx.refillRequest.findFirst({ where: { id: input.refillRequestId, organizationId: session.organizationId, patientId: input.patientId, medicationId: input.medicationId } });
      if (!refill || refill.status !== "approved") throw new NetworkAccessError("A linked refill request must be approved and match this patient and medication.", 409);
    }
    let integration = null;
    if (input.deliveryMethod === "electronic_adapter") integration = await requirePrescribingIntegration(tx, session.organizationId, input.integrationId!, input.controlledSubstance);
    if (input.controlledSubstance) {
      if (!pharmacy?.controlledSubstancesEnabled) throw new NetworkAccessError("The selected pharmacy is not verified for controlled-substance electronic delivery.", 409);
      const dea = await tx.providerCredential.findFirst({ where: { organizationId: session.organizationId, providerId: input.providerId, type: "DEA", status: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
      if (!dea) throw new NetworkAccessError("The prescribing provider requires an active, unexpired DEA credential for this controlled-substance workflow.", 409);
    }
    const prescription = await tx.prescription.create({ data: { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, refillRequestId: input.refillRequestId, providerId: input.providerId, pharmacyId: input.pharmacyId, dosageInstructions: input.dosageInstructions, quantity: input.quantity, refills: input.refills, daysSupply: input.daysSupply, controlledSubstance: input.controlledSubstance, deaSchedule: input.deaSchedule, epcsRequired: input.controlledSubstance, deliveryMethod: input.deliveryMethod, integrationId: integration?.id, provenance: { source: "clinicos_draft", humanApprovalRequired: true, syntheticDemo: session.demo }, createdBy: session.userId } });
    const warningCount = await recordWarnings(tx, { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, refillRequestId: input.refillRequestId, prescriptionId: prescription.id, medicationName: medication.name, actorId: session.userId });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: input.patientId, medicationId: medication.id, refillRequestId: input.refillRequestId, prescriptionId: prescription.id, actorId: session.userId, eventType: "prescription_drafted", toStatus: prescription.status, metadata: { providerId: input.providerId, deliveryMethod: input.deliveryMethod, controlledSubstance: input.controlledSubstance, warningCount } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "prescription.drafted", resourceType: "prescription", resourceId: prescription.id, patientId: input.patientId, metadata: { providerId: input.providerId, deliveryMethod: input.deliveryMethod, controlledSubstance: input.controlledSubstance, warningCount } } });
    return prescription;
  });
}

export async function transitionPrescription(session: ClinicSession, prescriptionId: string, rawInput: unknown) {
  const input = transitionPrescriptionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const prescription = await tx.prescription.findFirst({ where: { id: prescriptionId, organizationId: session.organizationId } });
    if (!prescription) throw new NetworkAccessError("Prescription not found.", 404);
    const nextStatus = nextPrescriptionStatus(prescription.status, input.action);
    if (!nextStatus) throw new NetworkAccessError(`Cannot ${input.action} a ${prescription.status} prescription.`, 409);
    const now = new Date();
    let signer: Awaited<ReturnType<typeof requireMedicationSigner>> | null = null;
    if (input.action === "approve") {
      signer = await requireMedicationSigner(tx, session, prescription.providerId);
      const blockingWarnings = await tx.medicationWarning.count({ where: { organizationId: session.organizationId, prescriptionId: prescription.id, status: "open", severity: { in: ["high", "urgent"] } } });
      if (blockingWarnings) throw new NetworkAccessError("Provider must acknowledge all high or urgent source warnings before approval.", 409);
    }
    let integration = null;
    if (["queue", "retry"].includes(input.action) && prescription.deliveryMethod === "electronic_adapter") integration = await requirePrescribingIntegration(tx, session.organizationId, prescription.integrationId!, prescription.controlledSubstance);
    const data: Prisma.PrescriptionUpdateManyMutationInput = { status: nextStatus };
    if (input.action === "approve") Object.assign(data, { approvedBy: signer!.id, approvedAt: now });
    if (["queue", "retry"].includes(input.action)) Object.assign(data, { transmissionStatus: "queued", lastAttemptAt: now, failureReason: null, retryCount: input.action === "retry" ? { increment: 1 } : undefined });
    if (input.action === "confirm_sent") Object.assign(data, { transmissionStatus: "sent", transmittedAt: now, externalReference: input.externalReference, manualConfirmation: input.manualConfirmation });
    if (input.action === "fail") Object.assign(data, { transmissionStatus: "failed", failureReason: input.note, lastAttemptAt: now });
    if (input.action === "cancel") Object.assign(data, { cancelledBy: session.userId, cancelledAt: now, cancellationReason: input.note });
    const changed = await tx.prescription.updateMany({ where: { id: prescription.id, organizationId: session.organizationId, status: prescription.status }, data });
    if (changed.count !== 1) throw new NetworkAccessError("Prescription changed while you were reviewing it. Refresh and retry.", 409);
    if (prescription.refillRequestId && input.action === "confirm_sent") await tx.refillRequest.updateMany({ where: { id: prescription.refillRequestId, organizationId: session.organizationId, status: { in: ["approved", "queued"] } }, data: { status: "sent", transmissionStatus: "sent", transmittedAt: now, externalReference: input.externalReference, manualConfirmation: input.manualConfirmation } });
    if (["queue", "retry", "confirm_sent", "fail"].includes(input.action)) await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: integration?.id ?? prescription.integrationId, resourceType: "prescription", resourceId: prescription.id, direction: "outbound", eventType: `prescription_${input.action}`, status: input.action === "confirm_sent" ? "acknowledged" : input.action === "fail" ? "failed" : "queued", errorMessage: input.action === "fail" ? input.note : null, retryCount: input.action === "retry" ? prescription.retryCount + 1 : prescription.retryCount, metadata: { deliveryMethod: prescription.deliveryMethod, controlledSubstance: prescription.controlledSubstance, externalReference: input.externalReference, manualConfirmation: input.manualConfirmation } } });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: prescription.patientId, medicationId: prescription.medicationId, refillRequestId: prescription.refillRequestId, prescriptionId: prescription.id, actorId: session.userId, eventType: `prescription_${input.action}`, fromStatus: prescription.status, toStatus: nextStatus, note: input.note, metadata: { providerId: prescription.providerId, deliveryMethod: prescription.deliveryMethod } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `prescription.${input.action}`, resourceType: "prescription", resourceId: prescription.id, patientId: prescription.patientId, metadata: { fromStatus: prescription.status, toStatus: nextStatus, providerId: prescription.providerId, deliveryMethod: prescription.deliveryMethod, note: input.note } } });
    return tx.prescription.findUniqueOrThrow({ where: { id: prescription.id } });
  });
}

export async function acknowledgeMedicationWarning(session: ClinicSession, warningId: string, rawInput: unknown) {
  const input = acknowledgeMedicationWarningSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const warning = await tx.medicationWarning.findFirst({ where: { id: warningId, organizationId: session.organizationId } });
    if (!warning) throw new NetworkAccessError("Medication warning not found.", 404);
    if (warning.status !== "open") throw new NetworkAccessError("This warning has already been reviewed.", 409);
    const signer = await requireMedicationSigner(tx, session);
    const now = new Date();
    const changed = await tx.medicationWarning.updateMany({ where: { id: warning.id, organizationId: session.organizationId, status: "open" }, data: { status: "acknowledged", acknowledgedBy: signer.id, acknowledgedAt: now, acknowledgmentReason: input.reason } });
    if (changed.count !== 1) throw new NetworkAccessError("Warning changed while you were reviewing it. Refresh and retry.", 409);
    await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: warning.patientId, category: "medication_safety_review", status: "open" }, data: { status: "completed", completedAt: now } });
    await tx.escalation.updateMany({ where: { organizationId: session.organizationId, sourceType: "medication_warning", sourceId: warning.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: input.reason } });
    await tx.medicationEvent.create({ data: { organizationId: session.organizationId, patientId: warning.patientId, medicationId: warning.medicationId, refillRequestId: warning.refillRequestId, prescriptionId: warning.prescriptionId, actorId: session.userId, eventType: "warning_acknowledged", fromStatus: "open", toStatus: "acknowledged", note: input.reason, metadata: { warningType: warning.warningType, providerId: signer.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "medication_warning.acknowledged", resourceType: "medication_warning", resourceId: warning.id, patientId: warning.patientId, metadata: { warningType: warning.warningType, providerId: signer.id, reason: input.reason } } });
    return tx.medicationWarning.findUniqueOrThrow({ where: { id: warning.id } });
  });
}
