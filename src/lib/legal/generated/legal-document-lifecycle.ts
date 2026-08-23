import type {
  LegalReviewItem,
  LegalReviewResolution,
  NdaDraftInput,
  NdaDraftPackage,
} from "@/lib/legal/generated/nda-drafting";

export type GeneratedLegalDocumentStatus =
  | "NEEDS_REVIEW"
  | "APPROVED_FOR_SIGNATURE"
  | "FROZEN"
  | "SENT_FOR_SIGNATURE"
  | "PARTIALLY_SIGNED"
  | "EXECUTED"
  | "SUPERSEDED"
  | "VOID";

export type GeneratedLegalDocumentEventType =
  | "CREATED"
  | "REVISED"
  | "REVIEW_RESOLVED"
  | "APPROVED"
  | "PDF_FROZEN"
  | "SIGNATURE_REQUESTED"
  | "SIGNED"
  | "EXECUTED"
  | "SUPERSEDED"
  | "VOIDED";

export type GeneratedLegalSigner = {
  role: "KLINIKOS" | "RECIPIENT" | "WITNESS" | "OTHER";
  name: string;
  email?: string;
  title?: string;
  entity?: string;
  authorityConfirmed: boolean;
};

export type GeneratedLegalDocumentEvent = {
  type: GeneratedLegalDocumentEventType;
  occurredAt: string;
  actor?: string;
  detail?: string;
  evidenceId?: string;
};

export type FrozenGeneratedLegalArtifact = {
  organizationId: string;
  documentId: string;
  version: number;
  fileName: string;
  mimeType: "application/pdf";
  sha256: string;
  byteLength: number;
  storageKey: string;
  renderedAt: string;
};

export type VerifiedGeneratedLegalExecutionEvidence = {
  kind: "ESIGN_PROVIDER" | "OPERATOR_VERIFIED_SIGNED_ARTIFACT";
  verified: true;
  verifiedAt: string;
  verifiedBy: string;
  providerEventId?: string;
  signedArtifactSha256: string;
};

export type GeneratedLegalDocument = {
  id: string;
  organizationId: string;
  documentKey: "master_nda";
  version: number;
  status: GeneratedLegalDocumentStatus;
  createdAt: string;
  updatedAt: string;
  input: NdaDraftInput;
  package: NdaDraftPackage;
  reviewItems: LegalReviewItem[];
  signers: GeneratedLegalSigner[];
  artifact?: FrozenGeneratedLegalArtifact;
  events: GeneratedLegalDocumentEvent[];
  executionEvidence: VerifiedGeneratedLegalExecutionEvidence[];
  counselReviewRequired: true;
  productionApproved: false;
};

const allowedTransitions: Record<GeneratedLegalDocumentStatus, readonly GeneratedLegalDocumentStatus[]> = {
  NEEDS_REVIEW: ["APPROVED_FOR_SIGNATURE", "VOID"],
  APPROVED_FOR_SIGNATURE: ["NEEDS_REVIEW", "FROZEN", "VOID"],
  FROZEN: ["SENT_FOR_SIGNATURE", "VOID"],
  SENT_FOR_SIGNATURE: ["PARTIALLY_SIGNED", "EXECUTED", "VOID"],
  PARTIALLY_SIGNED: ["EXECUTED", "VOID"],
  EXECUTED: ["SUPERSEDED"],
  SUPERSEDED: [],
  VOID: [],
};

function validSha256(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{64}$/i.test(value));
}

function frozenArtifactMatchesRecord(record: GeneratedLegalDocument) {
  const artifact = record.artifact;
  return Boolean(
    artifact
    && artifact.organizationId === record.organizationId
    && artifact.documentId === record.id
    && artifact.version === record.version
    && artifact.mimeType === "application/pdf"
    && artifact.byteLength > 0
    && validSha256(artifact.sha256),
  );
}

export function buildGeneratedLegalDocument(input: {
  id: string;
  organizationId: string;
  input: NdaDraftInput;
  packageResult: NdaDraftPackage;
  signers?: GeneratedLegalSigner[];
  now?: string;
}): GeneratedLegalDocument {
  if (!input.id.trim()) throw new Error("Generated legal document id is required.");
  if (!input.organizationId.trim()) throw new Error("Generated legal documents require organization scope.");

  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    organizationId: input.organizationId,
    documentKey: "master_nda",
    version: 1,
    status: "NEEDS_REVIEW",
    createdAt: now,
    updatedAt: now,
    input: input.input,
    package: input.packageResult,
    reviewItems: input.packageResult.reviewItems.map((item) => ({ ...item })),
    signers: [...(input.signers ?? [])],
    events: [{ type: "CREATED", occurredAt: now, detail: "Generated from the governed NDA drafting engine." }],
    executionEvidence: [],
    counselReviewRequired: true,
    productionApproved: false,
  };
}

