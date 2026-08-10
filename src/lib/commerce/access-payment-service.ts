import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import {
  type AccessProduct,
  checkoutLinkForProduct,
  getAccessProduct,
} from "@/lib/commerce/access-product-catalog";
import {
  type AccessPaymentVerificationInput,
  canTransitionAccessPayment,
  derivePortalAccess,
  manualVerificationRequiresReference,
  verificationTargetStatus,
} from "@/lib/commerce/access-payment-rules";

/**
 * Marketplace access payment service.
 *
 * Creating a payment records intent only. Access is opened by a separate,
 * explicitly recorded event: either a signature-verified provider webhook or an
 * administrator's human verification. Nothing here trusts a client-supplied amount,
 * status, or access level.
 */

export type AccessPaymentRecord = {
  id: string;
  provider: string;
  productKey: string;
  roleTarget: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
  status: string;
  portalAccessStatus: string;
  externalPaymentReference: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
};

const paymentSelect = {
  id: true,
  provider: true,
  productKey: true,
  roleTarget: true,
  buyerEmail: true,
  amountCents: true,
  currency: true,
  status: true,
  portalAccessStatus: true,
  externalPaymentReference: true,
  verifiedAt: true,
  createdAt: true,
} as const;

type CreateResult =
  | { ok: true; payment: AccessPaymentRecord; checkoutUrl: string; product: AccessProduct }
  | { ok: false; reason: "unknown_product" | "not_purchasable" };

/**
 * Start a purchase.
 *
 * The price comes from the server catalog. The checkout URL comes from the
 * configured provider link. When no link is configured the product is not
 * purchasable and we say so rather than inventing a destination.
 */
export async function createAccessPayment(input: {
  productKey: string;
  buyerEmail: string;
  note?: string | null;
  organizationId?: string | null;
  userId?: string | null;
}): Promise<CreateResult> {
  const product = getAccessProduct(input.productKey);
  if (!product) return { ok: false, reason: "unknown_product" };

  const checkoutUrl = checkoutLinkForProduct(product, process.env as Record<string, string | undefined>);
  if (!checkoutUrl) return { ok: false, reason: "not_purchasable" };

  const payment = await db.accessPayment.create({
    data: {
      userId: input.userId ?? null,
      organizationId: input.organizationId ?? null,
      provider: "whop",
      productKey: product.key,
      roleTarget: product.roleTarget,
      buyerEmail: input.buyerEmail.trim().toLowerCase(),
      amountCents: product.amountCents,
      currency: product.currency,
      externalCheckoutUrl: checkoutUrl,
      status: "created",
      portalAccessStatus: "pending",
      metadata: input.note ? { buyerNote: input.note } : undefined,
    },
    select: paymentSelect,
  });

  return { ok: true, payment, checkoutUrl, product };
}

/**
 * Record a buyer-supplied payment reference on the manual return path.
 *
 * This never marks a payment as paid. It moves the record to
 * `pending_verification` so an administrator, or a later webhook, can confirm it.
 */
