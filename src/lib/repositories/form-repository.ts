import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { AccessLevel, RiskLevel, type Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { encryptDocumentContent } from "@/lib/document-storage";
import { buildLockedFormPdf } from "@/lib/form-pdf";
import {
  createFormAssignmentSchema,
  createFormTemplateSchema,
  createFormTemplateVersionSchema,
  evaluateFormAnswers,
  formDefinitionSchema,
  formSubmissionTransitionSchema,
  formTemplateTransitionSchema,
  missingSignatureRoles,
  nextFormSubmissionState,
  remindFormAssignmentSchema,
  saveFormSubmissionSchema,
  signFormSubmissionSchema,
  type FormDefinition,
} from "@/lib/form-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import type { PatientFormSubmission } from "@/lib/types";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function definition(value: Prisma.JsonValue): FormDefinition {
  const parsed = formDefinitionSchema.safeParse(value);
  return parsed.success ? parsed.data : { sections: [] };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireTemplate(tx: Transaction, organizationId: string, templateId: string) {
  const template = await tx.formTemplate.findFirst({ where: { id: templateId, organizationId } });
  if (!template) throw new NetworkAccessError("Form template not found for this organization.", 404);
  return template;
}

async function requireSubmission(tx: Transaction, organizationId: string, submissionId: string) {
  const submission = await tx.formSubmission.findFirst({ where: { id: submissionId, organizationId } });
  if (!submission) throw new NetworkAccessError("Form submission not found for this organization.", 404);
  return submission;
}

async function requireFormProvider(tx: Transaction, session: ClinicSession) {
  if (!can(session.role, "forms", "sign")) throw new NetworkAccessError("Provider form-signing permission is required.", 403);
  const provider = await tx.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, status: "active" }, select: { id: true, name: true, credential: true } });
  if (!provider) throw new NetworkAccessError("An active provider identity in this organization is required.", 403);
  return provider;
}

