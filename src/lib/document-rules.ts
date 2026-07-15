import { z } from "zod";

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_PACKET_MAX_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_PACKET_MAX_FILES = 20;

export const supportedDocumentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

const optionalId = z.string().trim().min(1).max(160).optional();
const optionalText = z.string().trim().max(2_000).optional();

export const createDocumentMetadataSchema = z.object({
  patientId: optionalId,
  encounterId: optionalId,
  referralId: optionalId,
  caseType: z.enum(["nofault", "workers_comp"]).optional(),
  caseId: optionalId,
  categoryId: optionalId,
  name: z.string().trim().min(2).max(240),
  description: optionalText,
  tags: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
  sourceType: z.enum(["upload", "camera", "scan", "import", "generated"]).default("upload"),
  requestPatientRelease: z.boolean().default(false),
  expiresAt: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (Boolean(value.caseType) !== Boolean(value.caseId)) {
    context.addIssue({ code: "custom", message: "Case type and case ID must be supplied together.", path: ["caseId"] });
  }
});

export const createDocumentCategorySchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[a-z0-9_]+$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  color: z.string().trim().min(2).max(32).default("slate"),
  defaultAccess: z.enum(["INTERNAL", "PATIENT_VISIBLE", "RESTRICTED"]).default("INTERNAL"),
  defaultPatientVisible: z.boolean().default(false),
  reviewRequired: z.boolean().default(true),
  retentionDays: z.coerce.number().int().min(1).max(36_500).optional(),
  allowedMimeTypes: z.array(z.enum(supportedDocumentMimeTypes)).max(supportedDocumentMimeTypes.length).default([]),
});

export const documentTransitionSchema = z.object({
  action: z.enum(["approve_review", "reject_review", "approve_release", "revoke_release", "lock", "archive", "restore"]),
  note: z.string().trim().max(2_000).optional(),
}).superRefine((value, context) => {
  if (["approve_review", "reject_review", "revoke_release", "archive"].includes(value.action) && (!value.note || value.note.length < 8)) {
    context.addIssue({ code: "custom", message: "A human decision note of at least 8 characters is required.", path: ["note"] });
  }
});

export const documentPacketSchema = z.object({
  documentIds: z.array(z.string().trim().min(1)).min(1).max(DOCUMENT_PACKET_MAX_FILES),
  purpose: z.string().trim().min(8).max(500),
});

export const createDocumentVersionMetadataSchema = z.object({
  name: z.string().trim().min(2).max(240),
  reason: z.string().trim().min(12).max(2_000),
  sourceType: z.enum(["upload", "camera", "scan", "import", "generated"]).default("upload"),
});

export type DocumentTransitionAction = z.infer<typeof documentTransitionSchema>["action"];

export function nextDocumentState(document: {
  status: string;
  reviewStatus: string;
  releaseStatus: string;
  reviewRequired: boolean;
  patientId: string | null;
  patientVisible: boolean;
  expiresAt: Date | null;
  lockedAt: Date | null;
}, action: DocumentTransitionAction, now = new Date()) {
  if (document.status === "superseded") throw new Error("Superseded document versions are immutable.");
  if (document.expiresAt && document.expiresAt <= now && action !== "archive") throw new Error("Expired documents cannot move through routine review, release, or restoration.");
  if (action === "approve_review") {
    if (document.status !== "active" || document.reviewStatus !== "needs_review") throw new Error("Only active documents awaiting review can be approved.");
    return { reviewStatus: "approved" };
  }
  if (action === "reject_review") {
    if (document.status !== "active" || document.reviewStatus !== "needs_review") throw new Error("Only active documents awaiting review can be rejected.");
    return { reviewStatus: "rejected", releaseStatus: "held", patientVisible: false, internalOnly: true };
  }
  if (action === "approve_release") {
    if (!document.patientId) throw new Error("Only patient-bound documents can be released to a portal.");
    if (document.status !== "active") throw new Error("Only active documents can be released.");
    if (document.reviewRequired && document.reviewStatus !== "approved") throw new Error("Required document review must be approved before release.");
    if (!document.reviewRequired && !["not_required", "approved"].includes(document.reviewStatus)) throw new Error("Document review state blocks release.");
    return { releaseStatus: "approved", patientVisible: true, internalOnly: false };
  }
  if (action === "revoke_release") {
    if (!document.patientVisible || document.releaseStatus !== "approved") throw new Error("Only released documents can have portal access revoked.");
    return { releaseStatus: "revoked", patientVisible: false, internalOnly: true };
  }
  if (action === "lock") {
    if (document.status !== "active") throw new Error("Only active documents can be locked.");
    if (document.lockedAt) throw new Error("Document is already locked.");
    return { locked: true };
  }
  if (action === "archive") {
    if (document.status !== "active") throw new Error("Only active documents can be archived.");
    return { status: "archived", releaseStatus: document.patientVisible ? "revoked" : document.releaseStatus, patientVisible: false, internalOnly: true };
  }
  if (document.status !== "archived") throw new Error("Only archived documents can be restored.");
  return { status: "active", releaseStatus: "held", patientVisible: false, internalOnly: true };
}

export function parseDocumentTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

export function parseDocumentBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}
