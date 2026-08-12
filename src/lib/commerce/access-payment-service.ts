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
  corroborateEmailMatch,
  derivePortalAccess,
  manualVerificationRequiresReference,
  verificationTargetStatus,
} from "@/lib/commerce/access-payment-rules";

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

export async function verifyAccessPayment(session: ClinicSession, input: AccessPaymentVerificationInput): Promise<VerifyResult> {
  // A payment belonging to another tenant is not found. Without this scope, a clinic
  // owner holding `sales:manage` could settle, refund, or hold a stranger's purchase.
  const payment = await db.accessPayment.findFirst({
    where: { id: input.paymentId, ...(isPlatformOperator(session) ? {} : { organizationId: session.organizationId }) },
    select: { ...paymentSelect, onboarding: { select: { id: true, reviewApproved: true } } },
  });
  if (!payment) return { ok: false, reason: "not_found" };

  const targetStatus = verificationTargetStatus(input.action);
  if (!canTransitionAccessPayment(payment.status, targetStatus)) return { ok: false, reason: "invalid_transition" };

  const reference = input.externalPaymentReference?.trim() || payment.externalPaymentReference;
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

export async function reviewPaidOnboarding(session: ClinicSession, input: {
  paymentId: string;
  decision: "approve" | "reject";
  note: string;
}) {
  // Scoped like every other read: a payment belonging to another tenant is simply not
  // found, and the caller cannot tell the difference between that and one that does not
  // exist. Platform operators see the whole queue; nobody else reviews a stranger's
  // purchase.
  const payment = await db.accessPayment.findFirst({
    where: { id: input.paymentId, ...(isPlatformOperator(session) ? {} : { organizationId: session.organizationId }) },
    select: {
      ...paymentSelect,
      onboarding: { select: { id: true, status: true, reviewApproved: true } },
    },
  });
  if (!payment?.onboarding) return { ok: false as const, reason: "not_found" as const };
  if (!['verified_paid', 'reconciled'].includes(payment.status)) {
    return { ok: false as const, reason: "payment_not_settled" as const };
  }

  const approved = input.decision === "approve";
  const now = new Date();
  const portalAccessStatus = derivePortalAccess({
    status: payment.status,
    productKey: payment.productKey,
    reviewApproved: approved,
  });

  const updated = await db.$transaction(async (tx) => {
    await tx.paidOnboarding.update({
      where: { id: payment.onboarding!.id },
      data: {
        status: approved ? "completed" : "canceled",
        reviewApproved: approved,
        reviewedBy: session.userId,
        reviewedAt: now,
        reviewNotes: input.note,
      },
    });

    const result = await tx.accessPayment.update({
      where: { id: payment.id },
      data: { portalAccessStatus },
      select: paymentSelect,
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `paid_onboarding.${approved ? "approved" : "rejected"}`,
        resourceType: "paid_onboarding",
        resourceId: payment.onboarding!.id,
        changes: { reviewApproved: { from: payment.onboarding!.reviewApproved, to: approved } },
        metadata: { paymentId: payment.id, note: input.note, portalAccessStatus },
      },
    });
    return result;
  });

  return { ok: true as const, payment: updated, approved };
}

export async function applyWebhookToAccessPayment(input: {
  externalPaymentReference: string | null;
  buyerEmail: string | null;
  outcome: "paid" | "refunded" | "failed";
  /** Minor units the provider says were settled, when the event reports one. */
  amountMinorUnits?: number | null;
  /** The provider's product identifier, when the event reports one. */
  providerProductId?: string | null;
}) {
  const reference = input.externalPaymentReference?.trim() || null;
  const email = input.buyerEmail?.trim().toLowerCase() || null;

  let payment = reference
    ? await db.accessPayment.findFirst({
        where: { externalPaymentReference: reference },
        select: { ...paymentSelect, onboarding: { select: { reviewApproved: true } } },
      })
    : null;

  // Matching on email alone is the weak path, and it is only reachable because a newly
  // created payment has no provider reference yet. It must therefore corroborate *what*
  // was bought before settling anything: an address is not a purchase. Without this, a
  // buyer holding one open $8,000 invoice who bought something cheap on the same account
  // had the expensive record marked paid.
  let matchedByEmail = false;
  if (!payment && email) {
    const candidates = await db.accessPayment.findMany({
      where: {
        buyerEmail: email,
        status: { in: ["created", "pending_verification", "held"] },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { ...paymentSelect, onboarding: { select: { reviewApproved: true } } },
    });
    if (candidates.length === 1) {
      payment = candidates[0];
      matchedByEmail = true;
    }
  }

  if (!payment) return { applied: false as const, reason: "no_matching_payment" as const };

  if (matchedByEmail) {
    const corroboration = corroborateEmailMatch({
      payment,
      amountMinorUnits: input.amountMinorUnits ?? null,
      providerProductId: input.providerProductId ?? null,
    });
    if (!corroboration.ok) return { applied: false as const, reason: corroboration.reason };
  }
  if (reference && payment.externalPaymentReference && payment.externalPaymentReference !== reference) {
    return { applied: false as const, reason: "reference_conflict" as const };
  }

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
      where: { id: payment!.id },
      data: {
        status: targetStatus,
        portalAccessStatus,
        externalPaymentReference: reference ?? payment!.externalPaymentReference,
      },
    });
    if (targetStatus === "verified_paid") {
      await tx.paidOnboarding.upsert({
        where: { accessPaymentId: payment!.id },
        create: { accessPaymentId: payment!.id, roleTarget: payment!.roleTarget, status: "in_review" },
        update: { status: "in_review" },
      });
    }
  });

  return { applied: true as const, paymentId: payment.id, status: targetStatus, portalAccessStatus };
}

/**
 * Whether this session may see the whole marketplace queue rather than its own.
 *
 * Klinikos has no platform-operator role yet, so this is expressed as one explicitly
 * configured organization. Unset means nobody has platform scope — which is the right
 * default, because the alternative was every tenant owner reading every buyer's email
 * and payment reference through a clinic-scoped `sales:manage` permission.
 */
export function isPlatformOperator(session: ClinicSession, env: Record<string, string | undefined> = process.env) {
  const platformOrganizationId = env.KLINIKOS_PLATFORM_ORG_ID?.trim();
  if (!platformOrganizationId) return false;
  return session.organizationId === platformOrganizationId;
}

/**
 * The access payments this session is entitled to see.
 *
 * Scoped to the acting tenant unless they are the platform operator. This query has no
 * natural tenant column to get wrong — it simply had none at all, which is why the
 * repository-wide isolation scan did not catch it: there was no `organizationId` to
 * check rather than a wrong one.
 */
export async function listAccessPayments(session: ClinicSession, filter?: { status?: string; roleTarget?: string }) {
  return db.accessPayment.findMany({
    where: {
      ...(isPlatformOperator(session) ? {} : { organizationId: session.organizationId }),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.roleTarget ? { roleTarget: filter.roleTarget } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: { ...paymentSelect, onboarding: { select: { id: true, status: true, reviewApproved: true } } },
  });
}

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
