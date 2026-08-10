import type { AccessCapability } from "@/lib/commerce/whop-catalog";
import { type EntitlementRecord, evaluateEntitlement } from "@/lib/commerce/whop-rules";

/**
 * GRID marketplace access layer.
 *
 * Paid entry and clinical authority are separate gates and neither one substitutes
 * for the other. A purchased access pass decides whether an account may participate
 * in the marketplace at all; human credential and malpractice verification still
 * decides whether a provider may publish, accept work, or be paid. Both must pass.
 */

export const gridMarketplaceActions = [
  "browse",
  "publish_listing",
  "send_request",
  "receive_request",
  "list_location",
  "receive_payout",
] as const;

export type GridMarketplaceAction = (typeof gridMarketplaceActions)[number];

const requiredCapability: Record<GridMarketplaceAction, AccessCapability> = {
  browse: "grid_browse",
  publish_listing: "grid_publish_listing",
  send_request: "grid_send_request",
  receive_request: "grid_receive_request",
  list_location: "grid_list_location",
  receive_payout: "grid_receive_payout",
};

/**
 * Actions that put a provider in front of real work. These stay blocked until a
 * human has verified licensure and malpractice coverage, regardless of payment.
 */
const credentialGatedActions: readonly GridMarketplaceAction[] = ["publish_listing", "receive_request", "receive_payout"];

export const gridAccessDenialReasons = [
  "no_entitlement",
  "entitlement_expired",
  "entitlement_grace",
  "entitlement_revoked",
  "entitlement_inactive",
  "capability_not_included",
  "credential_review_pending",
] as const;

export type GridAccessDenialReason = (typeof gridAccessDenialReasons)[number];

export type GridAccessDecision =
  | { allowed: true; action: GridMarketplaceAction; tierKey: string }
  | { allowed: false; action: GridMarketplaceAction; reason: GridAccessDenialReason; remediation: string; paymentRequired: boolean };

const remediationByReason: Record<GridAccessDenialReason, string> = {
  no_entitlement: "Purchase a GRID access pass to join the marketplace.",
  entitlement_expired: "Your GRID access pass has ended. Renew it to continue.",
  entitlement_grace: "Your GRID access pass is past due. Update billing on Whop to restore marketplace actions.",
  entitlement_revoked: "Your GRID access pass was revoked. Contact Klinikos support before requesting reinstatement.",
  entitlement_inactive: "Your GRID access pass is not active yet. It unlocks once the purchase is confirmed.",
  capability_not_included: "Your current access pass does not include this marketplace action. A different pass is required.",
  credential_review_pending: "Payment is recorded, but a human reviewer must verify your license and malpractice evidence before this action unlocks.",
};

/** Denials the buyer can resolve by purchasing or renewing, i.e. HTTP 402 rather than 403. */
const paymentResolvableReasons: readonly GridAccessDenialReason[] = [
  "no_entitlement",
  "entitlement_expired",
  "entitlement_grace",
  "entitlement_inactive",
  "capability_not_included",
];

export function evaluateGridMarketplaceAccess(input: {
  action: GridMarketplaceAction;
  entitlement: EntitlementRecord | null | undefined;
  /** Result of `providerReadyForGrid`; only consulted for credential-gated actions. */
  providerReady?: boolean;
  now?: Date;
}): GridAccessDecision {
  const now = input.now ?? new Date();
  const evaluated = evaluateEntitlement(input.entitlement, now);

  if (!evaluated.active) {
    const reason: GridAccessDenialReason =
      evaluated.reason === "no_entitlement" ? "no_entitlement"
      : evaluated.reason === "expired" ? "entitlement_expired"
      : evaluated.reason === "grace" ? "entitlement_grace"
      : evaluated.reason === "revoked" ? "entitlement_revoked"
      : "entitlement_inactive";
    return { allowed: false, action: input.action, reason, remediation: remediationByReason[reason], paymentRequired: paymentResolvableReasons.includes(reason) };
  }

  if (!evaluated.capabilities.includes(requiredCapability[input.action])) {
    return {
      allowed: false,
      action: input.action,
      reason: "capability_not_included",
      remediation: remediationByReason.capability_not_included,
      paymentRequired: true,
    };
  }

  if (credentialGatedActions.includes(input.action) && !input.providerReady) {
    return {
      allowed: false,
      action: input.action,
      reason: "credential_review_pending",
      remediation: remediationByReason.credential_review_pending,
      paymentRequired: false,
    };
  }

  return { allowed: true, action: input.action, tierKey: input.entitlement?.tierKey ?? "" };
}

/**
 * Summarise which marketplace actions are currently open, for workspace rendering.
 * The summary is derived from the same rules the API guard uses, so the interface
 * cannot show an action the API would reject.
 */
export function summarizeGridMarketplaceAccess(input: {
  entitlement: EntitlementRecord | null | undefined;
  providerReady?: boolean;
  now?: Date;
}) {
  const decisions = gridMarketplaceActions.map((action) => evaluateGridMarketplaceAccess({ ...input, action }));
  return {
    allowed: decisions.filter((decision) => decision.allowed).map((decision) => decision.action),
    blocked: decisions
      .filter((decision): decision is Extract<GridAccessDecision, { allowed: false }> => !decision.allowed)
      .map((decision) => ({ action: decision.action, reason: decision.reason, remediation: decision.remediation })),
    paymentRequired: decisions.some((decision) => !decision.allowed && decision.paymentRequired),
    credentialReviewPending: decisions.some((decision) => !decision.allowed && decision.reason === "credential_review_pending"),
  };
}