export async function listFormWorkspace(organizationId: string) {
  const [templates, assignments, submissions, patients, appointments, reviews, signatures, events] = await Promise.all([
    db.formTemplate.findMany({ where: { organizationId }, orderBy: [{ updatedAt: "desc" }, { version: "desc" }], take: 100 }),
    db.formAssignment.findMany({ where: { organizationId }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 150 }),
    db.formSubmission.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 150 }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.appointment.findMany({ where: { organizationId }, select: { id: true, patientId: true, startsAt: true, status: true }, orderBy: { startsAt: "desc" }, take: 100 }),
    db.formReview.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.signature.findMany({ where: { organizationId, entityType: "form_submission", status: "valid" }, orderBy: { signedAt: "asc" }, take: 300 }),
    db.formEvent.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const submissionByAssignment = new Map(submissions.filter((submission) => submission.assignmentId).map((submission) => [submission.assignmentId!, submission]));
  return {
    templates: templates.map((template) => {
      const parsed = definition(template.schema);
      return {
        ...template,
        schema: parsed,
        fieldCount: parsed.sections.reduce((sum, section) => sum + section.fields.length, 0),
        publishedAt: iso(template.publishedAt), retiredAt: iso(template.retiredAt), createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString(),
      };
    }),
    assignments: assignments.map((assignment) => {
      const patient = patientMap.get(assignment.patientId);
      const template = templateMap.get(assignment.templateId);
      const submission = submissionByAssignment.get(assignment.id);
      return {
        ...assignment,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        templateName: template?.name ?? "Unknown template",
        submissionId: submission?.id ?? null,
        submissionStatus: submission?.status ?? null,
        completionPercent: submission?.completionPercent ?? 0,
        dueAt: iso(assignment.dueAt), expiresAt: iso(assignment.expiresAt), sentAt: iso(assignment.sentAt), startedAt: iso(assignment.startedAt), completedAt: iso(assignment.completedAt), lastReminderAt: iso(assignment.lastReminderAt), createdAt: assignment.createdAt.toISOString(), updatedAt: assignment.updatedAt.toISOString(),
      };
    }),
    submissions: submissions.map((submission) => {
      const patient = patientMap.get(submission.patientId);
      const template = templateMap.get(submission.templateId);
      const assignment = submission.assignmentId ? assignmentMap.get(submission.assignmentId) : undefined;
      return {
        ...submission,
        answers: submission.answers,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        templateName: template?.name ?? "Unknown template",
        template: template ? { ...template, schema: definition(template.schema), publishedAt: iso(template.publishedAt), retiredAt: iso(template.retiredAt), createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString() } : null,
        deliveryMethod: assignment?.deliveryMethod ?? "manual",
        signatures: signatures.filter((signature) => signature.entityId === submission.id).map((signature) => ({ ...signature, signedAt: signature.signedAt.toISOString(), createdAt: signature.createdAt.toISOString(), revokedAt: iso(signature.revokedAt) })),
        reviews: reviews.filter((review) => review.submissionId === submission.id).map((review) => ({ ...review, dueAt: iso(review.dueAt), reviewedAt: iso(review.reviewedAt), createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString() })),
        correctionRequestedAt: iso(submission.correctionRequestedAt), reviewedAt: iso(submission.reviewedAt), approvedAt: iso(submission.approvedAt), expiresAt: iso(submission.expiresAt), lockedAt: iso(submission.lockedAt), submittedAt: iso(submission.submittedAt), createdAt: submission.createdAt.toISOString(), updatedAt: submission.updatedAt.toISOString(),
      };
    }),
    patients: patients.map((patient) => ({ ...patient, name: `${patient.firstName} ${patient.lastName}` })),
    appointments: appointments.map((appointment) => ({ ...appointment, startsAt: appointment.startsAt.toISOString() })),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  };
}

export type FormWorkspaceData = Awaited<ReturnType<typeof listFormWorkspace>>;

export async function listFormSubmissionsForPatient(organizationId: string, patientId: string): Promise<PatientFormSubmission[]> {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true } });
  if (!patient) return [];
  const submissions = await db.formSubmission.findMany({ where: { organizationId, patientId }, orderBy: { updatedAt: "desc" }, take: 100 });
  const templates = await db.formTemplate.findMany({ where: { organizationId, id: { in: [...new Set(submissions.map((submission) => submission.templateId))] } }, select: { id: true, name: true, category: true } });
  const templateMap = new Map(templates.map((template) => [template.id, template]));
  return submissions.map((submission) => ({ id: submission.id, templateName: templateMap.get(submission.templateId)?.name ?? "Unknown template", category: templateMap.get(submission.templateId)?.category ?? "general", version: submission.templateVersion, status: submission.status, completionPercent: submission.completionPercent, documentId: submission.documentId, submittedAt: iso(submission.submittedAt), lockedAt: iso(submission.lockedAt), updatedAt: submission.updatedAt.toISOString() }));
}

export async function createFormTemplate(session: ClinicSession, rawInput: unknown) {
  const input = createFormTemplateSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const template = await tx.formTemplate.create({ data: { organizationId: session.organizationId, templateKey: randomUUID(), name: input.name, description: input.description, category: input.category, audience: input.audience, completionModes: input.completionModes, schema: input.definition, requiresSignature: input.requiresSignature, requiresWitness: input.requiresWitness, requiresProviderSignature: input.requiresProviderSignature, staffReviewRequired: input.staffReviewRequired, providerReviewRequired: input.providerReviewRequired, expirationDays: input.expirationDays, renewalReminderDays: input.renewalReminderDays, status: "draft", createdBy: session.userId, provenance: { source: "clinicos_builder", syntheticDemo: session.demo } } });
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: template.id, actorId: session.userId, eventType: "template_created", toStatus: "draft", metadata: { fieldCount: input.definition.sections.reduce((sum, section) => sum + section.fields.length, 0) } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_template.created", resourceType: "form_template", resourceId: template.id, metadata: { category: template.category, version: template.version } } });
    return template;
  });
}

