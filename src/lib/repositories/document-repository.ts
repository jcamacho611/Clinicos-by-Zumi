import "server-only";

import { randomUUID } from "node:crypto";
import { AccessLevel, type Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  createDocumentCategorySchema,
  createDocumentMetadataSchema,
  createDocumentVersionMetadataSchema,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_PACKET_MAX_BYTES,
  documentPacketSchema,
  documentTransitionSchema,
  nextDocumentState,
  supportedDocumentMimeTypes,
} from "@/lib/document-rules";
import { decryptDocumentContent, encryptDocumentContent } from "@/lib/document-storage";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import type { PatientDocument } from "@/lib/types";

type Transaction = Prisma.TransactionClient;
type DocumentFile = { buffer: Buffer; fileName: string; mimeType: string; sizeBytes: number };

const documentSummarySelect = {
  id: true, organizationId: true, patientId: true, encounterId: true, referralId: true, caseType: true, caseId: true,
  categoryId: true, versionGroupId: true, version: true, supersedesId: true, name: true, originalFileName: true,
  description: true, tags: true, sourceType: true, storageProvider: true, storageKey: true, mimeType: true,
  sizeBytes: true, checksumSha256: true, accessLevel: true, reviewRequired: true, reviewStatus: true,
  releaseStatus: true, releaseRequestedAt: true, releaseApprovedBy: true, releaseApprovedAt: true,
  patientVisible: true, internalOnly: true, status: true, expiresAt: true, lockedAt: true, uploadedBy: true,
  provenance: true, createdAt: true, updatedAt: true,
} satisfies Prisma.DocumentSelect;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function serializeDocument<T extends Record<string, unknown>>(document: T) {
  return {
    ...document,
    releaseRequestedAt: iso(document.releaseRequestedAt as Date | null),
    releaseApprovedAt: iso(document.releaseApprovedAt as Date | null),
    expiresAt: iso(document.expiresAt as Date | null),
    lockedAt: iso(document.lockedAt as Date | null),
    createdAt: iso(document.createdAt as Date),
    updatedAt: iso(document.updatedAt as Date),
  };
}

function assertDocumentFile(file: DocumentFile, allowedMimeTypes: string[] = []) {
  if (!file.buffer.length || file.sizeBytes <= 0) throw new NetworkAccessError("A non-empty document file is required.", 400);
  if (file.sizeBytes > DOCUMENT_MAX_BYTES) throw new NetworkAccessError("Documents are limited to 10 MB in the encrypted database fallback.", 413);
  if (!supportedDocumentMimeTypes.includes(file.mimeType as (typeof supportedDocumentMimeTypes)[number])) {
    throw new NetworkAccessError("This document type is not supported.", 415);
  }
  if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.mimeType)) {
    throw new NetworkAccessError("This file type is not allowed for the selected document category.", 415);
  }
}

async function requireCategory(tx: Transaction, organizationId: string, categoryId: string | undefined) {
  if (!categoryId) throw new NetworkAccessError("A document category is required.", 400);
  const category = await tx.documentCategory.findFirst({ where: { id: categoryId, organizationId, active: true } });
  if (!category) throw new NetworkAccessError("Document category not found for this organization.", 404);
  return category;
}

async function validateDocumentLinks(tx: Transaction, organizationId: string, input: {
  patientId?: string;
  encounterId?: string;
  referralId?: string;
  caseType?: "nofault" | "workers_comp";
  caseId?: string;
}) {
  const patient = input.patientId ? await tx.patient.findFirst({ where: { id: input.patientId, organizationId, status: "active" }, select: { id: true } }) : null;
  if (input.patientId && !patient) throw new NetworkAccessError("Patient not found for this organization.", 404);

  if (input.encounterId) {
    const encounter = await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId }, select: { patientId: true } });
    if (!encounter || (input.patientId && encounter.patientId !== input.patientId)) throw new NetworkAccessError("Encounter does not match the selected patient and organization.", 409);
  }
  if (input.referralId) {
    const referral = await tx.referral.findFirst({ where: { id: input.referralId, organizationId }, select: { patientId: true } });
    if (!referral || (input.patientId && referral.patientId !== input.patientId)) throw new NetworkAccessError("Referral does not match the selected patient and organization.", 409);
  }
  if (input.caseType === "nofault" && input.caseId) {
    const item = await tx.noFaultCase.findFirst({ where: { id: input.caseId, organizationId }, select: { patientId: true } });
    if (!item || (input.patientId && item.patientId !== input.patientId)) throw new NetworkAccessError("No-fault case does not match the selected patient and organization.", 409);
  }
  if (input.caseType === "workers_comp" && input.caseId) {
    const item = await tx.workersCompCase.findFirst({ where: { id: input.caseId, organizationId }, select: { patientId: true } });
    if (!item || (input.patientId && item.patientId !== input.patientId)) throw new NetworkAccessError("Workers compensation case does not match the selected patient and organization.", 409);
  }
}

