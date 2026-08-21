import "server-only";

/**
 * The single source of truth for what Grid costs and what Klinikos earns.
 *
 * Before this existed, `klinikos-commercial.ts` held two separate Grid pricing models
 * that disagreed with each other, and two public pages rendered them side by side:
 * /klinikos advertised Grid Pro at $49/mo from one constant while /grid/pricing
 * advertised it at $39/mo from another. A visitor comparing the two pages was reading a
 * contradiction, and no code could tell which number was real.
 *
 * The second, larger problem was the fee. Both models applied "10% of the completed
 * transaction" to every kind of Grid activity. That is not a pricing preference, it is a
 * legal exposure: a percentage taken from a regulated clinical service or a professional
 * placement runs into fee-splitting, corporate-practice-of-medicine, and anti-kickback
 * rules that vary by state, and none of that applies to renting out an empty treatment
 * room. Charging one percentage across all of them treats a room and a clinician as the
 * same transaction. They are not.
 *
 * So fees are declared per resource class, and a class whose economics need a lawyer is
 * marked `requires_legal_review` and earns nothing until somebody qualified signs it off.
 * That is deliberately visible rather than hidden behind a default: an unreviewed class
 * that silently charged 10% would be the worst possible outcome.
 *
 * This module declares policy. It does not enforce it — `GridFeePolicyRecord` and
 * `allocateGridFinancialObligations` remain the server-side authority that decides what
 * an actual transaction owes, and they refuse to settle when no active policy applies.
 * Declaring a fee here does not create one in the database, and it must not: policy
 * reaches production through a reviewed migration, never through a constant.
 */

export type GridLegalReviewStatus =
  /** Reviewed and cleared for the economics described. */
  | "cleared"
  /** Economics are drafted but must not be charged until reviewed. */
  | "requires_legal_review";

export type GridFeeModel =
  /** A share of the transaction. Only where a share is lawful and ordinary. */
  | "percentage"
  /** A flat amount per completed transaction, independent of its value. */
  | "fixed_per_transaction"
  /** Klinikos earns nothing on the transaction itself. */
  | "none";

export interface GridFeePolicyDeclaration {
  readonly resourceClass: string;
  readonly label: string;
  /** What is actually being exchanged, in words a non-lawyer can check. */
  readonly whatIsExchanged: string;
  readonly feeModel: GridFeeModel;
  /** Basis points, when and only when `feeModel` is "percentage". */
  readonly percentBps: number | null;
  readonly fixedFeeCents: number | null;
  readonly minimumFeeCents: number | null;
  readonly maximumFeeCents: number | null;
  readonly legalReview: GridLegalReviewStatus;
  /** Why this class is treated the way it is. Reviewed by humans, so state the reason. */
  readonly rationale: string;
  readonly version: number;
}

/**
 * Fee policy by resource class.
 *
 * Ordering principle from the directive: listing is free, searching is free, and
 * declining costs nothing. A marketplace with no liquidity earns nothing from any
 * percentage, so friction at the edges is more expensive than a forgone fee.
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
    legalReview: "cleared",
    rationale:
      "Renting space is an ordinary commercial transaction. No professional fee is being divided, so a "
      + "share of the booking is the same arrangement any venue marketplace uses. Capped so a long "
      + "high-value booking does not produce a fee out of proportion to the work Klinikos did.",
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
    legalReview: "cleared",
    rationale: "Goods and rentals, not professional services. Ordinary marketplace economics apply.",
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
    legalReview: "cleared",
    rationale: "Goods resale. Lower than space because margins on supplies are thinner.",
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
    legalReview: "cleared",
    rationale:
      "Course enrolment is a consumer-style transaction and carries no patient-care referral. Klinikos "
      + "takes no position on whether training leads to a credential.",
    version: 1,
  },
  {
    resourceClass: "nonclinical_service",
    label: "Non-clinical services",
    whatIsExchanged: "Business services: cleaning, IT, marketing, administration.",
    feeModel: "percentage",
    percentBps: 1_000,
    fixedFeeCents: null,
    minimumFeeCents: 500,
    maximumFeeCents: 50_000,
    legalReview: "cleared",
    rationale: "No clinical service and no professional fee involved.",
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
    rationale:
      "A percentage of a clinician's compensation is the arrangement most likely to be read as fee "
      + "splitting, and corporate-practice-of-medicine rules differ by state. A flat placement fee is "
      + "charged for the matching work Klinikos actually performs and does not scale with the "
      + "professional's earnings. Nothing is charged on this class until reviewed.",
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
    rationale:
      "Taking a share of payment for patient care is the clearest anti-kickback and fee-splitting "
      + "exposure in the whole marketplace, and it can implicate payer contracts as well. Klinikos earns "
      + "nothing here. If this class is ever monetised it will be through a subscription for the tooling, "
      + "never a cut of the care.",
    version: 1,
  },
  {
    resourceClass: "referral",
    label: "Referral destinations",
    whatIsExchanged: "A patient being directed to another provider.",
    feeModel: "none",
    percentBps: null,
    fixedFeeCents: null,
    minimumFeeCents: null,
    maximumFeeCents: null,
    legalReview: "requires_legal_review",
    rationale:
      "Payment in exchange for a patient referral is the textbook anti-kickback problem. Klinikos "
      + "charges nothing for referral routing and should be extremely slow to change that.",
    version: 1,
  },
] as const;

/**
 * Participation tiers. One set of numbers, replacing the two that disagreed.
 *
 * Free tiers are load-bearing rather than generous: the marketplace has no liquidity yet,
 * and a subscription at the door is the surest way to keep it that way.
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

/** Classes that must not be charged yet, for display and for review checklists. */
export function gridClassesAwaitingLegalReview(): readonly GridFeePolicyDeclaration[] {
  return GRID_FEE_POLICY.filter((policy) => policy.legalReview === "requires_legal_review");
}

/**
 * What a completed transaction of this class would owe.
 *
 * Returns null — not zero — for a class that has not been reviewed, because zero reads
 * as "this is free" and null forces the caller to decide what to do about an unpriced
 * class. A caller that cannot handle null should not be charging.
 */
export function computeGridPlatformFeeCents(resourceClass: string, grossAmountCents: number): number | null {
  const policy = gridFeePolicyFor(resourceClass);
  if (!policy) return null;
  if (policy.legalReview === "requires_legal_review") return null;
  if (policy.feeModel === "none") return 0;
  if (policy.feeModel === "fixed_per_transaction") return policy.fixedFeeCents ?? 0;
  const raw = Math.round((grossAmountCents * (policy.percentBps ?? 0)) / 10_000);
  const floored = policy.minimumFeeCents == null ? raw : Math.max(raw, policy.minimumFeeCents);
  return policy.maximumFeeCents == null ? floored : Math.min(floored, policy.maximumFeeCents);
}