export async function attachPaymentReference(input: { buyerEmail: string; externalPaymentReference: string }) {
  const payment = await db.accessPayment.findFirst({
    where: { buyerEmail: input.buyerEmail.trim().toLowerCase(), status: { in: ["created", "failed"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
  if (!payment) return { ok: false as const, reason: "no_open_payment" as const };

  if (!canTransitionAccessPayment(payment.status, "pending_verification")) {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const updated = await db.accessPayment.update({
    where: { id: payment.id },
    data: { status: "pending_verification", externalPaymentReference: input.externalPaymentReference.trim() },
    select: paymentSelect,
  });
  return { ok: true as const, payment: updated };
}

type VerifyResult =
  | { ok: true; payment: AccessPaymentRecord }
  | { ok: false; reason: "not_found" | "invalid_transition" | "reference_required" };

/**
 * Administrator verification of a marketplace payment.
 *
 * Every decision is a human act with a required note, written together with an
 * audit receipt and an onboarding record in one transaction. Portal access is
 * derived from the resulting status and the product's review requirement rather
 * than set directly by the caller.
 */
export async function verifyAccessPayment(session: ClinicSession, input: AccessPaymentVerificationInput): Promise<VerifyResult> {
  const payment = await db.accessPayment.findUnique({
    where: { id: input.paymentId },
    select: { ...paymentSelect, onboarding: { select: { id: true, reviewApproved: true } } },
  });
  if (!payment) return { ok: false, reason: "not_found" };

  const targetStatus = verificationTargetStatus(input.action);
  if (!canTransitionAccessPayment(payment.status, targetStatus)) return { ok: false, reason: "invalid_transition" };

  const reference = input.externalPaymentReference?.trim() || payment.externalPaymentReference;
  // A payment can only read as settled if it points at a real provider transaction.
  if ((targetStatus === "verified_paid" || targetStatus === "reconciled") && !reference) {
    return { ok: false, reason: "reference_required" };
  }
  if (manualVerificationRequiresReference(input.action, payment.provider) && !reference) {
    return { ok: false, reason: "reference_required" };
  }

  const now = new Date();
  const portalAccessStatus = derivePortalAccess({
    status: targetStatus,
    productKey: payment.productKey,
    reviewApproved: payment.onboarding?.reviewApproved ?? false,
  });

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.accessPayment.update({
      where: { id: payment.id },
      data: {
        status: targetStatus,
        portalAccessStatus,
        externalPaymentReference: reference,
        verifiedBy: session.userId,
        verifiedAt: now,
        reviewNotes: input.note,
      },
      select: paymentSelect,
    });

    // A settled payment opens an onboarding record so the human review that still
    // stands between payment and portal access has somewhere to live.
    if (targetStatus === "verified_paid" || targetStatus === "reconciled") {
      await tx.paidOnboarding.upsert({
        where: { accessPaymentId: payment.id },
        create: { accessPaymentId: payment.id, roleTarget: payment.roleTarget, status: "in_review" },
        update: { status: "in_review" },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `access_payment.${input.action}`,
        resourceType: "access_payment",
        resourceId: payment.id,
        changes: { status: { from: payment.status, to: targetStatus } },
        metadata: {
          note: input.note,
          humanDecision: true,
          productKey: payment.productKey,
          roleTarget: payment.roleTarget,
          portalAccessStatus,
          externalPaymentReference: reference,
        },
      },
    });

    return result;
  });

  return { ok: true, payment: updated };
}

/**
 * Apply a provider webhook to a marketplace payment.
 *
 * Matched by provider reference first, then by buyer email against an open
 * payment. An unmatched event is reported rather than guessed at.
 */
export async function applyWebhookToAccessPayment(input: {
  externalPaymentReference: string | null;
  buyerEmail: string | null;
  outcome: "paid" | "refunded" | "failed";
}) {
  const reference = input.externalPaymentReference?.trim() || null;
  const email = input.buyerEmail?.trim().toLowerCase() || null;

  const payment = reference
    ? await db.accessPayment.findFirst({ where: { externalPaymentReference: reference }, select: { ...paymentSelect, onboarding: { select: { reviewApproved: true } } } })
    : email
      ? await db.accessPayment.findFirst({
          where: { buyerEmail: email, status: { in: ["created", "pending_verification", "held"] } },
          orderBy: { createdAt: "desc" },
          select: { ...paymentSelect, onboarding: { select: { reviewApproved: true } } },
        })
      : null;

  if (!payment) return { applied: false as const, reason: "no_matching_payment" as const };

  const targetStatus = input.outcome === "paid" ? "verified_paid" : input.outcome === "refunded" ? "refunded" : "failed";
  if (!canTransitionAccessPayment(payment.status, targetStatus)) {
    return { applied: false as const, reason: "invalid_transition" as const };
  }
  if (targetStatus === "verified_paid" && !reference && !payment.externalPaymentReference) {
    return { applied: false as const, reason: "reference_required" as const };
  }

  const portalAccessStatus = derivePortalAccess({
    status: targetStatus,
    productKey: payment.productKey,
    reviewApproved: payment.onboarding?.reviewApproved ?? false,
  });

  await db.$transaction(async (tx) => {
    await tx.accessPayment.update({
      where: { id: payment.id },
      data: {
        status: targetStatus,
        portalAccessStatus,
        externalPaymentReference: reference ?? payment.externalPaymentReference,
      },
    });
    if (targetStatus === "verified_paid") {
      await tx.paidOnboarding.upsert({
        where: { accessPaymentId: payment.id },
        create: { accessPaymentId: payment.id, roleTarget: payment.roleTarget, status: "in_review" },
        update: { status: "in_review" },
      });
    }
  });

  return { applied: true as const, paymentId: payment.id, status: targetStatus, portalAccessStatus };
}

/** Administrator worklist. Ordered so the items awaiting a decision surface first. */
export async function listAccessPayments(filter?: { status?: string; roleTarget?: string }) {
  return db.accessPayment.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.roleTarget ? { roleTarget: filter.roleTarget } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: { ...paymentSelect, onboarding: { select: { id: true, status: true, reviewApproved: true } } },
  });
}

/** Marketplace access granted by a settled payment, for the signed-in account. */
export async function findGrantedAccessPayment(input: { email: string; organizationId: string }) {
  return db.accessPayment.findFirst({
    where: {
      portalAccessStatus: "granted",
      status: { in: ["verified_paid", "reconciled"] },
      OR: [{ buyerEmail: input.email.trim().toLowerCase() }, { organizationId: input.organizationId }],
    },
    orderBy: { updatedAt: "desc" },
    select: paymentSelect,
  });
}
