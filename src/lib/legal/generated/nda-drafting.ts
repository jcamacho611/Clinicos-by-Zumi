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

export type LegalReviewCategory =
  | "governing_law_venue"
  | "restrictive_covenant"
  | "liquidated_damages"
  | "signer_authority"
  | "disclosure_scope"
  | "companion_agreement"
  | "privacy_data";

export type LegalReviewResolution = {
  outcome: "approved" | "removed" | "revised" | "not_applicable";
  resolvedAt: string;
  resolvedBy: string;
  note?: string;
};

export type LegalReviewItem = {
  key: string;
  category: LegalReviewCategory;
  required: boolean;
  severity: "blocking" | "advisory";
  rationale: string;
  resolution?: LegalReviewResolution;
};

export type NdaDraftInput = {
  recipientName: string;
  recipientEntity?: string;
  recipientState: string;
  relationshipType: NdaRelationshipType;
  permittedPurpose: string;
  disclosureLevel: DisclosureLevel;
};

export type NdaDraftPackage = {
  title: string;
  recipientJurisdiction: string;
  modules: string[];
  companionAgreements: string[];
  warnings: string[];
  disclosurePlan: {
    level: `Level ${DisclosureLevel}`;
    allowed: string[];
    prohibited: string[];
  };
  draftingTargets: {
    confidentialityYears: number;
    nonCircumventionMonths: number | null;
    liquidatedDamagesUsd: {
      categoryI: number;
      categoryII: number;
      categoryIII: number;
      reviewRequired: true;
    };
  };
  reviewItems: LegalReviewItem[];
  counselReviewRequired: true;
  productionApproved: false;
};

const stateNames: Record<string, string> = {
  CA: "California",
  DE: "Delaware",
  FL: "Florida",
  NJ: "New Jersey",
  NY: "New York",
  TX: "Texas",
};

function jurisdiction(value: string) {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  return stateNames[upper] ?? (trimmed || "Recipient jurisdiction to be confirmed");
}

function reviewItem(
  key: string,
  category: LegalReviewCategory,
  rationale: string,
  severity: "blocking" | "advisory" = "blocking",
): LegalReviewItem {
  return { key, category, required: true, severity, rationale };
}

const crownJewelExclusions = [
  "PHI or patient databases without separate lawful authority",
  "Production credentials, API secrets, signing keys, or encryption keys",
  "Unrestricted source code or unrestricted database/admin access",
];

