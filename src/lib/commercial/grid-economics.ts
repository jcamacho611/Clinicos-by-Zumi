import "server-only";

/**
 * The single source of truth for proposed Grid participation pricing and transaction
 * economics.
 *
 * Important boundary: this module may describe a business proposal, but it cannot turn
 * that proposal into legal approval or a production charge. Actual settlement remains
 * server-owned through the persisted Grid fee-policy records and financial-obligation
 * allocator. A fee-bearing declaration here is chargeable only after counsel clearance
 * is represented with review evidence and a separately reviewed production policy is
 * activated on the server.
 */

export type GridLegalReviewStatus =
  /** Business economics drafted for evaluation. Not active and not legal approval. */
  | "business_draft"
  /** Higher-risk class that requires explicit counsel review before monetization. */
  | "requires_legal_review"
  /** Counsel reviewed the stated economics for the recorded scope. */
  | "counsel_cleared";

export type GridFeeModel =
  | "percentage"
  | "fixed_per_transaction"
  | "none";

export type GridLegalReviewEvidence = {
  /** Human/legal reviewer or firm name. Do not put privileged advice here. */
  readonly reviewedBy: string;
  readonly reviewedAt: string;
  /** Durable internal reference to the approval record, memo, or contract review. */
  readonly evidenceRef: string;
  /** Jurisdictional scope actually covered by the review. */
  readonly jurisdictionScope: readonly string[];
};

export interface GridFeePolicyDeclaration {
  readonly resourceClass: string;
  readonly label: string;
  readonly whatIsExchanged: string;
  readonly feeModel: GridFeeModel;
  readonly percentBps: number | null;
  readonly fixedFeeCents: number | null;
  readonly minimumFeeCents: number | null;
  readonly maximumFeeCents: number | null;
  readonly legalReview: GridLegalReviewStatus;
  readonly legalReviewEvidence: GridLegalReviewEvidence | null;
  /** Commercial rationale only. This field must never be written as legal advice. */
  readonly rationale: string;
  readonly version: number;
}

/**
 * Proposed economics by resource class.
 *
 * Listing, searching and declining remain free. Fee-bearing rows below are business
 * proposals, not active charges, until `counsel_cleared` carries evidence and the
 * separately persisted production policy is activated. This deliberately fails closed.
 */
export const GRID_FEE_POLICY: readonly GridFeePolicyDeclaration[] = [
  {
    resourceClass: "space",
    label: "Space and rooms",
    whatIsExchanged: "Time in a physical room, chair, suite or facility.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: 500,
    maximumFeeCents: 50_000,
    legalReview: "business_draft",
    legalReviewEvidence: null,
    rationale:
      "Business proposal: a capped marketplace fee for completed facility-capacity bookings. It is not active until the legal and production-policy gates are satisfied.",
    version: 1,
  },
  {
    resourceClass: "equipment",
    label: "Equipment",
    whatIsExchanged: "Use or transfer of a physical device.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: 500,
    maximumFeeCents: 50_000,
    legalReview: "business_draft",
    legalReviewEvidence: null,
    rationale:
      "Business proposal: a capped marketplace fee for a completed equipment transaction. It remains inactive until reviewed and activated through server-owned policy.",
    version: 1,
  },
  {
    resourceClass: "product",
    label: "Products and supplies",
    whatIsExchanged: "Physical goods sold between organizations.",
    feeModel: "percentage",
    percentBps: 800,
    fixedFeeCents: null,
    minimumFeeCents: 300,
    maximumFeeCents: 50_000,
    legalReview: "business_draft",
    legalReviewEvidence: null,
    rationale:
      "Business proposal: a lower capped fee for completed permitted-goods transactions because product margins may be thinner than facility-capacity margins.",
    version: 1,
  },
  {
    resourceClass: "education",
    label: "Education and training",
    whatIsExchanged: "A seat in a course or training programme.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: 200,
    maximumFeeCents: 25_000,
    legalReview: "business_draft",
    legalReviewEvidence: null,
    rationale:
      "Business proposal: a capped marketplace fee for completed education transactions. Buying training never creates a credential, license, or Grid eligibility by itself.",
    version: 1,
  },
  {
    resourceClass: "nonclinical_service",
    label: "Non-clinical services",
    whatIsExchanged: "Business services such as cleaning, IT, marketing, or administration.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: 500,
    maximumFeeCents: 50_000,
    legalReview: "business_draft",
    legalReviewEvidence: null,
    rationale:
      "Business proposal: a capped marketplace fee for completed non-clinical service transactions. It is not an active production fee until reviewed and activated.",
    version: 1,
  },
  {
    resourceClass: "provider",
    label: "Clinical staffing and professional coverage",
    whatIsExchanged: "A licensed person's working time.",
    feeModel: "fixed_per_transaction",
    percentBps: null,
    fixedFeeCents: 5_000,
    minimumFeeCents: null,
    maximumFeeCents: null,
    legalReview: "requires_legal_review",
    legalReviewEvidence: null,
    rationale:
      "Higher-sensitivity proposal. Professional-compensation and placement economics can implicate state-specific fee-splitting, corporate-practice, employment, referral, and payer rules. No platform fee is active here before counsel review.",
    version: 1,
  },
  {
    resourceClass: "regulated_clinical_service",
    label: "Regulated clinical services",
    whatIsExchanged: "Care delivered to a patient.",
    feeModel: "none",
    percentBps: null,
    fixedFeeCents: null,
    minimumFeeCents: null,
    maximumFeeCents: null,
    legalReview: "requires_legal_review",
    legalReviewEvidence: null,
    rationale:
      "Klinikos does not take a transaction percentage from patient care under the current policy. Any future monetization of this class requires separate counsel and payer review and should favor software/tooling economics rather than a cut of care.",
    version: 1,
  },
  {
    resourceClass: "referral",
    label: "Referral destinations",
    whatIsExchanged: "A patient being directed to another provider or organization.",
    feeModel: "none",
    percentBps: null,
    fixedFeeCents: null,
    minimumFeeCents: null,
    maximumFeeCents: null,
    legalReview: "requires_legal_review",
    legalReviewEvidence: null,
    rationale:
      "Klinikos does not charge for patient referral routing under the current policy. Any future economic model requires dedicated legal, payer, and jurisdictional review.",
    version: 1,
  },
] as const;