export async function transitionFormTemplate(session: ClinicSession, templateId: string, rawInput: unknown) {
  const input = formTemplateTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const template = await requireTemplate(tx, session.organizationId, templateId);
    const now = new Date();
    if (input.action === "publish") {
      if (template.status !== "draft") throw new NetworkAccessError("Only a draft template can be published.", 409);
      formDefinitionSchema.parse(template.schema);
      await tx.formTemplate.updateMany({ where: { organizationId: session.organizationId, templateKey: template.templateKey, status: "active", id: { not: template.id } }, data: { status: "superseded", retiredAt: now } });
    } else if (template.status !== "active") throw new NetworkAccessError("Only an active template can be retired.", 409);
    const status = input.action === "publish" ? "active" : "retired";
    const updated = await tx.formTemplate.update({ where: { id: template.id }, data: input.action === "publish" ? { status, publishedAt: now, retiredAt: null } : { status, retiredAt: now } });
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: template.id, actorId: session.userId, eventType: input.action, fromStatus: template.status, toStatus: status, note: input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `form_template.${input.action}`, resourceType: "form_template", resourceId: template.id, metadata: { note: input.note, version: template.version } } });
    return updated;
  });
}

export async function createFormTemplateVersion(session: ClinicSession, templateId: string, rawInput: unknown) {
  const input = createFormTemplateVersionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const original = await requireTemplate(tx, session.organizationId, templateId);
    if (original.status === "superseded") throw new NetworkAccessError("Create a version from the current template, not a superseded version.", 409);
    const existingDraft = await tx.formTemplate.findFirst({ where: { organizationId: session.organizationId, templateKey: original.templateKey, status: "draft" } });
    if (existingDraft) throw new NetworkAccessError("This template already has a draft version.", 409);
    const replacement = await tx.formTemplate.create({ data: { organizationId: session.organizationId, templateKey: original.templateKey, version: original.version + 1, supersedesId: original.id, name: input.name, description: input.description, category: input.category, audience: input.audience, completionModes: input.completionModes, schema: input.definition, requiresSignature: input.requiresSignature, requiresWitness: input.requiresWitness, requiresProviderSignature: input.requiresProviderSignature, staffReviewRequired: input.staffReviewRequired, providerReviewRequired: input.providerReviewRequired, expirationDays: input.expirationDays, renewalReminderDays: input.renewalReminderDays, status: "draft", createdBy: session.userId, provenance: { source: "clinicos_builder", supersedesId: original.id, versionReason: input.reason, syntheticDemo: session.demo } } });
    await tx.formEvent.createMany({ data: [{ organizationId: session.organizationId, templateId: original.id, actorId: session.userId, eventType: "version_drafted", fromStatus: original.status, toStatus: original.status, note: input.reason, metadata: { replacementId: replacement.id } }, { organizationId: session.organizationId, templateId: replacement.id, actorId: session.userId, eventType: "template_created", toStatus: "draft", note: input.reason, metadata: { supersedesId: original.id } }] });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_template.version_created", resourceType: "form_template", resourceId: replacement.id, changes: { fromVersion: original.version, toVersion: replacement.version }, metadata: { reason: input.reason, supersedesId: original.id } } });
    return replacement;
  });
}

