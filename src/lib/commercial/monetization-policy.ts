import "server-only";

import {
  gridFeePolicyFor,
  gridPolicyHasCounselClearance,
  type GridFeePolicyDeclaration,
} from "@/lib/commercial/grid-economics";

/**
 * The server-owned gate between a persisted Grid fee policy and a real settlement.
 *
 * `grid-economics.ts` declares what Klinikos proposes to charge per class and fails
 * closed until counsel clearance carries evidence. `GridFeePolicyRecord` rows are the
 * separate operational lever that the allocator actually reads. Nothing previously
 * connected the two, so an ordinary "set a default marketplace fee" action could apply
 * a percentage to a referral or to patient care.
 *
 * This module is that connection. It is deliberately the only place that decides
 * whether a fee *shape* may touch a transaction *class*, so the rule is testable and
 * cannot drift into scattered conditionals.
 *
 * A percentage of professional medical fees, or payment tied to a patient referral, is
 * not something a platform may assume is permissible. New York restricts fee splitting
 * connected with professional care, and the federal Anti-Kickback Statute can reach
 * remuneration intended to induce or reward referrals for federally reimbursable
 * services. Those classes therefore require counsel clearance carrying evidence, and
 * absent it this module refuses rather than defaults.
 */

export type MonetizationOutcome =
  /** No fee may be charged for this class, and none was requested. */
  | "free"
  /** A flat per-transaction fee is declared for this class and cleared. */
  | "fixed_transaction_fee"
  /** A percentage marketplace fee is declared for this class and cleared. */
  | "percentage_marketplace_fee"
  /** A percentage was requested for a class that must not carry one. */
  | "percentage_fee_prohibited"
  /** Any fee was requested for a class declared as zero-fee. */
  | "fee_prohibited"
  /** The class is unrecognised, or is declared fee-bearing without counsel clearance. */
  | "manual_review_required";

export interface MonetizationDecision {
  readonly outcome: MonetizationOutcome;
  /** True only for outcomes that permit the requested fee shape to settle. */
  readonly permitted: boolean;
  /** The declared class this transaction resolved to, when one exists. */
  readonly feeClass: string | null;
  /** Operator-facing explanation. Safe to surface; never legal advice. */
  readonly reason: string;
}

/**
 * Grid demand kinds that carry no fee-policy declaration of their own.
 *
 * These are intentionally absent rather than forgotten: "work", "service", "network"
 * and "organization" each span both ordinary commerce and regulated professional
 * activity depending on what is actually being exchanged, so no single class-level
 * declaration is truthful for them. They resolve to `manual_review_required` whenever a
 * fee is requested.
 */
const DEMAND_KIND_TO_FEE_CLASS: Readonly<Record<string, string>> = {
  space: "space",
  equipment: "equipment",
  product: "product",
  education: "education",
  provider: "provider",
  referral: "referral",
};

/**
 * Resolves the declared fee class for a transaction.
 *
 * `resourceKind` is an unconstrained text column, so it is only trusted when it names a
 * class that actually exists in the declaration. Otherwise the demand kind decides, and
 * an unmapped demand kind yields `null` so the caller fails closed.
 */
export function gridFeeClassForTransaction(input: {
  resourceKind: string | null;
  demandKind: string;
}): string | null {
  const fromResource = input.resourceKind?.trim();
  if (fromResource && gridFeePolicyFor(fromResource)) return fromResource;
  return DEMAND_KIND_TO_FEE_CLASS[input.demandKind.trim()] ?? null;
}

function decision(
  outcome: MonetizationOutcome,
  feeClass: string | null,
  reason: string,
): MonetizationDecision {
  const permitted =
    outcome === "free" || outcome === "fixed_transaction_fee" || outcome === "percentage_marketplace_fee";
  return { outcome, permitted, feeClass, reason };
}

