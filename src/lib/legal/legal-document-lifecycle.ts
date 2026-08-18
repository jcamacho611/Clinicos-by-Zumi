import type { NdaGeneratorInput, NdaGeneratorResult } from "@/lib/legal/nda-generator";

export type LegalDocumentStatus =
  | "DRAFT"
  | "NEEDS_REVIEW"
  | "APPROVED_FOR_SIGNATURE"
  | "SENT_FOR_SIGNATURE"
  | "PARTIALLY_SIGNED"
  | "EXECUTED"
  | "SUPERSEDED"
  | "VOID";

export type LegalDocumentEventType =
  | "CREATED"
  | "REVISED"
  | "REVIEW_REQUESTED"
  | "APPROVED"
  | "PDF_RENDERED"
  | "SIGNATURE_REQUESTED"
  | "VIEWED"
  | "SIGNED"
  | "DECLINED"
  | "EXECUTED"
  | "SUPERSEDED"
  | "VOIDED";

export type LegalSigner = {
  role: "KLINIKOS" | "RECIPIENT" | "WITNESS" | "OTHER";
  name: string;
  email?: string;
  title?: string;
  entity?: string;
  authorityConfirmed: boolean;
};

export type LegalDocumentEvent = {
  type: LegalDocumentEventType;
  occurredAt: string;
  actor?: string;
  detail?: string;
  evidenceId?: string;
};

export type LegalDocumentRecord = {
  id: string;
  documentKey: "master_nda";
  version: number;
  status: LegalDocumentStatus;
  createdAt: string;
  updatedAt: string;
  input: NdaGeneratorInput;
  package: NdaGeneratorResult;
  signers: LegalSigner[];
  artifact?: {
    fileName: string;
    mimeType: "application/pdf";
    sha256?: string;
    storageKey?: string;
    renderedAt?: string;
  };
  events: LegalDocumentEvent[];
  counselReviewRequired: true;
  productionApproved: false;
};

export function buildLegalDocumentRecord(
  id: string,
  input: NdaGeneratorInput,
  packageResult: NdaGeneratorResult,
  signers: LegalSigner[] = [],
): LegalDocumentRecord {
  const now = new Date().toISOString();
  return {
    id,
    documentKey: "master_nda",
    version: 1,
    status: "NEEDS_REVIEW",
    createdAt: now,
    updatedAt: now,
    input,
    package: packageResult,
    signers,
    events: [{ type: "CREATED", occurredAt: now, detail: "Generated from the jurisdiction-aware NDA engine." }],
    counselReviewRequired: true,
    productionApproved: false,
  };
}

export function signatureReadiness(record: LegalDocumentRecord) {
  const blockers: string[] = [];
  if (!record.input.recipientName.trim()) blockers.push("Recipient legal name is missing.");
  if (!record.input.recipientState.trim()) blockers.push("Recipient state / principal place of business is missing.");
  if (!record.input.permittedPurpose.trim()) blockers.push("Permitted purpose is missing.");
  if (record.package.venueInstruction.toLowerCase().includes("only after confirming")) blockers.push("Governing law and venue still require transaction-specific confirmation.");
  if (record.package.warnings.some((warning) => warning.includes("state-specific review"))) blockers.push("State-specific restrictive-covenant / damages review remains open.");
  if (record.signers.length === 0) blockers.push("No signer packet has been configured.");
  if (record.signers.some((signer) => !signer.authorityConfirmed)) blockers.push("Signer authority has not been confirmed for every signer.");

  return {
    ready: blockers.length === 0 && record.status === "APPROVED_FOR_SIGNATURE",
    blockers,
    nextStatus: blockers.length === 0 ? "APPROVED_FOR_SIGNATURE" as const : "NEEDS_REVIEW" as const,
  };
}

export function executionGuard(record: LegalDocumentRecord) {
  const readiness = signatureReadiness(record);
  return {
    canRenderFinalPdf: readiness.ready,
    canSendForSignature: readiness.ready && Boolean(record.artifact?.sha256),
    canMarkExecuted: record.status === "PARTIALLY_SIGNED" || record.status === "SENT_FOR_SIGNATURE",
    warning: "Never mark a document executed from UI intent alone. Require verified signature-provider evidence or an operator-verified signed artifact and preserve the audit event.",
  };
}