export async function createFormAssignment(session: ClinicSession, rawInput: unknown) {
  const input = createFormAssignmentSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    const template = await requireTemplate(tx, session.organizationId, input.templateId);
    if (template.status !== "active") throw new NetworkAccessError("Only an active template can be assigned.", 409);
    if (!template.completionModes.includes(input.completionMode)) throw new NetworkAccessError("That completion mode is not allowed by this template version.", 400);
    if (input.appointmentId) {
      const appointment = await tx.appointment.findFirst({ where: { id: input.appointmentId, organizationId: session.organizationId, patientId: patient.id } });
      if (!appointment) throw new NetworkAccessError("Appointment does not belong to this patient.", 400);
    }
    if (input.encounterId) {
      const encounter = await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId: session.organizationId, patientId: patient.id } });
      if (!encounter) throw new NetworkAccessError("Encounter does not belong to this patient.", 400);
    }
    const now = new Date();
    const expiresAt = input.expiresAt ?? (template.expirationDays ? addDays(now, template.expirationDays) : undefined);
    const assignment = await tx.formAssignment.create({ data: { organizationId: session.organizationId, patientId: patient.id, templateId: template.id, templateVersion: template.version, appointmentId: input.appointmentId, encounterId: input.encounterId, assignedBy: session.userId, completionMode: input.completionMode, deliveryMethod: input.deliveryMethod, dueAt: input.dueAt, expiresAt, sentAt: now, provenance: { source: "clinicos", manualFallback: ["paper_import", "staff_assisted", "tablet"].includes(input.deliveryMethod), syntheticDemo: session.demo } } });
    const submission = await tx.formSubmission.create({ data: { organizationId: session.organizationId, patientId: patient.id, templateId: template.id, templateVersion: template.version, assignmentId: assignment.id, appointmentId: input.appointmentId, encounterId: input.encounterId, completionMode: input.completionMode, answers: {}, status: "draft", expiresAt, provenance: { source: input.deliveryMethod, assignmentId: assignment.id, syntheticDemo: session.demo } } });
    await tx.formEvent.createMany({ data: [{ organizationId: session.organizationId, templateId: template.id, assignmentId: assignment.id, actorId: session.userId, eventType: "assigned", toStatus: "not_started", metadata: { deliveryMethod: input.deliveryMethod, completionMode: input.completionMode } }, { organizationId: session.organizationId, templateId: template.id, assignmentId: assignment.id, submissionId: submission.id, actorId: session.userId, eventType: "submission_created", toStatus: "draft" }] });
    await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient.id, category: "form_completion", title: `${template.name} requires completion`, details: `Assignment ${assignment.id} was delivered through ${input.deliveryMethod}. Use the staff-assisted fallback if the patient cannot complete it electronically.`, priority: "normal", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: input.dueAt, createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_assignment.created", resourceType: "form_assignment", resourceId: assignment.id, patientId: patient.id, metadata: { templateId: template.id, templateVersion: template.version, submissionId: submission.id, deliveryMethod: input.deliveryMethod } } });
    return { assignment, submission };
  });
}

export async function saveFormSubmission(session: ClinicSession, submissionId: string, rawInput: unknown) {
  const input = saveFormSubmissionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const submission = await requireSubmission(tx, session.organizationId, submissionId);
    if (submission.assignmentId !== input.assignmentId) throw new NetworkAccessError("Submission assignment does not match.", 400);
    if (!["draft", "needs_correction"].includes(submission.status)) throw new NetworkAccessError("Only draft or correction-requested submissions can be edited.", 409);
    const template = await requireTemplate(tx, session.organizationId, submission.templateId);
    if (template.version !== submission.templateVersion) throw new NetworkAccessError("Submission template version no longer matches its immutable source.", 409);
    if (!template.completionModes.includes(input.completionMode) && input.completionMode !== "paper_import") throw new NetworkAccessError("Completion mode is not allowed by the template.", 400);
    const evaluated = evaluateFormAnswers(template.schema, input.answers);
    const now = new Date();
    const answersChanged = stable(submission.answers) !== stable(evaluated.answers) || submission.completionMode !== input.completionMode;
    const revokedSignatures = answersChanged
      ? await tx.signature.updateMany({ where: { organizationId: session.organizationId, entityType: "form_submission", entityId: submission.id, status: "valid" }, data: { status: "revoked", revokedAt: now, revokedBy: session.userId, revocationReason: "Submission answers changed after signature capture." } })
      : { count: 0 };
    const updated = await tx.formSubmission.update({ where: { id: submission.id }, data: { answers: evaluated.answers as Prisma.InputJsonValue, completionMode: input.completionMode, completionPercent: evaluated.completionPercent, status: "draft", currentReviewStage: null, correctionReason: null, correctionRequestedBy: null, correctionRequestedAt: null, provenance: { source: input.completionMode, assignmentId: submission.assignmentId, lastSavedBy: session.userId, syntheticDemo: session.demo } } });
    await tx.formAssignment.updateMany({ where: { id: input.assignmentId, organizationId: session.organizationId, status: { in: ["not_started", "in_progress"] } }, data: { status: "in_progress", startedAt: submission.createdAt > now ? now : submission.createdAt } });
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: template.id, assignmentId: input.assignmentId, submissionId: submission.id, actorId: session.userId, eventType: "saved", fromStatus: submission.status, toStatus: "draft", metadata: { completionPercent: evaluated.completionPercent, completionMode: input.completionMode, revokedSignatureCount: revokedSignatures.count } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_submission.saved", resourceType: "form_submission", resourceId: submission.id, patientId: submission.patientId, metadata: { completionPercent: evaluated.completionPercent, answerFieldCount: Object.keys(evaluated.answers).length } } });
    return updated;
  });
}