function evaluateAgainstDeclaration(
  policy: GridFeePolicyDeclaration,
  feeClass: string,
  platformFeeBps: number,
  platformFeeFlatCents: number,
): MonetizationDecision {
  const chargesSomething = platformFeeBps > 0 || platformFeeFlatCents > 0;

  if (policy.feeModel === "none") {
    if (!chargesSomething) {
      return decision("free", feeClass, `Klinikos charges no platform fee for ${policy.label.toLowerCase()}.`);
    }
    if (platformFeeBps > 0) {
      return decision(
        "percentage_fee_prohibited",
        feeClass,
        `A percentage platform fee cannot be applied to ${policy.label.toLowerCase()}. This class is declared zero-fee and has not been cleared for any transaction economics.`,
      );
    }
    return decision(
      "fee_prohibited",
      feeClass,
      `A platform fee cannot be applied to ${policy.label.toLowerCase()}. This class is declared zero-fee.`,
    );
  }

  if (!chargesSomething) {
    return decision("free", feeClass, `No platform fee was requested for ${policy.label.toLowerCase()}.`);
  }

  if (policy.feeModel === "fixed_per_transaction" && platformFeeBps > 0) {
    return decision(
      "percentage_fee_prohibited",
      feeClass,
      `${policy.label} is declared as a flat per-transaction fee only. A percentage of the transaction amount is not an approved model for this class.`,
    );
  }

  if (!gridPolicyHasCounselClearance(policy)) {
    return decision(
      "manual_review_required",
      feeClass,
      `${policy.label} carries no counsel clearance evidence, so a platform fee cannot be activated for this class yet.`,
    );
  }

  return decision(
    policy.feeModel === "percentage" ? "percentage_marketplace_fee" : "fixed_transaction_fee",
    feeClass,
    `${policy.label} is cleared for the requested fee model.`,
  );
}

/**
 * Decides whether a persisted fee shape may be applied to a concrete transaction.
 *
 * Called both when a policy row is created and again when the allocator resolves one, so
 * rows persisted before this gate existed still cannot settle a prohibited fee.
 */
export function evaluateGridMonetizationPolicy(input: {
  resourceKind: string | null;
  demandKind: string;
  platformFeeBps: number;
  platformFeeFlatCents: number;
}): MonetizationDecision {
  const feeClass = gridFeeClassForTransaction(input);
  const chargesSomething = input.platformFeeBps > 0 || input.platformFeeFlatCents > 0;

  if (!feeClass) {
    if (!chargesSomething) {
      return decision("free", null, "No platform fee was requested.");
    }
    return decision(
      "manual_review_required",
      null,
      `No Klinikos fee-policy class is declared for a "${input.demandKind}" transaction, so a platform fee cannot be applied to it automatically.`,
    );
  }

  const policy = gridFeePolicyFor(feeClass);
  if (!policy) {
    return decision(
      "manual_review_required",
      feeClass,
      `Fee class "${feeClass}" has no declaration, so a platform fee cannot be applied to it.`,
    );
  }

  return evaluateAgainstDeclaration(policy, feeClass, input.platformFeeBps, input.platformFeeFlatCents);
}

/**
 * Whether a fee shape can be safely activated for a policy scope at write time.
 *
 * A `default`-scoped policy is resolved by the allocator for *any* transaction that has
 * no more specific row, including referrals and patient care. A fee-bearing default is
 * therefore never provably safe, and is refused regardless of the classes that happen to
 * exist today.
 */
export function evaluateGridFeePolicyScope(input: {
  scopeKind: "default" | "demand_kind" | "resource_kind";
  scopeValue: string | null;
  platformFeeBps: number;
  platformFeeFlatCents: number;
}): MonetizationDecision {
  const chargesSomething = input.platformFeeBps > 0 || input.platformFeeFlatCents > 0;

  if (input.scopeKind === "default") {
    if (!chargesSomething) {
      return decision("free", null, "A zero-fee default policy applies no platform fee.");
    }
    return decision(
      "manual_review_required",
      null,
      "A fee-bearing default policy would also apply to referral and regulated clinical transactions. Scope the policy to a specific demand or resource kind instead.",
    );
  }

  const scopeValue = input.scopeValue?.trim() ?? "";
  if (!scopeValue) {
    return decision("manual_review_required", null, "A scoped fee policy requires a scope value.");
  }

  return evaluateGridMonetizationPolicy({
    resourceKind: input.scopeKind === "resource_kind" ? scopeValue : null,
    demandKind: input.scopeKind === "demand_kind" ? scopeValue : "",
    platformFeeBps: input.platformFeeBps,
    platformFeeFlatCents: input.platformFeeFlatCents,
  });
}
