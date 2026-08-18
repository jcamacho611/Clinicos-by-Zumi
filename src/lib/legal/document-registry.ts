import "server-only";

export type LegalDocumentKey =
  | "website_terms"
  | "access_terms"
  | "privacy_policy"
  | "cookie_notice"
  | "clinic_msa"
  | "clinic_baa"
  | "implementation_sow"
  | "security_addendum"
  | "acceptable_use"
  | "ai_terms"
  | "grid_marketplace_terms"
  | "grid_provider_terms"
  | "grid_location_terms"
  | "electronic_comms_consent";

export type LegalAudience = "public" | "evaluator" | "clinic" | "provider" | "location_partner" | "patient" | "staff";

export type LegalDocumentDefinition = {
  key: LegalDocumentKey;
  title: string;
  version: string;
  effectiveDate: string;
  route: string;
  mandatoryFor: LegalAudience[];
  counselReviewRequired: boolean;
  productionApproved: boolean;
  notes: string;
};

export const legalDocumentRegistry: LegalDocumentDefinition[] = [
  { key: "website_terms", title: "Website Terms of Use", version: "2026-08-18.1", effectiveDate: "2026-08-18", route: "/legal/terms", mandatoryFor: ["public"], counselReviewRequired: true, productionApproved: false, notes: "Operative public-site terms are published. Counsel review remains required for jurisdiction-specific, dispute, liability, consumer, marketplace, and healthcare provisions." },
  { key: "access_terms", title: "Access, Confidentiality & Intellectual Property Terms", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/access-terms", mandatoryFor: ["evaluator"], counselReviewRequired: true, productionApproved: false, notes: "Affirmative clickwrap required before proprietary evaluation access." },
  { key: "privacy_policy", title: "Privacy Notice", version: "2026-08-18.1", effectiveDate: "2026-08-18", route: "/legal/privacy", mandatoryFor: ["public", "evaluator", "clinic", "provider", "location_partner", "patient", "staff"], counselReviewRequired: true, productionApproved: false, notes: "Operative public-site notice is published; counsel review and deployment-specific updates remain required as subprocessors, jurisdictions, consumer features, and regulated data processing expand." },
  { key: "cookie_notice", title: "Cookie & Tracking Notice", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/cookies", mandatoryFor: ["public"], counselReviewRequired: true, productionApproved: false, notes: "Required when optional analytics/marketing technologies are active or applicable law requires consent." },
  { key: "clinic_msa", title: "Clinic Master Services Agreement", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/clinic-msa", mandatoryFor: ["clinic"], counselReviewRequired: true, productionApproved: false, notes: "$8,000 Founding Clinic Implementation and recurring relationship should be ordered through signed commercial documents." },
  { key: "clinic_baa", title: "Business Associate Agreement", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/baa", mandatoryFor: ["clinic"], counselReviewRequired: true, productionApproved: false, notes: "Template only until healthcare/privacy counsel approves and production controls/vendors are ready." },
  { key: "implementation_sow", title: "Founding Clinic Implementation SOW", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/implementation-sow", mandatoryFor: ["clinic"], counselReviewRequired: true, productionApproved: false, notes: "Defines implementation scope, exclusions, milestones, dependencies and fees." },
  { key: "security_addendum", title: "Security & Data Processing Addendum", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/security", mandatoryFor: ["clinic"], counselReviewRequired: true, productionApproved: false, notes: "Must only promise controls actually implemented or contractually committed." },
  { key: "acceptable_use", title: "Acceptable Use Policy", version: "2026-08-18.1", effectiveDate: "2026-08-18", route: "/legal/acceptable-use", mandatoryFor: ["public", "clinic", "provider", "location_partner", "staff"], counselReviewRequired: true, productionApproved: false, notes: "Operative platform-integrity rules prohibit unauthorized testing, scraping, security abuse, unauthorized PHI use, unsupported clinical automation, fraud, and illegal conduct." },
  { key: "ai_terms", title: "Klinikos Intelligence & Copilot Terms", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/ai", mandatoryFor: ["clinic", "provider", "staff"], counselReviewRequired: true, productionApproved: false, notes: "AI outputs remain drafts/suggestions and require human review for clinical/revenue/high-risk actions." },
  { key: "grid_marketplace_terms", title: "Klinikos GRID Marketplace Terms", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/grid", mandatoryFor: ["provider", "location_partner", "clinic"], counselReviewRequired: true, productionApproved: false, notes: "Marketplace economics, payments, disputes and platform role require counsel review." },
  { key: "grid_provider_terms", title: "GRID Provider Agreement & Acknowledgments", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/grid-provider", mandatoryFor: ["provider"], counselReviewRequired: true, productionApproved: false, notes: "Upload is not verification; contract label alone does not determine independent-contractor status." },
  { key: "grid_location_terms", title: "GRID Clinic & Location Partner Terms", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/grid-location", mandatoryFor: ["location_partner", "clinic"], counselReviewRequired: true, productionApproved: false, notes: "Covers facility authority, insurance, allowed services, safety, rental economics and incidents." },
  { key: "electronic_comms_consent", title: "Electronic Communications Consent", version: "2026-08-10.1", effectiveDate: "2026-08-10", route: "/legal/communications", mandatoryFor: ["patient", "provider", "clinic"], counselReviewRequired: true, productionApproved: false, notes: "Separate transactional operational communications from marketing consent and PHI-bearing communication approval." },
];

export function getLegalDocument(key: LegalDocumentKey) {
  return legalDocumentRegistry.find((document) => document.key === key);
}

export function requiredLegalDocuments(audience: LegalAudience) {
  return legalDocumentRegistry.filter((document) => document.mandatoryFor.includes(audience));
}