export async function signFormSubmission(session: ClinicSession, submissionId: string, rawInput: unknown, requestContext: { ipAddress?: string | null; userAgent?: string | null }) {
  const input = signFormSubmissionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const submission = await requireSubmission(tx, session.organizationId, submissionId);
    if (["locked", "rejected"].includes(submission.status)) throw new NetworkAccessError("This submission no longer accepts signatures.", 409);
    const template = await requireTemplate(tx, session.organizationId, submission.templateId);
    if (input.signerType === "submitter" && !template.requiresSignature) throw new NetworkAccessError("This template does not require a submitter signature.", 409);
    if (input.signerType === "witness" && !template.requiresWitness) throw new NetworkAccessError("This template does not require a witness signature.", 409);
    if (input.signerType === "provider" && !template.requiresProviderSignature) throw new NetworkAccessError("This template does not require a provider signature.", 409);
    const provider = input.signerType === "provider" ? await requireFormProvider(tx, session) : null;
    const existing = await tx.signature.findFirst({ where: { organizationId: session.organizationId, entityType: "form_submission", entityId: submission.id, signerType: input.signerType, status: "valid" } });
    if (existing) throw new NetworkAccessError(`${input.signerType} signature is already recorded and immutable.`, 409);
    const now = new Date();
    const attestation = "I attest that I reviewed this form and that the information and signature I provided are accurate to the best of my knowledge.";
    const authoritativeSignerName = provider?.name ?? input.signerName;
    const signatureHash = createHash("sha256").update(stable({ submissionId: submission.id, templateId: template.id, templateVersion: template.version, answers: submission.answers, signerType: input.signerType, signerName: authoritativeSignerName, signatureText: input.signatureText, attestation, signedAt: now.toISOString() })).digest("hex");
    const signature = await tx.signature.create({ data: { organizationId: session.organizationId, patientId: submission.patientId, userId: session.userId, providerId: provider?.id, entityType: "form_submission", entityId: submission.id, signerType: input.signerType, signerName: authoritativeSignerName, signerRelationship: input.signerRelationship, signatureMethod: "attested_typed", signatureHash, attestation, ipHash: requestContext.ipAddress ? createHash("sha256").update(requestContext.ipAddress).digest("hex") : null, userAgentHash: requestContext.userAgent ? createHash("sha256").update(requestContext.userAgent).digest("hex") : null, context: { capturedBy: session.userId, providerCredential: provider ? `${provider.name}, ${provider.credential}` : null, staffAssisted: input.signerType !== "provider", syntheticDemo: session.demo }, signedAt: now } });
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: template.id, assignmentId: submission.assignmentId, submissionId: submission.id, actorId: session.userId, eventType: "signature_recorded", fromStatus: submission.status, toStatus: submission.status, metadata: { signerType: input.signerType, signatureHash } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_submission.signed", resourceType: "form_submission", resourceId: submission.id, patientId: submission.patientId, metadata: { signerType: input.signerType, signerName: authoritativeSignerName, signatureHash, providerId: provider?.id } } });
    return signature;
  });
}

async function createReviewWork(tx: Transaction, input: { organizationId: string; patientId: string; templateId: string; assignmentId: string | null; submissionId: string; templateName: string; stage: "staff" | "provider"; actorId: string }) {
  await tx.formReview.create({ data: { organizationId: input.organizationId, submissionId: input.submissionId, stage: input.stage, requestedBy: input.actorId, status: "needs_review", dueAt: new Date() } });
  await tx.task.create({ data: { organizationId: input.organizationId, patientId: input.patientId, category: `form_${input.stage}_review`, title: `${input.templateName} requires ${input.stage} review`, details: `Submission ${input.submissionId} is complete and requires an authorized human decision.`, priority: input.stage === "provider" ? "high" : "normal", riskLevel: input.stage === "provider" ? RiskLevel.NEEDS_PROVIDER : RiskLevel.NEEDS_STAFF, dueAt: new Date(), createdBy: input.actorId } });
  await tx.formEvent.create({ data: { organizationId: input.organizationId, templateId: input.templateId, assignmentId: input.assignmentId, submissionId: input.submissionId, actorId: input.actorId, eventType: "review_requested", toStatus: `${input.stage}_review`, metadata: { stage: input.stage } } });
}