export function resolveLegalReviewItem(
  record: GeneratedLegalDocument,
  input: { key: string; resolution: LegalReviewResolution },
): GeneratedLegalDocument {
  const index = record.reviewItems.findIndex((item) => item.key === input.key);
  if (index < 0) throw new Error(`Unknown legal review item: ${input.key}`);
  if (!input.resolution.resolvedBy.trim()) throw new Error("Legal review resolution requires a reviewer identity.");

  const reviewItems = record.reviewItems.map((item, itemIndex) => itemIndex === index
    ? { ...item, resolution: { ...input.resolution } }
    : item);
  const updatedAt = input.resolution.resolvedAt;

  return {
    ...record,
    reviewItems,
    updatedAt,
    events: [
      ...record.events,
      {
        type: "REVIEW_RESOLVED",
        occurredAt: updatedAt,
        actor: input.resolution.resolvedBy,
        detail: `${input.key}:${input.resolution.outcome}`,
      },
    ],
  };
}

export function signatureReadiness(record: GeneratedLegalDocument) {
  const blockers: string[] = [];

  if (!record.input.recipientName.trim()) blockers.push("Recipient legal name is missing.");
  if (!record.input.recipientState.trim()) blockers.push("Recipient jurisdiction is missing.");
  if (!record.input.permittedPurpose.trim()) blockers.push("Permitted purpose is missing.");

  for (const item of record.reviewItems) {
    if (item.required && item.severity === "blocking" && !item.resolution) {
      blockers.push(`Required legal review remains unresolved: ${item.key}.`);
    }
  }

  const klinikosSigner = record.signers.find((signer) => signer.role === "KLINIKOS" && signer.name.trim());
  const recipientSigner = record.signers.find((signer) => signer.role === "RECIPIENT" && signer.name.trim());
  if (!klinikosSigner) blockers.push("A Klinikos signer is required.");
  if (!recipientSigner) blockers.push("A recipient signer is required.");
  if (record.signers.some((signer) => !signer.authorityConfirmed)) {
    blockers.push("Signer authority must be confirmed for every configured signer.");
  }

  return { ready: blockers.length === 0, blockers };
}

export function addVerifiedExecutionEvidence(
  record: GeneratedLegalDocument,
  evidence: VerifiedGeneratedLegalExecutionEvidence,
): GeneratedLegalDocument {
  if (!frozenArtifactMatchesRecord(record)) {
    throw new Error("Verified execution evidence requires the exact frozen artifact for this organization, document and version.");
  }
  if (!validSha256(evidence.signedArtifactSha256) || evidence.signedArtifactSha256.toLowerCase() !== record.artifact!.sha256.toLowerCase()) {
    throw new Error("Verified execution evidence must match the exact frozen artifact SHA-256.");
  }
  if (!evidence.verifiedBy.trim()) throw new Error("Verified execution evidence requires verifier identity.");

  return {
    ...record,
    updatedAt: evidence.verifiedAt,
    executionEvidence: [...record.executionEvidence, { ...evidence }],
  };
}

function hasMatchingVerifiedExecutionEvidence(record: GeneratedLegalDocument) {
  if (!frozenArtifactMatchesRecord(record)) return false;
  const artifactHash = record.artifact!.sha256.toLowerCase();
  return record.executionEvidence.some((evidence) =>
    evidence.verified
    && validSha256(evidence.signedArtifactSha256)
    && evidence.signedArtifactSha256.toLowerCase() === artifactHash,
  );
}

export function transitionGeneratedLegalDocument(
  record: GeneratedLegalDocument,
  nextStatus: GeneratedLegalDocumentStatus,
  event: Omit<GeneratedLegalDocumentEvent, "occurredAt"> & { occurredAt?: string },
): GeneratedLegalDocument {
  if (!allowedTransitions[record.status].includes(nextStatus)) {
    throw new Error(`Illegal generated legal-document transition: ${record.status} -> ${nextStatus}`);
  }

  if (nextStatus === "APPROVED_FOR_SIGNATURE" && !signatureReadiness(record).ready) {
    throw new Error("Generated legal document is not ready for approval; required review or signer authority remains unresolved.");
  }
  if (nextStatus === "FROZEN" && !frozenArtifactMatchesRecord(record)) {
    throw new Error("Generated legal document cannot be frozen without its exact immutable PDF artifact.");
  }
  if (nextStatus === "SENT_FOR_SIGNATURE" && !frozenArtifactMatchesRecord(record)) {
    throw new Error("Generated legal document cannot be sent without its exact frozen artifact.");
  }
  if (nextStatus === "EXECUTED" && !hasMatchingVerifiedExecutionEvidence(record)) {
    throw new Error("Generated legal document cannot become executed without verified evidence matching the exact frozen artifact.");
  }

  const occurredAt = event.occurredAt ?? new Date().toISOString();
  return {
    ...record,
    status: nextStatus,
    updatedAt: occurredAt,
    productionApproved: false,
    events: [...record.events, { ...event, occurredAt }],
  };
}