/**
 * Participation tiers. Free entry is load-bearing while Grid builds real liquidity.
 */
export const GRID_MEMBERSHIP = {
  individualFree: {
    key: "grid_individual_free",
    name: "Grid",
    monthlyPriceCents: 0,
    priceLabel: "Free",
    audience: "Clinicians, contractors and independent practitioners",
    includes: ["Profile, credentials and availability", "Search reviewed supply", "Receive and decline offers"],
  },
  individualPro: {
    key: "grid_pro",
    name: "Grid Pro",
    monthlyPriceCents: 4_900,
    priceLabel: "$49/mo",
    audience: "People who work through Grid regularly",
    includes: ["Priority matching", "Saved availability and searches", "Earnings and obligation history"],
  },
  organizationFree: {
    key: "grid_organization_free",
    name: "Grid for organizations",
    monthlyPriceCents: 0,
    priceLabel: "Free to list",
    audience: "Clinics and facilities publishing capacity",
    includes: ["Publish rooms, hours, services and placements", "Receive eligible offers", "Your eligibility rules enforced at match"],
  },
  organizationPro: {
    key: "grid_organization_pro",
    name: "Grid for organizations · Pro",
    monthlyPriceCents: 29_900,
    priceLabel: "from $299/mo",
    audience: "Organizations running Grid as an operating channel",
    includes: ["Everything in the free tier", "Offers, reservations and obligations", "Splits, payouts and settlement records", "Priority placement"],
  },
} as const;

export function gridFeePolicyFor(resourceClass: string): GridFeePolicyDeclaration | null {
  return GRID_FEE_POLICY.find((policy) => policy.resourceClass === resourceClass) ?? null;
}

export function gridPolicyHasCounselClearance(policy: GridFeePolicyDeclaration) {
  if (policy.legalReview !== "counsel_cleared") return false;
  const evidence = policy.legalReviewEvidence;
  return Boolean(
    evidence?.reviewedBy.trim()
    && evidence.reviewedAt.trim()
    && evidence.evidenceRef.trim()
    && evidence.jurisdictionScope.length > 0,
  );
}

/** All fee-policy classes that still need review evidence before a fee can be active. */
export function gridClassesAwaitingLegalReview(): readonly GridFeePolicyDeclaration[] {
  return GRID_FEE_POLICY.filter((policy) => !gridPolicyHasCounselClearance(policy));
}

/**
 * Proposed fee for a completed transaction.
 *
 * `none` is an explicit zero-fee policy. A fee-bearing draft returns null until counsel
 * clearance carries evidence. Actual production settlement still requires a separate,
 * active persisted server policy, so this helper never creates a charge by itself.
 */
export function computeGridPlatformFeeCents(resourceClass: string, grossAmountCents: number): number | null {
  const policy = gridFeePolicyFor(resourceClass);
  if (!policy) return null;
  if (policy.feeModel === "none") return 0;
  if (!gridPolicyHasCounselClearance(policy)) return null;
  if (policy.feeModel === "fixed_per_transaction") return policy.fixedFeeCents ?? 0;
  const raw = Math.round((grossAmountCents * (policy.percentBps ?? 0)) / 10_000);
  const floored = policy.minimumFeeCents == null ? raw : Math.max(raw, policy.minimumFeeCents);
  return policy.maximumFeeCents == null ? floored : Math.min(floored, policy.maximumFeeCents);
}
