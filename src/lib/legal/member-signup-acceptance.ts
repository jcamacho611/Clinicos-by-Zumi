import "server-only";

import { createHash } from "node:crypto";
import { getLegalDocument } from "@/lib/legal/document-registry";

export type MemberSignupLegalDocumentKind = "agreement" | "notice";

export type MemberSignupLegalEvidenceDocument = {
  documentKey: "website_terms" | "privacy_policy";
  documentVersion: string;
  title: string;
  effectiveDate: string;
  kind: MemberSignupLegalDocumentKind;
  documentSnapshot: string;
  documentSha256: string;
  acknowledgments: readonly string[];
};

export type MemberSignupAcceptanceEvidence = {
  documents: readonly MemberSignupLegalEvidenceDocument[];
};

export type MemberSignupAcceptanceInput = {
  websiteTermsAccepted: true;
  websiteTermsVersion: string;
  privacyPolicyAcknowledged: true;
  privacyPolicyVersion: string;
};

type MemberSignupSourceDefinition = {
  documentKey: MemberSignupLegalEvidenceDocument["documentKey"];
  kind: MemberSignupLegalDocumentKind;
  sourceText: string | null;
  acknowledgments: readonly string[];
};

/**
 * Exact contract text belongs here (or in an equally authoritative server-only source)
 * only after the approved document exists. The current public legal pages are governance
 * and draft notices, not the final Website Terms/Privacy source, so hashing them would
 * manufacture evidence. Null therefore means exactly what it says: the acceptance source
 * is not ready and public signup must remain closed.
 */
const MEMBER_SIGNUP_ACCEPTANCE_SOURCES: readonly MemberSignupSourceDefinition[] = [
  {
    documentKey: "website_terms",
    kind: "agreement",
    sourceText: null,
    acknowledgments: ["I agree to the Website Terms of Use."],
  },
  {
    documentKey: "privacy_policy",
    kind: "notice",
    sourceText: null,
    acknowledgments: ["I acknowledge the Privacy Policy."],
  },
] as const;

export class MemberSignupAcceptanceUnavailableError extends Error {
  constructor(message = "Required member legal documents are not ready for acceptance.") {
    super(message);
    this.name = "MemberSignupAcceptanceUnavailableError";
  }
}

export class MemberSignupAcceptanceMismatchError extends Error {
  constructor(message = "The legal document version changed. Review the current documents and try again.") {
    super(message);
    this.name = "MemberSignupAcceptanceMismatchError";
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function getMemberSignupAcceptanceReadiness() {
  const documents = MEMBER_SIGNUP_ACCEPTANCE_SOURCES.map((source) => {
    const definition = getLegalDocument(source.documentKey);
    return {
      documentKey: source.documentKey,
      kind: source.kind,
      title: definition?.title ?? source.documentKey,
      documentVersion: definition?.version ?? null,
      route: definition?.route ?? null,
      productionApproved: definition?.productionApproved === true,
      sourceAvailable: Boolean(source.sourceText?.trim()),
    } as const;
  });

  return {
    sourcesReady: documents.every((document) => document.sourceAvailable && document.documentVersion),
    documents,
  } as const;
}

function resolveSource(
  source: MemberSignupSourceDefinition,
  requestedVersion: string,
): MemberSignupLegalEvidenceDocument {
  const definition = getLegalDocument(source.documentKey);
  if (!definition || !source.sourceText?.trim()) {
    throw new MemberSignupAcceptanceUnavailableError();
  }
  if (!definition.productionApproved) {
    throw new MemberSignupAcceptanceUnavailableError("Required member legal documents are not production-approved.");
  }
  if (requestedVersion !== definition.version) {
    throw new MemberSignupAcceptanceMismatchError();
  }

  const documentSnapshot = source.sourceText.trim();
  return {
    documentKey: source.documentKey,
    documentVersion: definition.version,
    title: definition.title,
    effectiveDate: definition.effectiveDate,
    kind: source.kind,
    documentSnapshot,
    documentSha256: sha256(documentSnapshot),
    acknowledgments: source.acknowledgments,
  };
}

/**
 * Browser input proves only an affirmative click against a version identifier. The
 * server re-resolves the canonical definition and exact source snapshot. Trusted text
 * and hashes never come from the request body.
 */
export function resolveMemberSignupAcceptance(
  input: MemberSignupAcceptanceInput,
): MemberSignupAcceptanceEvidence {
  if (input.websiteTermsAccepted !== true || input.privacyPolicyAcknowledged !== true) {
    throw new MemberSignupAcceptanceMismatchError("Required legal acknowledgments are missing.");
  }

  const terms = MEMBER_SIGNUP_ACCEPTANCE_SOURCES.find((source) => source.documentKey === "website_terms");
  const privacy = MEMBER_SIGNUP_ACCEPTANCE_SOURCES.find((source) => source.documentKey === "privacy_policy");
  if (!terms || !privacy) throw new MemberSignupAcceptanceUnavailableError();

  return {
    documents: [
      resolveSource(terms, input.websiteTermsVersion),
      resolveSource(privacy, input.privacyPolicyVersion),
    ],
  };
}
