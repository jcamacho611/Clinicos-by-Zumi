export type NdaRelationshipType =
  | "strategic_partner"
  | "advisor"
  | "consultant"
  | "contractor"
  | "developer"
  | "clinic"
  | "clinic_network"
  | "investor"
  | "vendor"
  | "education"
  | "referral"
  | "other";

export type DisclosureLevel = 1 | 2 | 3;

export type NdaGeneratorInput = {
  recipientName: string;
  recipientEntity?: string;
  recipientState: string;
  relationshipType: NdaRelationshipType;
  permittedPurpose: string;
  disclosureLevel: DisclosureLevel;
};

export type NdaGeneratorResult = {
  title: string;
  governingLawRecommendation: string;
  venueInstruction: string;
  confidentialityYears: number;
  nonCircumventionMonths: number;
  damages: {
    categoryI: number;
    categoryII: number;
    categoryIII: number;
    securityIncident: "documented-remediation-costs";
  };
  modules: string[];
  companionAgreements: string[];
  warnings: string[];
  disclosurePlan: { level: string; allowed: string[]; prohibited: string[] };
  signatureChecklist: string[];
};

const stateNames: Record<string, string> = {
  FL: "Florida",
  NY: "New York",
  DE: "Delaware",
  CA: "California",
  TX: "Texas",
  NJ: "New Jersey",
};

function normalizeState(value: string) {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  return stateNames[upper] ?? trimmed;
}

export function buildNdaPackage(input: NdaGeneratorInput): NdaGeneratorResult {
  const state = normalizeState(input.recipientState || "Recipient state to be confirmed");
  const modules = [
    "Core confidentiality and restricted-use terms",
    "Trade-secret and intellectual-property protection",
    "AI / cloud / third-party-system restrictions",
    "Protected reporting and DTSA immunity notice",
    "Healthcare-data / PHI exclusion",
    "Future-corporation assignment language",
    "State-law savings clause",
  ];

  const companionAgreements: string[] = [];
  if (["strategic_partner", "referral"].includes(input.relationshipType)) {
    modules.push("Limited non-circumvention for specifically introduced opportunities");
    companionAgreements.push("Strategic Partner / Referral Agreement before compensation, exclusivity, or authority is granted");
  }
  if (["contractor", "developer", "consultant"].includes(input.relationshipType)) {
    companionAgreements.push("Contractor agreement");
    companionAgreements.push("IP / invention assignment for contributed code, designs, inventions, or documentation");
  }
  if (input.relationshipType === "clinic") {
    companionAgreements.push("Clinic Master Services Agreement");
    companionAgreements.push("Business Associate Agreement only if the relationship actually requires PHI access");
  }
  if (input.relationshipType === "clinic_network") {
    companionAgreements.push("Clinic Network / Enterprise Agreement");
    companionAgreements.push("BAA analysis before any PHI access");
  }
  if (input.relationshipType === "investor") {
    modules.push("Investor/due-diligence disclosure tailoring; avoid unnecessary restrictive covenants");
  }
  if (input.relationshipType === "vendor") companionAgreements.push("Vendor / Data Processing / Security Addendum as applicable");
  if (input.relationshipType === "education") companionAgreements.push("Education / Institution Agreement");

  const warnings = [
    "Template output is document-preparation support and must not be labeled attorney-approved unless counsel actually approves it.",
    "Do not treat the NDA as authorization to disclose PHI, production credentials, unrestricted source code, or security secrets.",
    "Liquidated-damages amounts are drafting targets, not guaranteed recoveries; state-specific review is required before signature.",
    "Do not promise equity, compensation, partnership status, or authority in the NDA. Use a separate signed agreement.",
  ];

  if (state.toLowerCase() === "florida") {
    modules.push("Florida legitimate-business-interest / restrictive-covenant module");
    warnings.push("Florida-specific restrictive-covenant language must remain tied to legitimate business interests and must not become a general non-compete.");
  }
  if (state.toLowerCase() === "california") {
    warnings.push("California can materially limit restrictive covenants. Non-circumvention / non-solicitation language requires California-specific review before use.");
  }

  const levelAllowed: Record<DisclosureLevel, string[]> = {
    1: ["Public product description", "Public website and ordinary introductory materials", "High-level market and business discussion"],
    2: ["Roadmap", "Pricing and commercialization strategy", "Selected architecture overview", "Clinic-network / Grid strategy", "Selected financial and partnership information"],
    3: ["Only specifically authorized restricted information with a documented business need"],
  };

  const prohibited = input.disclosureLevel < 3
    ? ["Unrestricted source code", "Production credentials or API secrets", "Private encryption/signing keys", "PHI or patient databases", "Unrestricted admin/database access"]
    : ["Anything outside the separately authorized Level 3 scope", "PHI unless separate legal/privacy requirements are satisfied"];

  return {
    title: `Master NDA Package — ${input.recipientName || "Recipient"}`,
    governingLawRecommendation: `${state} module should be evaluated because the recipient is located in ${state}; final governing law should have a reasonable relationship to the parties or transaction.`,
    venueInstruction: "Select county/state or federal venue only after confirming the recipient, entity, transaction location, and company formation state.",
    confidentialityYears: 5,
    nonCircumventionMonths: 18,
    damages: {
      categoryI: 25000,
      categoryII: 50000,
      categoryIII: 75000,
      securityIncident: "documented-remediation-costs",
    },
    modules,
    companionAgreements: [...new Set(companionAgreements)],
    warnings,
    disclosurePlan: {
      level: `Level ${input.disclosureLevel}`,
      allowed: levelAllowed[input.disclosureLevel],
      prohibited,
    },
    signatureChecklist: [
      "Recipient full legal name",
      "Recipient entity and signatory authority, if applicable",
      "Recipient state / principal place of business",
      "Specific permitted purpose",
      "Effective date",
      "Selected governing law and venue",
      "Disclosure level",
      "State-specific restrictive-covenant review",
      "Liquidated-damages review",
      "Whether any companion agreement is required before deeper access",
    ],
  };
}
