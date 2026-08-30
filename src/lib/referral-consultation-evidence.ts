export interface ConsultationDocumentCandidate {
  id: string;
  organizationId: string;
  patientId: string | null;
  referralId: string | null;
  name: string;
  version: number;
  sourceType: string;
  status: string;
  reviewStatus: string;
  expiresAt: Date | null;
}

export interface ConsultationDocumentEvidence {
  documentId: string;
  name: string;
  version: number;
  sourceType: string;
  reviewStatus: "approved";
  referralBinding: "bind_on_receipt" | "already_linked";
}

export function buildConsultationDocumentEvidence(
  document: ConsultationDocumentCandidate,
  context: {
    referralId: string;
    patientId: string;
    destinationOrganizationId: string;
    now?: Date;
  },
): ConsultationDocumentEvidence {
  const now = context.now ?? new Date();

  if (document.organizationId !== context.destinationOrganizationId) {
    throw new Error("Consultation document organization mismatch.");
  }
  if (document.patientId !== context.patientId) {
    throw new Error("Consultation document patient mismatch.");
  }
  if (document.referralId && document.referralId !== context.referralId) {
    throw new Error("Consultation document is already linked to another referral.");
  }
  if (document.status !== "active") {
    throw new Error("Consultation document must be active and current.");
  }
  if (document.reviewStatus !== "approved") {
    throw new Error("Consultation document requires approved review before referral return.");
  }
  if (document.expiresAt && document.expiresAt <= now) {
    throw new Error("Consultation document is expired.");
  }

  return {
    documentId: document.id,
    name: document.name,
    version: document.version,
    sourceType: document.sourceType,
    reviewStatus: "approved",
    referralBinding: document.referralId === context.referralId ? "already_linked" : "bind_on_receipt",
  };
}