async function requireDocument(tx: Transaction, organizationId: string, documentId: string) {
  const document = await tx.document.findFirst({ where: { id: documentId, organizationId }, select: documentSummarySelect });
  if (!document) throw new NetworkAccessError("Document not found for this organization.", 404);
  return document;
}

async function createReviewWork(tx: Transaction, input: { organizationId: string; documentId: string; patientId: string | null; name: string; actorId: string }) {
  await tx.documentReview.create({
    data: { organizationId: input.organizationId, documentId: input.documentId, reviewType: "content", requestedBy: input.actorId, status: "needs_review", dueAt: new Date() },
  });
  await tx.task.create({
    data: {
      organizationId: input.organizationId, patientId: input.patientId, category: "document_review",
      title: "Document requires human review", details: `${input.name} document ${input.documentId}. Review classification, content, and release suitability.`,
      priority: "high", riskLevel: "NEEDS_STAFF", dueAt: new Date(), createdBy: input.actorId,
    },
  });
}

export async function listDocumentWorkspace(organizationId: string) {
  const [documents, categories, patients, encounters, referrals, noFaultCases, workersCompCases] = await Promise.all([
    db.document.findMany({ where: { organizationId }, select: documentSummarySelect, orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 250 }),
    db.documentCategory.findMany({ where: { organizationId, active: true }, orderBy: { name: "asc" } }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, mrn: true, firstName: true, lastName: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.encounter.findMany({ where: { organizationId }, select: { id: true, patientId: true, type: true, serviceDate: true }, orderBy: { serviceDate: "desc" }, take: 100 }),
    db.referral.findMany({ where: { organizationId }, select: { id: true, patientId: true, specialty: true, destination: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.noFaultCase.findMany({ where: { organizationId }, select: { id: true, patientId: true, claimNumber: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.workersCompCase.findMany({ where: { organizationId }, select: { id: true, patientId: true, claimNumber: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  const documentIds = documents.map((document) => document.id);
  const [reviews, events, accessEvents] = await Promise.all([
    db.documentReview.findMany({ where: { organizationId, documentId: { in: documentIds } }, orderBy: { createdAt: "desc" }, take: 300 }),
    db.documentEvent.findMany({ where: { organizationId, documentId: { in: documentIds } }, orderBy: { createdAt: "desc" }, take: 400 }),
    db.auditLog.findMany({ where: { organizationId, resourceType: "document", resourceId: { in: documentIds }, action: { startsWith: "document.content." } }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  return {
    documents: documents.map((document) => {
      const patient = document.patientId ? patientMap.get(document.patientId) : undefined;
      const category = document.categoryId ? categoryMap.get(document.categoryId) : undefined;
      return serializeDocument({
        ...document,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Organization record",
        patientMrn: patient?.mrn ?? null,
        categoryName: category?.name ?? "Uncategorized",
        categoryCode: category?.code ?? "uncategorized",
        categoryColor: category?.color ?? "slate",
        hasStoredContent: document.storageProvider === "database_encrypted" && Boolean(document.checksumSha256),
      });
    }),
    categories: categories.map((category) => ({ ...category, createdAt: category.createdAt.toISOString(), updatedAt: category.updatedAt.toISOString() })),
    patients: patients.map((patient) => ({ id: patient.id, mrn: patient.mrn, name: `${patient.firstName} ${patient.lastName}` })),
    encounters: encounters.map((encounter) => ({ ...encounter, serviceDate: encounter.serviceDate.toISOString() })),
    referrals,
    cases: [
      ...noFaultCases.map((item) => ({ ...item, caseType: "nofault" as const })),
      ...workersCompCases.map((item) => ({ ...item, caseType: "workers_comp" as const })),
    ],
    reviews: reviews.map((review) => ({ ...review, dueAt: iso(review.dueAt), reviewedAt: iso(review.reviewedAt), createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString() })),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    accessEvents: accessEvents.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  };
}

export async function listDocumentsForPatient(patientId: string, organizationId: string): Promise<PatientDocument[]> {
  const [documents, categories] = await Promise.all([
    db.document.findMany({
      where: { organizationId, patientId }, select: documentSummarySelect,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100,
    }),
    db.documentCategory.findMany({ where: { organizationId }, select: { id: true, name: true } }),
  ]);
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  return documents.map((document) => ({
    id: document.id, name: document.name, category: document.categoryId ? categoryMap.get(document.categoryId) ?? "Uncategorized" : "Uncategorized",
    version: document.version, supersedesId: document.supersedesId, mimeType: document.mimeType, sizeBytes: document.sizeBytes,
    sourceType: document.sourceType, reviewStatus: document.reviewStatus, releaseStatus: document.releaseStatus,
    patientVisible: document.patientVisible, status: document.status, lockedAt: iso(document.lockedAt), expiresAt: iso(document.expiresAt),
    hasStoredContent: document.storageProvider === "database_encrypted" && Boolean(document.checksumSha256), createdAt: document.createdAt.toISOString(),
  }));
}

export async function createDocumentCategory(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "documents", "manage")) throw new NetworkAccessError("Document category management permission is required.", 403);
  const input = createDocumentCategorySchema.parse(rawInput);
  return db.documentCategory.create({ data: { organizationId: session.organizationId, ...input } });
}

export async function createDocument(session: ClinicSession, rawMetadata: unknown, file: DocumentFile) {
  const input = createDocumentMetadataSchema.parse(rawMetadata);
  return db.$transaction(async (tx) => {
    const category = await requireCategory(tx, session.organizationId, input.categoryId);
    await validateDocumentLinks(tx, session.organizationId, input);
    assertDocumentFile(file, category.allowedMimeTypes);
    const encrypted = encryptDocumentContent(file.buffer);
    const reviewRequired = category.reviewRequired;
    const releaseRequested = Boolean(input.patientId) && category.defaultAccess !== AccessLevel.RESTRICTED && (input.requestPatientRelease || category.defaultPatientVisible);
    const now = new Date();
    const versionGroupId = randomUUID();
    const expiresAt = input.expiresAt ?? (category.retentionDays ? new Date(now.getTime() + category.retentionDays * 86_400_000) : undefined);
    const document = await tx.document.create({
      data: {
        organizationId: session.organizationId, patientId: input.patientId, encounterId: input.encounterId,
        referralId: input.referralId, caseType: input.caseType, caseId: input.caseId, categoryId: category.id,
        versionGroupId, version: 1, name: input.name, originalFileName: file.fileName, description: input.description,
        tags: input.tags, sourceType: input.sourceType, storageProvider: "database_encrypted",
        storageKey: `dbenc/${session.organizationId}/${versionGroupId}/v1/${randomUUID()}`,
        mimeType: file.mimeType, sizeBytes: file.sizeBytes, ...encrypted, accessLevel: category.defaultAccess,
        reviewRequired, reviewStatus: reviewRequired ? "needs_review" : "not_required",
        releaseStatus: releaseRequested ? "pending" : "not_requested", releaseRequestedAt: releaseRequested ? now : undefined,
        patientVisible: false, internalOnly: true, status: "active", expiresAt, uploadedBy: session.userId,
        provenance: { source: input.sourceType, encryptedFallback: true, uploadedBy: session.userId },
      }, select: documentSummarySelect,
    });
    if (reviewRequired) await createReviewWork(tx, { organizationId: session.organizationId, documentId: document.id, patientId: document.patientId, name: document.name, actorId: session.userId });
    await tx.documentEvent.create({ data: { organizationId: session.organizationId, documentId: document.id, actorId: session.userId, eventType: "uploaded", toStatus: document.reviewStatus, metadata: { categoryId: category.id, sourceType: input.sourceType, checksumSha256: encrypted.checksumSha256, releaseRequested } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "document.uploaded", resourceType: "document", resourceId: document.id, patientId: document.patientId, metadata: { categoryId: category.id, sourceType: input.sourceType, sizeBytes: file.sizeBytes, mimeType: file.mimeType, checksumSha256: encrypted.checksumSha256 } } });
    return serializeDocument(document);
  });
}

export async function createDocumentVersion(session: ClinicSession, documentId: string, rawMetadata: unknown, file: DocumentFile) {
  const input = createDocumentVersionMetadataSchema.parse(rawMetadata);
  return db.$transaction(async (tx) => {
    const original = await requireDocument(tx, session.organizationId, documentId);
    if (original.status === "superseded") throw new NetworkAccessError("Create a replacement from the current document version.", 409);
    const category = await requireCategory(tx, session.organizationId, original.categoryId ?? undefined);
    assertDocumentFile(file, category.allowedMimeTypes);
    const encrypted = encryptDocumentContent(file.buffer);
    const now = new Date();
    await tx.document.update({ where: { id: original.id }, data: { status: "superseded", patientVisible: false, internalOnly: true, releaseStatus: original.patientVisible ? "revoked" : original.releaseStatus } });
    const replacement = await tx.document.create({
      data: {
        organizationId: original.organizationId, patientId: original.patientId, encounterId: original.encounterId,
        referralId: original.referralId, caseType: original.caseType, caseId: original.caseId, categoryId: original.categoryId,
        versionGroupId: original.versionGroupId, version: original.version + 1, supersedesId: original.id,
        name: input.name, originalFileName: file.fileName, description: original.description, tags: original.tags,
        sourceType: input.sourceType, storageProvider: "database_encrypted",
        storageKey: `dbenc/${session.organizationId}/${original.versionGroupId}/v${original.version + 1}/${randomUUID()}`,
        mimeType: file.mimeType, sizeBytes: file.sizeBytes, ...encrypted, accessLevel: original.accessLevel,
        reviewRequired: original.reviewRequired, reviewStatus: original.reviewRequired ? "needs_review" : "not_required",
        releaseStatus: original.releaseStatus === "not_requested" ? "not_requested" : "pending",
        releaseRequestedAt: original.releaseStatus === "not_requested" ? undefined : now,
        patientVisible: false, internalOnly: true, status: "active", expiresAt: original.expiresAt,
        uploadedBy: session.userId, provenance: { source: input.sourceType, encryptedFallback: true, replacementReason: input.reason, supersedesId: original.id },
      }, select: documentSummarySelect,
    });
    if (replacement.reviewRequired) await createReviewWork(tx, { organizationId: session.organizationId, documentId: replacement.id, patientId: replacement.patientId, name: replacement.name, actorId: session.userId });
    await tx.documentEvent.createMany({ data: [
      { organizationId: session.organizationId, documentId: original.id, actorId: session.userId, eventType: "superseded", fromStatus: original.status, toStatus: "superseded", note: input.reason, metadata: { replacementDocumentId: replacement.id } },
      { organizationId: session.organizationId, documentId: replacement.id, actorId: session.userId, eventType: "version_created", toStatus: replacement.reviewStatus, note: input.reason, metadata: { supersedesId: original.id, version: replacement.version } },
    ] });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "document.version_created", resourceType: "document", resourceId: replacement.id, patientId: replacement.patientId, changes: { priorDocumentId: original.id, priorVersion: original.version, replacementVersion: replacement.version }, metadata: { reason: input.reason, checksumSha256: encrypted.checksumSha256 } } });
    return serializeDocument(replacement);
  });
}

export async function transitionDocument(session: ClinicSession, documentId: string, rawInput: unknown) {
  const input = documentTransitionSchema.parse(rawInput);
  const signingActions = ["approve_review", "reject_review", "approve_release", "revoke_release"];
  if (signingActions.includes(input.action) && !can(session.role, "documents", "sign")) throw new NetworkAccessError("Document review and release-signing permission is required.", 403);
  return db.$transaction(async (tx) => {
    const document = await requireDocument(tx, session.organizationId, documentId);
    let next: ReturnType<typeof nextDocumentState>;
    try { next = nextDocumentState(document, input.action); }
    catch (error) { throw new NetworkAccessError(error instanceof Error ? error.message : "Invalid document transition.", 409); }
    const now = new Date();
    const data: Prisma.DocumentUpdateInput = {
      ...(next.reviewStatus ? { reviewStatus: next.reviewStatus } : {}),
      ...(next.releaseStatus ? { releaseStatus: next.releaseStatus } : {}),
      ...(typeof next.patientVisible === "boolean" ? { patientVisible: next.patientVisible } : {}),
      ...(typeof next.internalOnly === "boolean" ? { internalOnly: next.internalOnly } : {}),
      ...(next.status ? { status: next.status } : {}),
      ...(next.locked ? { lockedAt: now } : {}),
    };
    if (input.action === "approve_release") Object.assign(data, { accessLevel: AccessLevel.PATIENT_VISIBLE, releaseApprovedBy: session.userId, releaseApprovedAt: now });
    if (["revoke_release", "archive", "restore"].includes(input.action)) Object.assign(data, { accessLevel: document.accessLevel === AccessLevel.RESTRICTED ? AccessLevel.RESTRICTED : AccessLevel.INTERNAL });
    const updated = await tx.document.update({ where: { id: document.id }, data, select: documentSummarySelect });
    if (["approve_review", "reject_review"].includes(input.action)) {
      await tx.documentReview.updateMany({ where: { organizationId: session.organizationId, documentId: document.id, status: "needs_review" }, data: { reviewerId: session.userId, status: input.action === "approve_review" ? "completed" : "rejected", decision: input.action === "approve_review" ? "approved" : "rejected", notes: input.note, reviewedAt: now } });
    }
    await tx.documentEvent.create({ data: { organizationId: session.organizationId, documentId: document.id, actorId: session.userId, eventType: input.action, fromStatus: `${document.status}/${document.reviewStatus}/${document.releaseStatus}`, toStatus: `${updated.status}/${updated.reviewStatus}/${updated.releaseStatus}`, note: input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `document.${input.action}`, resourceType: "document", resourceId: document.id, patientId: document.patientId, changes: { status: { from: document.status, to: updated.status }, reviewStatus: { from: document.reviewStatus, to: updated.reviewStatus }, releaseStatus: { from: document.releaseStatus, to: updated.releaseStatus }, patientVisible: { from: document.patientVisible, to: updated.patientVisible } }, metadata: { note: input.note } } });
    return serializeDocument(updated);
  });
}

export async function getDocumentContent(session: ClinicSession, documentId: string, intent: "preview" | "download" | "print") {
  const document = await db.document.findFirst({
    where: { id: documentId, organizationId: session.organizationId },
    select: { ...documentSummarySelect, encryptedContent: true, encryptionIv: true, encryptionAuthTag: true },
  });
  if (!document) throw new NetworkAccessError("Document not found for this organization.", 404);
  if (document.status === "archived") throw new NetworkAccessError("Archived document content must be restored before access.", 409);
  if (document.accessLevel === AccessLevel.RESTRICTED && !can(session.role, "documents", "sign") && !can(session.role, "documents", "manage")) throw new NetworkAccessError("Sensitive-document access permission is required.", 403);
  if (!document.encryptedContent || !document.encryptionIv || !document.encryptionAuthTag) throw new NetworkAccessError("This synthetic or externally referenced document has no stored content. Use the documented source fallback.", 409);
  const content = decryptDocumentContent({ encryptedContent: document.encryptedContent, encryptionIv: document.encryptionIv, encryptionAuthTag: document.encryptionAuthTag, checksumSha256: document.checksumSha256 });
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `document.content.${intent}`, resourceType: "document", resourceId: document.id, patientId: document.patientId, metadata: { version: document.version, mimeType: document.mimeType, sizeBytes: document.sizeBytes, checksumVerified: true } } });
  return { content, fileName: document.originalFileName, mimeType: document.mimeType, checksumSha256: document.checksumSha256 };
}

export async function getDocumentPacketContents(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "documents", "manage")) throw new NetworkAccessError("Document packet export permission is required.", 403);
  const input = documentPacketSchema.parse(rawInput);
  const ids = [...new Set(input.documentIds)];
  const documents = await db.document.findMany({
    where: { organizationId: session.organizationId, id: { in: ids }, status: { not: "archived" } },
    select: { ...documentSummarySelect, encryptedContent: true, encryptionIv: true, encryptionAuthTag: true },
  });
  if (documents.length !== ids.length) throw new NetworkAccessError("One or more packet documents are unavailable in this organization.", 404);
  const totalBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);
  if (totalBytes > DOCUMENT_PACKET_MAX_BYTES) throw new NetworkAccessError("Document packets are limited to 25 MB.", 413);
  const files = documents.map((document) => {
    if (!document.encryptedContent || !document.encryptionIv || !document.encryptionAuthTag) throw new NetworkAccessError(`${document.name} has no stored content and cannot be included in an export packet.`, 409);
    if (document.accessLevel === AccessLevel.RESTRICTED && !can(session.role, "documents", "sign")) throw new NetworkAccessError("Sensitive-document signing permission is required for this packet.", 403);
    return {
      document: serializeDocument(document),
      content: decryptDocumentContent({ encryptedContent: document.encryptedContent, encryptionIv: document.encryptionIv, encryptionAuthTag: document.encryptionAuthTag, checksumSha256: document.checksumSha256 }),
    };
  });
  await db.$transaction(async (tx) => {
    await tx.auditLog.createMany({ data: documents.map((document) => ({ organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "document.content.packet_export", resourceType: "document", resourceId: document.id, patientId: document.patientId, metadata: { purpose: input.purpose, totalPacketFiles: documents.length, checksumVerified: true } })) });
  });
  return { files, purpose: input.purpose, totalBytes };
}