export async function transitionFormSubmission(session: ClinicSession, submissionId: string, rawInput: unknown) {
  const input = formSubmissionTransitionSchema.parse(rawInput);
  if (["approve_provider"].includes(input.action) && !can(session.role, "forms", "sign")) throw new NetworkAccessError("Provider form-signing permission is required.", 403);
  if (input.action === "lock" && !can(session.role, "forms", "manage")) throw new NetworkAccessError("Form lock and chart-attachment permission is required.", 403);

  const snapshot = await db.formSubmission.findFirst({ where: { id: submissionId, organizationId: session.organizationId } });
  if (!snapshot) throw new NetworkAccessError("Form submission not found for this organization.", 404);
  const [template, patient, organization, signatures] = await Promise.all([
    db.formTemplate.findFirst({ where: { id: snapshot.templateId, organizationId: session.organizationId } }),
    db.patient.findFirst({ where: { id: snapshot.patientId, organizationId: session.organizationId }, select: { firstName: true, lastName: true, mrn: true } }),
    db.organization.findUnique({ where: { id: session.organizationId }, select: { name: true } }),
    db.signature.findMany({ where: { organizationId: session.organizationId, entityType: "form_submission", entityId: snapshot.id, status: "valid" }, orderBy: { signedAt: "asc" } }),
  ]);
  if (!template || !patient || !organization) throw new NetworkAccessError("Form source records are unavailable in this organization.", 404);
  const evaluated = evaluateFormAnswers(template.schema, snapshot.answers);
  const signatureTypes = signatures.map((signature) => signature.signerType);
  if (input.action === "submit") {
    if (evaluated.missingRequired.length) throw new NetworkAccessError(`Required answers are missing: ${evaluated.missingRequired.join(", ")}.`, 400);
    if (evaluated.invalidFields.length) throw new NetworkAccessError(`Answers require correction: ${evaluated.invalidFields.join(", ")}.`, 400);
    const missingSignatures = missingSignatureRoles(template, signatureTypes);
    if (missingSignatures.length) throw new NetworkAccessError(`Required signatures are missing: ${missingSignatures.join(", ")}.`, 400);
  }
  if (input.action === "approve_provider") await db.$transaction((tx) => requireFormProvider(tx, session));
  let next;
  try { next = nextFormSubmissionState({ status: snapshot.status, staffReviewRequired: template.staffReviewRequired, providerReviewRequired: template.providerReviewRequired, requiresProviderSignature: template.requiresProviderSignature, signatures: signatureTypes }, input.action); }
  catch (error) { throw new NetworkAccessError(error instanceof Error ? error.message : "Invalid form transition.", 409); }

  const now = new Date();
  let artifact: { content: Buffer; encrypted: ReturnType<typeof encryptDocumentContent>; categoryId: string | null } | null = null;
  if (input.action === "lock") {
    const content = await buildLockedFormPdf({ organizationName: organization.name, patientName: `${patient.firstName} ${patient.lastName}`, patientMrn: patient.mrn, templateName: template.name, templateVersion: template.version, definition: evaluated.definition, answers: evaluated.answers, submissionId: snapshot.id, completionMode: snapshot.completionMode, submittedAt: snapshot.submittedAt, lockedAt: now, signatures: signatures.map((signature) => ({ signerType: signature.signerType, signerName: signature.signerName, signerRelationship: signature.signerRelationship, signedAt: signature.signedAt, signatureHash: signature.signatureHash })) });
    const categoryCode = template.category === "consent" ? "consent" : template.category === "intake" ? "intake" : "miscellaneous";
    const category = await db.documentCategory.findFirst({ where: { organizationId: session.organizationId, code: categoryCode, active: true }, select: { id: true } });
    artifact = { content, encrypted: encryptDocumentContent(content), categoryId: category?.id ?? null };
  }

  return db.$transaction(async (tx) => {
    const current = await requireSubmission(tx, session.organizationId, submissionId);
    if (current.status !== snapshot.status) throw new NetworkAccessError("Submission changed. Refresh and try again.", 409);
    if (input.action === "approve_provider") await requireFormProvider(tx, session);
    let documentId: string | undefined;
    if (artifact) {
      const document = await tx.document.create({ data: { organizationId: session.organizationId, patientId: current.patientId, encounterId: current.encounterId, categoryId: artifact.categoryId, versionGroupId: randomUUID(), name: `${template.name} - locked form`, originalFileName: `${template.templateKey}-v${template.version}-${current.id}.pdf`, description: `Generated from approved ClinicOS form submission ${current.id}.`, tags: ["form", template.category, "locked"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: `dbenc/${session.organizationId}/forms/${current.id}/${randomUUID()}`, mimeType: "application/pdf", sizeBytes: artifact.content.length, ...artifact.encrypted, accessLevel: input.releasePatientCopy ? AccessLevel.PATIENT_VISIBLE : AccessLevel.INTERNAL, reviewRequired: false, reviewStatus: "approved", releaseStatus: input.releasePatientCopy ? "approved" : "not_requested", releaseRequestedAt: input.releasePatientCopy ? now : null, releaseApprovedBy: input.releasePatientCopy ? session.userId : null, releaseApprovedAt: input.releasePatientCopy ? now : null, patientVisible: input.releasePatientCopy, internalOnly: !input.releasePatientCopy, status: "active", expiresAt: current.expiresAt, lockedAt: now, uploadedBy: session.userId, provenance: { source: "form_submission", submissionId: current.id, templateId: template.id, templateVersion: template.version, generatedPdf: true, signatureHashes: signatures.map((signature) => signature.signatureHash), syntheticDemo: session.demo } } });
      documentId = document.id;
      await tx.documentEvent.create({ data: { organizationId: session.organizationId, documentId: document.id, actorId: session.userId, eventType: "generated_from_form", toStatus: "active/approved", metadata: { submissionId: current.id, checksumSha256: artifact.encrypted.checksumSha256, patientCopy: input.releasePatientCopy } } });
    }
    const data: Prisma.FormSubmissionUpdateInput = { status: next.status, currentReviewStage: next.currentReviewStage, completionPercent: input.action === "submit" ? 100 : current.completionPercent };
    if (input.action === "submit") Object.assign(data, { submittedAt: now, correctionReason: null, correctionRequestedAt: null, correctionRequestedBy: null });
    if (input.action === "request_correction") Object.assign(data, { correctionReason: input.note, correctionRequestedAt: now, correctionRequestedBy: session.userId });
    if (["approve_staff", "approve_provider"].includes(input.action)) Object.assign(data, { reviewedBy: session.userId, reviewedAt: now });
    if (next.status === "approved") Object.assign(data, { approvedBy: session.userId, approvedAt: now });
    if (input.action === "lock" && artifact && documentId) Object.assign(data, { lockedAt: now, documentId, checksumSha256: artifact.encrypted.checksumSha256 });
    const updated = await tx.formSubmission.update({ where: { id: current.id }, data });
    let revokedSignatureCount = 0;
    if (["approve_staff", "approve_provider", "request_correction", "reject"].includes(input.action)) {
      await tx.formReview.updateMany({ where: { organizationId: session.organizationId, submissionId: current.id, status: "needs_review", stage: current.currentReviewStage ?? undefined }, data: { reviewerId: session.userId, status: input.action === "reject" ? "rejected" : "completed", decision: input.action === "request_correction" ? "needs_correction" : input.action === "reject" ? "rejected" : "approved", notes: input.note, reviewedAt: now } });
      if (current.currentReviewStage) await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: current.patientId, category: `form_${current.currentReviewStage}_review`, status: "open", details: { contains: current.id } }, data: { status: "completed", completedAt: now } });
      if (input.action === "request_correction") {
        const revoked = await tx.signature.updateMany({ where: { organizationId: session.organizationId, entityType: "form_submission", entityId: current.id, status: "valid" }, data: { status: "revoked", revokedAt: now, revokedBy: session.userId, revocationReason: `Human review requested correction: ${input.note}` } });
        revokedSignatureCount = revoked.count;
      }
    }
    if (["staff_review", "provider_review"].includes(next.status) && next.status !== current.status) await createReviewWork(tx, { organizationId: session.organizationId, patientId: current.patientId, templateId: template.id, assignmentId: current.assignmentId, submissionId: current.id, templateName: template.name, stage: next.status === "staff_review" ? "staff" : "provider", actorId: session.userId });
    if (current.assignmentId) {
      const assignmentStatus = input.action === "submit" ? "submitted" : input.action === "lock" ? "completed" : next.status === "needs_correction" ? "in_progress" : undefined;
      if (assignmentStatus) await tx.formAssignment.updateMany({ where: { id: current.assignmentId, organizationId: session.organizationId }, data: { status: assignmentStatus, completedAt: assignmentStatus === "completed" ? now : null } });
      if (["submit", "lock"].includes(input.action)) await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: current.patientId, category: "form_completion", status: "open", details: { contains: current.assignmentId } }, data: { status: "completed", completedAt: now } });
    }
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: template.id, assignmentId: current.assignmentId, submissionId: current.id, actorId: session.userId, eventType: input.action, fromStatus: current.status, toStatus: updated.status, note: input.note, metadata: documentId ? { documentId, checksumSha256: artifact?.encrypted.checksumSha256, patientCopy: input.releasePatientCopy, revokedSignatureCount } : { revokedSignatureCount } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `form_submission.${input.action}`, resourceType: "form_submission", resourceId: current.id, patientId: current.patientId, changes: { status: { from: current.status, to: updated.status }, reviewStage: { from: current.currentReviewStage, to: updated.currentReviewStage } }, metadata: { note: input.note, documentId, checksumSha256: artifact?.encrypted.checksumSha256, patientCopy: input.releasePatientCopy } } });
    return updated;
  });
}

