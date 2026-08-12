import { z } from "zod";
import { accessProductKeys, getAccessProduct } from "@/lib/commerce/access-product-catalog";

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

export function derivePortalAccess(input: {
  status: string;
  productKey: string;
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

export function paymentGrantsAccess(input: { status: string; productKey: string; reviewApproved?: boolean; portalAccessStatus?: string }) {
  if (input.portalAccessStatus && input.portalAccessStatus !== "granted") return false;
  return derivePortalAccess(input) === "granted";
}

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

export const paidOnboardingReviewSchema = z.object({
  paymentId: z.string().trim().min(1).max(64),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().min(8).max(800),
});
export type PaidOnboardingReviewInput = z.infer<typeof paidOnboardingReviewSchema>;

export const accessPaymentReferenceSchema = z.object({
  buyerEmail: z.string().trim().toLowerCase().email().max(254),
  externalPaymentReference: z.string().trim().min(4).max(200),
});

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

/**
 * Whether an email-matched event is really about this payment.
 *
 * The event has to agree with the record on something other than the buyer's address.
 * Two independent signals, and either one is sufficient:
 *
 *   - **Amount.** The strongest available without new configuration. An unrelated
 *     cheaper purchase does not report the price of the invoice it would settle.
 *   - **Provider product id.** Only usable where a deployment has mapped its Whop
 *     product ids; unmapped products simply do not contribute.
 *
 * Disagreement always refuses, even if the other signal agrees — a mismatch is positive
 * evidence that this is a different purchase. Silence on both refuses too: settling the
 * only open invoice because nothing contradicted it is the guess this exists to stop.
 */
export function corroborateEmailMatch(input: {
  payment: { productKey: string; amountCents: number };
  amountMinorUnits: number | null;
  providerProductId: string | null;
  env?: Record<string, string | undefined>;
}): { ok: true } | { ok: false; reason: "amount_mismatch" | "product_mismatch" | "unverified_product" } {
  const expectedProductId = configuredProviderProductId(input.payment.productKey, input.env);

  if (input.providerProductId && expectedProductId && input.providerProductId !== expectedProductId) {
    return { ok: false, reason: "product_mismatch" };
  }
  if (input.amountMinorUnits !== null && input.amountMinorUnits !== input.payment.amountCents) {
    return { ok: false, reason: "amount_mismatch" };
  }

  const productConfirmed = Boolean(input.providerProductId && expectedProductId && input.providerProductId === expectedProductId);
  const amountConfirmed = input.amountMinorUnits !== null && input.amountMinorUnits === input.payment.amountCents;
  if (productConfirmed || amountConfirmed) return { ok: true };

  // Nothing corroborated it. The payment stays open and an operator settles it from the
  // review queue, which is a delay rather than the wrong invoice being marked paid.
  return { ok: false, reason: "unverified_product" };
}

/**
 * The provider product id mapped to a Klinikos product, if the deployment has set one.
 *
 * Optional by design: it hardens matching where configured and contributes nothing where
 * not, so adding it never breaks a deployment that has not.
 */
export function configuredProviderProductId(productKey: string, env: Record<string, string | undefined> = process.env) {
  return env[`WHOP_PRODUCT_ID_${productKey.toUpperCase()}`]?.trim() || null;
}
