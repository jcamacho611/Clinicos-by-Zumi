import "server-only";

import { getLegalConfigurationStatus, isLegalGateEnforcementEnabled } from "@/lib/legal/legal-config";
import { getLegalDocument, type LegalDocumentKey } from "@/lib/legal/document-registry";

const MEMBER_SIGNUP_REQUIRED_DOCUMENTS = [
  "website_terms",
  "privacy_policy",
] as const satisfies readonly LegalDocumentKey[];

// This remains false until the person-account rail records the exact accepted document
// versions and acceptance evidence transactionally with account creation. An env flag
// cannot stand in for that implementation or for counsel approval.
const VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED = false;

export function getMemberSignupReleaseState() {
  const legalConfiguration = getLegalConfigurationStatus();
  const documents = MEMBER_SIGNUP_REQUIRED_DOCUMENTS.map((key) => getLegalDocument(key));
  const approvedDocuments = documents.every((document) => document?.productionApproved === true);
  const operatorEnabled = process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED === "true";
  const legalGateEnabled = isLegalGateEnforcementEnabled();

  return {
    enabled: operatorEnabled
      && legalGateEnabled
      && legalConfiguration.ready
      && approvedDocuments
      && VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED,
    operatorEnabled,
    legalGateEnabled,
    legalConfigurationReady: legalConfiguration.ready,
    approvedDocuments,
    acceptanceRailImplemented: VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED,
  } as const;
}
