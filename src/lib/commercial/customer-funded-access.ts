export const commercialCostBuckets = [
  "ai",
  "voice",
  "sms",
  "email",
  "maps",
  "document_processing",
  "eligibility",
  "identity_verification",
  "labs",
  "imaging",
  "telemedicine",
  "payments",
  "grid",
  "storage",
  "integrations",
  "other",
] as const;

export type CommercialCostBucket = (typeof commercialCostBuckets)[number];

export const fundingSources = ["included_allowance", "prepaid_balance", "authorized_overage"] as const;
export type FundingSource = (typeof fundingSources)[number];

export type CommercialFundingState = {
  subscriptionStatus: string;
  paymentConfirmed: boolean;
  entitlements: readonly string[];
  includedAllowanceRemainingCents: number;
  prepaidBalanceCents: number;
  authorizedOverageRemainingCents: number;
  demoMode: boolean;
  syntheticDataOnly: boolean;
};

export type CommercialAccessRequest = {
  capability: string;
  requiredEntitlement?: string | null;
  estimatedVariableCostCents?: number;
  costBucket?: CommercialCostBucket;
  allowSyntheticDemo?: boolean;
  policyBlocked?: boolean;
};

export type FundingAllocation = {
  source: FundingSource;
  amountCents: number;
};

export type CommercialAccessDecision =
  | {
      allowed: true;
      mode: "synthetic_demo" | "subscription" | "funded_usage";
      capability: string;
      estimatedVariableCostCents: number;
      allocations: FundingAllocation[];
    }
  | {
      allowed: false;
      reason: "policy_blocked" | "payment_required" | "upgrade_required" | "funds_required";
      capability: string;
      message: string;
      shortfallCents?: number;
    };

const PAID_STATUSES = new Set(["active"]);

function nonNegativeInteger(value: number | undefined) {
  if (value === undefined) return 0;
  if (!Number.isFinite(value) || value < 0) throw new Error("Commercial funding amounts must be finite and non-negative.");
  return Math.ceil(value);
}

export function allocateFundedUsage(
  estimatedVariableCostCents: number,
  state: Pick<
    CommercialFundingState,
    "includedAllowanceRemainingCents" | "prepaidBalanceCents" | "authorizedOverageRemainingCents"
  >,
): { allocations: FundingAllocation[]; shortfallCents: number } {
  let remaining = nonNegativeInteger(estimatedVariableCostCents);
  const allocations: FundingAllocation[] = [];

  const sources: Array<[FundingSource, number]> = [
    ["included_allowance", nonNegativeInteger(state.includedAllowanceRemainingCents)],
    ["prepaid_balance", nonNegativeInteger(state.prepaidBalanceCents)],
    ["authorized_overage", nonNegativeInteger(state.authorizedOverageRemainingCents)],
  ];

  for (const [source, available] of sources) {
    if (remaining === 0) break;
    const amountCents = Math.min(remaining, available);
    if (amountCents > 0) allocations.push({ source, amountCents });
    remaining -= amountCents;
  }

  return { allocations, shortfallCents: remaining };
}

/**
 * Commercial gate for any Klinikos capability that can create variable third-party cost.
 *
 * Constitutional commercial rule:
 * production spend must be backed by customer money or explicitly authorized customer
 * overage before the vendor/API call happens. The platform must not silently front
 * variable usage costs and hope to recover them later.
 *
 * This function is intentionally pure. A database-backed reservation service should
 * atomically reserve the returned allocations before a side-effecting vendor call.
 */
export function evaluateCustomerFundedAccess(
  state: CommercialFundingState,
  request: CommercialAccessRequest,
): CommercialAccessDecision {
  if (request.policyBlocked) {
    return {
      allowed: false,
      reason: "policy_blocked",
      capability: request.capability,
      message: "This capability is blocked by product or safety policy. Payment cannot override policy.",
    };
  }

  if (state.demoMode && state.syntheticDataOnly && request.allowSyntheticDemo) {
    return {
      allowed: true,
      mode: "synthetic_demo",
      capability: request.capability,
      estimatedVariableCostCents: 0,
      allocations: [],
    };
  }

  if (!state.paymentConfirmed || !PAID_STATUSES.has(state.subscriptionStatus)) {
    return {
      allowed: false,
      reason: "payment_required",
      capability: request.capability,
      message: "Production access activates only after a qualifying customer payment is confirmed.",
    };
  }

  const entitlement = request.requiredEntitlement?.trim();
  if (entitlement && !state.entitlements.includes(entitlement)) {
    return {
      allowed: false,
      reason: "upgrade_required",
      capability: request.capability,
      message: "This capability is not included in the organization’s current paid access level.",
    };
  }

  const estimatedVariableCostCents = nonNegativeInteger(request.estimatedVariableCostCents);
  if (estimatedVariableCostCents === 0) {
    return {
      allowed: true,
      mode: "subscription",
      capability: request.capability,
      estimatedVariableCostCents,
      allocations: [],
    };
  }

  const funding = allocateFundedUsage(estimatedVariableCostCents, state);
  if (funding.shortfallCents > 0) {
    return {
      allowed: false,
      reason: "funds_required",
      capability: request.capability,
      message: "This usage is not fully funded by the organization’s included allowance, prepaid balance, or authorized overage.",
      shortfallCents: funding.shortfallCents,
    };
  }

  return {
    allowed: true,
    mode: "funded_usage",
    capability: request.capability,
    estimatedVariableCostCents,
    allocations: funding.allocations,
  };
}
