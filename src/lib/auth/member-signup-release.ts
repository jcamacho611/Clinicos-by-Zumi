import "server-only";

import { getLegalConfigurationStatus, isLegalGateEnforcementEnabled } from "@/lib/legal/legal-config";
import { getLegalDocument, type LegalDocumentKey } from "@/lib/legal/document-registry";
import { getMemberSignupAcceptanceReadiness } from "@/lib/legal/member-signup-acceptance";

const MEMBER_SIGNUP_REQUIRED_DOCUMENTS = [
  "website_terms",
  "privacy_policy",
] as const satisfies readonly LegalDocumentKey[];

// The transaction/evidence rail now exists independently from whether counsel-approved
// source documents are available. Never collapse "mechanics implemented" into "terms are
// approved" or "public signup is authorized".
const VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED = true;

export function getMemberSignupReleaseState() {
  const legalConfiguration = getLegalConfigurationStatus();
  const documents = MEMBER_SIGNUP_REQUIRED_DOCUMENTS.map((key) => getLegalDocument(key));
  const approvedDocuments = documents.every((document) => document?.productionApproved === true);
  const acceptance = getMemberSignupAcceptanceReadiness();
  const acceptanceSourcesReady = acceptance.sourcesReady;
  const operatorEnabled = process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED === "true";
  const legalGateEnabled = isLegalGateEnforcementEnabled();

  return {
    enabled: operatorEnabled
      && legalGateEnabled
      && legalConfiguration.ready
      && approvedDocuments
      && acceptanceSourcesReady
      && VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED,
    operatorEnabled,
    legalGateEnabled,
    legalConfigurationReady: legalConfiguration.ready,
    approvedDocuments,
    acceptanceSourcesReady,
    acceptanceDocuments: acceptance.documents,
    acceptanceRailImplemented: VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED,
  } as const;
}