export async function remindFormAssignment(session: ClinicSession, assignmentId: string, rawInput: unknown) {
  const input = remindFormAssignmentSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const assignment = await tx.formAssignment.findFirst({ where: { id: assignmentId, organizationId: session.organizationId } });
    if (!assignment) throw new NetworkAccessError("Form assignment not found for this organization.", 404);
    if (["completed", "cancelled", "expired"].includes(assignment.status)) throw new NetworkAccessError("This assignment no longer accepts reminders.", 409);
    const now = new Date();
    const updated = await tx.formAssignment.update({ where: { id: assignment.id }, data: { reminderCount: { increment: 1 }, lastReminderAt: now } });
    await tx.task.create({ data: { organizationId: session.organizationId, patientId: assignment.patientId, category: "form_reminder_delivery", title: `Deliver ${input.channel} form reminder`, details: `${input.note} Assignment ${assignment.id}. This manual task is the fallback until an approved communication adapter confirms delivery.`, priority: "normal", riskLevel: RiskLevel.NEEDS_STAFF, createdBy: session.userId } });
    await tx.formEvent.create({ data: { organizationId: session.organizationId, templateId: assignment.templateId, assignmentId: assignment.id, actorId: session.userId, eventType: "reminder_queued", fromStatus: assignment.status, toStatus: assignment.status, note: input.note, metadata: { channel: input.channel, manualFallback: true } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "form_assignment.reminder_queued", resourceType: "form_assignment", resourceId: assignment.id, patientId: assignment.patientId, metadata: { channel: input.channel, manualFallback: true } } });
    return updated;
  });
}

export async function getLockedFormDocumentId(session: ClinicSession, submissionId: string) {
  const submission = await db.formSubmission.findFirst({ where: { id: submissionId, organizationId: session.organizationId, status: "locked", documentId: { not: null } }, select: { documentId: true } });
  if (!submission?.documentId) throw new NetworkAccessError("Locked form PDF is not available for this organization.", 404);
  return submission.documentId;
}