export function buildNdaDraftPackage(input: NdaDraftInput): NdaDraftPackage {
  const recipientJurisdiction = jurisdiction(input.recipientState);
  const modules = [
    "Core confidentiality and restricted-use terms",
    "Trade-secret and intellectual-property protection",
    "AI, cloud, and third-party-system restrictions",
    "Protected reporting and DTSA immunity notice",
    "Healthcare-data / PHI exclusion",
    "Future-corporation assignment language",
    "State-law savings clause",
  ];
  const companionAgreements: string[] = [];
  const reviewItems: LegalReviewItem[] = [
    reviewItem(
      "governing-law-venue-review",
      "governing_law_venue",
      `Final governing law and venue must be reviewed for the actual parties, transaction contacts, company formation state, and recipient jurisdiction (${recipientJurisdiction}).`,
    ),
    reviewItem(
      "disclosure-scope-review",
      "disclosure_scope",
      `Confirm that Level ${input.disclosureLevel} is the minimum necessary disclosure scope for the permitted purpose and does not include separately governed crown-jewel access.`,
    ),
    reviewItem(
      "signer-authority-review",
      "signer_authority",
      "Confirm the legal identity and signing authority of every required signer before approval for signature.",
    ),
    reviewItem(
      "liquidated-damages-review",
      "liquidated_damages",
      "Liquidated-damages figures are drafting targets only. Counsel must review proportionality, applicable law, remedy structure, and whether the clause should be revised or removed.",
    ),
  ];

  const usesLimitedNonCircumvention = input.relationshipType === "strategic_partner" || input.relationshipType === "referral";
  if (usesLimitedNonCircumvention) {
    modules.push("Limited non-circumvention for specifically introduced opportunities");
    companionAgreements.push("Strategic Partner / Referral Agreement before compensation, exclusivity, or authority is granted");
    reviewItems.push(reviewItem(
      "restrictive-covenant-jurisdiction-review",
      "restrictive_covenant",
      `The proposed limited introduced-opportunity restriction requires ${recipientJurisdiction}-specific review and transaction-specific tailoring before use. The generator does not decide enforceability.`,
    ));
  }

  if (["contractor", "developer", "consultant"].includes(input.relationshipType)) {
    companionAgreements.push("Contractor / Consulting Agreement");
    companionAgreements.push("IP / invention assignment for contributed code, designs, inventions, or documentation");
  }
  if (input.relationshipType === "clinic") {
    companionAgreements.push("Clinic Master Services Agreement");
    companionAgreements.push("Business Associate Agreement analysis before any PHI access");
  }
  if (input.relationshipType === "clinic_network") {
    companionAgreements.push("Clinic Network / Enterprise Agreement");
    companionAgreements.push("Business Associate Agreement analysis before any PHI access");
  }
  if (input.relationshipType === "vendor") {
    companionAgreements.push("Vendor / Data Processing / Security Addendum as applicable");
  }
  if (input.relationshipType === "education") {
    companionAgreements.push("Education / Institution Agreement");
  }
  if (input.relationshipType === "investor") {
    modules.push("Investor / due-diligence disclosure tailoring without unnecessary restrictive covenants");
  }

  if (companionAgreements.length > 0) {
    reviewItems.push(reviewItem(
      "companion-agreement-dependency-review",
      "companion_agreement",
      "Confirm which companion agreement must be executed before compensation, services, deeper access, exclusivity, data processing, or other authority begins.",
      "advisory",
    ));
  }

  if (["clinic", "clinic_network", "vendor"].includes(input.relationshipType) || input.disclosureLevel === 3) {
    reviewItems.push(reviewItem(
      "privacy-data-boundary-review",
      "privacy_data",
      "Confirm that the NDA disclosure plan does not substitute for a BAA, data-processing agreement, security review, or separate authorization required before regulated or sensitive data access.",
      "advisory",
    ));
  }

  if (recipientJurisdiction === "California" && usesLimitedNonCircumvention) {
    reviewItems.find((item) => item.key === "restrictive-covenant-jurisdiction-review")!.rationale =
      "California-specific review is required before using any non-circumvention or similar restrictive language. The generator does not decide enforceability.";
  }
  if (recipientJurisdiction === "Florida" && usesLimitedNonCircumvention) {
    reviewItems.find((item) => item.key === "restrictive-covenant-jurisdiction-review")!.rationale =
      "Florida-specific review is required to tailor any limited introduced-opportunity restriction to the actual transaction and protectable interests. The generator does not decide enforceability.";
  }

  const allowedByLevel: Record<DisclosureLevel, string[]> = {
    1: [
      "Public product description",
      "Public website and ordinary introductory materials",
      "High-level market and business discussion",
    ],
    2: [
      "Selected roadmap and commercialization strategy",
      "Selected pricing and partnership strategy",
      "Selected architecture overview without secrets or unrestricted source code",
      "Selected Grid / clinic-network strategy",
    ],
    3: [
      "Only specifically authorized restricted information with a documented business need",
      "Selected restricted materials explicitly identified in the approved disclosure plan",
    ],
  };

  return {
    title: `Master NDA Draft Package — ${input.recipientName.trim() || "Recipient"}`,
    recipientJurisdiction,
    modules,
    companionAgreements: [...new Set(companionAgreements)],
    warnings: [
      "Generated output is document-preparation support and must not be labeled attorney-approved unless counsel actually approves the exact version.",
      "The NDA does not authorize PHI, production credentials, secrets, unrestricted source code, private databases, or administrative access.",
      "Liquidated-damages values are drafting targets requiring legal review, not guaranteed penalties or recoveries.",
      "Do not promise equity, compensation, partnership status, exclusivity, services, or authority in the NDA when a separate agreement is required.",
    ],
    disclosurePlan: {
      level: `Level ${input.disclosureLevel}`,
      allowed: allowedByLevel[input.disclosureLevel],
      prohibited: [
        ...crownJewelExclusions,
        "Anything outside the specifically approved disclosure scope",
      ],
    },
    draftingTargets: {
      confidentialityYears: 5,
      nonCircumventionMonths: usesLimitedNonCircumvention ? 18 : null,
      liquidatedDamagesUsd: {
        categoryI: 25_000,
        categoryII: 50_000,
        categoryIII: 75_000,
        reviewRequired: true,
      },
    },
    reviewItems,
    counselReviewRequired: true,
    productionApproved: false,
  };
}
