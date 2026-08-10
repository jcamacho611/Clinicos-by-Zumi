import { z } from "zod";
import { accessProductKeys, getAccessProduct } from "@/lib/commerce/access-product-catalog";

/**
 * Deterministic rules for marketplace access payments.
 *
 * Pure functions only. The payment lifecycle, what each status implies for portal
 * access, and which transitions an administrator may record all live here so they
 * are testable without a database or a payment provider.
 */

export const accessPaymentProviders = ["manual", "whop", "stripe"] as const;
export type AccessPaymentProvider = (typeof accessPaymentProviders)[number];

export const accessPaymentStatuses = [
  "created",
  "pending_verification",
  "verified_paid",
  "failed",
  "refunded",
  "disputed",
  "held",
  "reconciled",
] as const;
export type AccessPaymentStatus = (typeof accessPaymentStatuses)[number];

export const portalAccessStatuses = ["pending", "granted", "suspended", "revoked"] as const;
export type PortalAccessStatus = (typeof portalAccessStatuses)[number];

export const paidOnboardingStatuses = ["pending", "in_review", "completed", "canceled"] as const;
export type PaidOnboardingStatus = (typeof paidOnboardingStatuses)[number];

/**
 * Allowed payment status transitions.
 *
 * `created` is the state at checkout handoff. `pending_verification` is a buyer who
 * came back with a reference that no webhook has confirmed yet. Terminal money
 * states (`refunded`, `disputed`) do not return to paid without a new payment.
 */
const paymentTransitions: Record<AccessPaymentStatus, readonly AccessPaymentStatus[]> = {
  created: ["pending_verification", "verified_paid", "failed", "held"],
  pending_verification: ["verified_paid", "failed", "held"],
  verified_paid: ["refunded", "disputed", "reconciled", "held"],
  failed: ["pending_verification"],
  refunded: [],
  disputed: ["refunded", "reconciled"],
  held: ["pending_verification", "verified_paid", "failed"],
  reconciled: ["disputed", "refunded"],
};

export function canTransitionAccessPayment(from: string, to: string) {
  const parsedFrom = z.enum(accessPaymentStatuses).safeParse(from);
  const parsedTo = z.enum(accessPaymentStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && paymentTransitions[parsedFrom.data].includes(parsedTo.data));
}

/**
 * Portal access implied by a payment status.
 *
 * Only a verified or reconciled payment can open a portal, and only for a product
 * that does not still owe a human review. Money moving back out (refund, dispute)
 * revokes access rather than leaving it stranded open.
 */
export function derivePortalAccess(input: {
  status: string;
  productKey: string;
  /** Set once a human has approved the underlying application or listing. */
  reviewApproved?: boolean;
}): PortalAccessStatus {
  const product = getAccessProduct(input.productKey);
  if (!product) return "pending";

  switch (input.status) {
    case "verified_paid":
    case "reconciled":
      if (product.requiresHumanReview && !input.reviewApproved) return "pending";
      return "granted";
    case "refunded":
    case "disputed":
      return "revoked";
    case "held":
    case "failed":
      return "suspended";
    default:
      return "pending";
  }
}

/** A payment grants portal access only when both gates are satisfied. */
export function paymentGrantsAccess(input: { status: string; productKey: string; reviewApproved?: boolean; portalAccessStatus?: string }) {
  if (input.portalAccessStatus && input.portalAccessStatus !== "granted") return false;
  return derivePortalAccess(input) === "granted";
}

/**
 * Request body for starting a purchase.
 *
 * Deliberately excludes price and currency. The spec's original shape accepted
 * `amountCents` from the client, which would let a buyer set their own price; the
 * amount is resolved from the server catalog instead.
 */
export const createAccessPaymentSchema = z.object({
  productKey: z.enum(accessProductKeys),
  buyerEmail: z.string().trim().toLowerCase().email().max(254),
  acceptedTerms: z.literal(true),
  organizationSlug: z.string().trim().min(2).max(80).optional(),
  note: z.string().trim().max(500).optional(),
});

export type CreateAccessPaymentInput = z.infer<typeof createAccessPaymentSchema>;

export const accessPaymentVerificationSchema = z.object({
  paymentId: z.string().trim().min(1).max(64),
  action: z.enum(["verify", "fail", "hold", "refund", "reconcile"]),
  note: z.string().trim().min(8).max(800),
  externalPaymentReference: z.string().trim().min(2).max(200).optional(),
});

export type AccessPaymentVerificationInput = z.infer<typeof accessPaymentVerificationSchema>;

const verificationTargets: Record<AccessPaymentVerificationInput["action"], AccessPaymentStatus> = {
  verify: "verified_paid",
  fail: "failed",
  hold: "held",
  refund: "refunded",
  reconcile: "reconciled",
};

export function verificationTargetStatus(action: AccessPaymentVerificationInput["action"]) {
  return verificationTargets[action];
}

/** Buyer-submitted reference on the manual return path. */
export const accessPaymentReferenceSchema = z.object({
  buyerEmail: z.string().trim().toLowerCase().email().max(254),
  externalPaymentReference: z.string().trim().min(4).max(200),
});

/**
 * Whether an administrator recording a verification is claiming something the
 * system can actually stand behind. A manual verification always requires a
 * reference so an audit trail points at a real transaction.
 */
export function manualVerificationRequiresReference(action: AccessPaymentVerificationInput["action"], provider: string) {
  return action === "verify" && provider !== "whop" && provider !== "stripe";
}

export function summarizeAccessPayment(input: {
  status: string;
  productKey: string;
  reviewApproved?: boolean;
}) {
  const product = getAccessProduct(input.productKey);
  const access = derivePortalAccess(input);
  return {
    access,
    portalPath: access === "granted" ? product?.portalPath ?? null : null,
    awaitingHumanReview: Boolean(product?.requiresHumanReview) && !input.reviewApproved && (input.status === "verified_paid" || input.status === "reconciled"),
    doesNotInclude: [...(product?.doesNotInclude ?? [])],
  };
}
