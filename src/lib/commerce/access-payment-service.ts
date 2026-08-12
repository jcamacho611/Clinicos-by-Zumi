import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import {
  type AccessProduct,
  checkoutLinkForProduct,
  getAccessProduct,
} from "@/lib/commerce/access-product-catalog";
import { deliverActivation, provisionFromPayment, revokeProvisionedAccess } from "@/lib/provisioning/provisioning-service";
import {
  type AccessPaymentVerificationInput,
  candidateStatusesFor,
  canTransitionAccessPayment,
  corroborateEmailMatch,
  derivePortalAccess,
  manualVerificationRequiresReference,
  verificationTargetStatus,
} from "@/lib/commerce/access-payment-rules";

/**
 * What became of the attempt to make a granted payment real.
 *
 * `attempted: false, ok: true` means there was nothing to do — a service fee grants no
 * modules, so no workspace is owed.
 */
export type ProvisionedAccessOutcome =
  | { attempted: boolean; ok: true; organizationId?: string | null; modules?: string[] }
  | { attempted: true; ok: false; reason: string };

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

/** How many buyer-submitted references are kept per payment. Newest first. */
const MAX_REFERENCE_CLAIMS = 5;

export type ReferenceClaim = { reference: string; at: string };

export function referenceClaimsFrom(metadata: unknown): ReferenceClaim[] {
  const claims = (metadata as { referenceClaims?: unknown } | null)?.referenceClaims;
  if (!Array.isArray(claims)) return [];
  return claims.filter((claim): claim is ReferenceClaim =>
    Boolean(claim && typeof claim === "object" && typeof (claim as ReferenceClaim).reference === "string"),
  );
}

/**
 * Record a reference a buyer says belongs to their purchase.
 *
 * This endpoint is public and identifies the buyer by email alone, which is not
 * ownership. It therefore writes nothing authoritative: the claim is filed as evidence
 * for the operator who reviews the payment, and neither `status` nor
 * `externalPaymentReference` moves.
 *
 * It used to do both, and each caused its own defect. Setting
 * `externalPaymentReference` meant the next webhook matched the payment *by reference*
 * and skipped the product and amount corroboration entirely — so attaching the
 * reference of a cheap purchase to a stranger's open $8,000 payment let the cheap
 * purchase's genuine webhook settle the expensive row. Moving the status to
 * `pending_verification` meant anyone who knew an email could strand a purchase: the
 * real buyer could no longer correct it here, and the genuine webhook arrived to a
 * reference conflict.
 *
 * A buyer-submitted reference is now only ever a suggestion a person evaluates, which
 * is what it always was in fact.
 */
export async function recordReferenceClaim(input: { buyerEmail: string; externalPaymentReference: string }) {
  const payment = await db.accessPayment.findFirst({
    where: {
      buyerEmail: input.buyerEmail.trim().toLowerCase(),
      // Settled payments need nothing from the buyer, and offering to take a claim for
      // one would invite noise on rows that are already decided.
      status: { in: ["created", "pending_verification", "failed", "held"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, metadata: true },
  });
  if (!payment) return { ok: false as const, reason: "no_open_payment" as const };

  const reference = input.externalPaymentReference.trim();
  const existing = referenceClaimsFrom(payment.metadata).filter((claim) => claim.reference !== reference);
  const claims = [{ reference, at: new Date().toISOString() }, ...existing].slice(0, MAX_REFERENCE_CLAIMS);

  const updated = await db.accessPayment.update({
    where: { id: payment.id },
    data: {
      metadata: {
        ...((payment.metadata as Record<string, unknown> | null) ?? {}),
        referenceClaims: claims,
      },
    },
    select: paymentSelect,
  });
  return { ok: true as const, payment: updated, claims };
}

/**
 * Make the access a settled payment claims to grant actually exist.
 *
 * `portalAccessStatus` is a column. Until this ran, nothing turned it into an
 * organization, an account, a subscription, or a credential the buyer could sign in
 * with: `provisionFromPayment` was called only for membership webhooks, never with
 * `source: "access_payment"`. A public buyer of a Founding Clinic Seat was therefore
 * approved by a reviewer, marked `granted`, and had nowhere to go.
 *
 * Driven off the derived access status rather than off any one caller, because three
 * separate paths reach `granted` — a webhook settlement of a product needing no review,
 * an operator marking a payment paid, and a reviewer approving onboarding — and a
 * bridge wired into one of them is a bridge missing from the other two.
 *
 * What each product provisions comes from the catalog, so a service fee provisions
 * nothing: `provisionFromPayment` skips a purchase whose modules are empty rather than
 * inventing a workspace for a consulting call.
 *
 * Never throws. The human decision that produced this status has already been recorded
 * and audited, and it must not be undone because a downstream write failed — but the
 * failure is returned rather than swallowed, so the operator sees that the buyer is not
 * yet able to sign in.
 */
async function syncProvisionedAccess(payment: {
  id: string;
  buyerEmail: string;
  productKey: string;
  portalAccessStatus: string;
}): Promise<ProvisionedAccessOutcome> {
  if (payment.portalAccessStatus === "granted") {
    const provisioning = await provisionFromPayment({
      source: "access_payment",
      reference: payment.id,
      email: payment.buyerEmail,
      productKey: payment.productKey,
    }).catch(() => null);

    if (!provisioning) return { attempted: true, ok: false, reason: "provisioning_threw" };
    if (provisioning.status === "failed" || provisioning.status === "contended") {
      return { attempted: true, ok: false, reason: `provisioning_${provisioning.status}` };
    }
    // Nothing was provisioned because nothing was purchased that needs provisioning: a
    // consulting call and a workflow review both grant no modules, and reporting those
    // as an attempt would put a provisioning outcome on a purchase that never had one.
    if (provisioning.status === "skipped" || provisioning.modules.length === 0) {
      return { attempted: false, ok: true };
    }

    if (provisioning.activation && provisioning.organizationId) {
      const delivered = await deliverActivation({
        email: payment.buyerEmail,
        token: provisioning.activation.token,
        provisioningKey: provisioning.provisioningKey,
      }).catch(() => null);
      // Provisioned but unreachable. The buyer has an account they cannot get into, and
      // saying so is the difference between an operator reissuing the link and a buyer
      // waiting on an email that never came.
      if (!delivered?.ok) return { attempted: true, ok: false, reason: "activation_undelivered" };
    }

    return { attempted: true, ok: true, organizationId: provisioning.organizationId, modules: provisioning.modules };
  }

  if (payment.portalAccessStatus === "revoked" || payment.portalAccessStatus === "suspended") {
    // A refunded or held purchase must lose what it was given, or the buyer keeps every
    // capability while the payment row says otherwise.
    const revoked = await revokeProvisionedAccess({
      source: "access_payment",
      reference: payment.id,
      state: "revoked",
    }).catch(() => null);
    // `not_provisioned` is the ordinary case: nothing was ever created for this payment.
    if (revoked && !revoked.ok && revoked.reason !== "not_provisioned") {
      return { attempted: true, ok: false, reason: "revocation_failed" };
    }
    return { attempted: Boolean(revoked?.ok), ok: true };
  }

  return { attempted: false, ok: true };
}

type VerifyResult =
  | { ok: true; payment: AccessPaymentRecord; provisioning: ProvisionedAccessOutcome }
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

  return { ok: true, payment: updated, provisioning: await syncProvisionedAccess(updated) };
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

  return { ok: true as const, payment: updated, approved, provisioning: await syncProvisionedAccess(updated) };
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
  const targetStatus = input.outcome === "paid" ? "verified_paid" : input.outcome === "refunded" ? "refunded" : "failed";
  const reversal = input.outcome === "refunded";

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
        // Derived from the transition table rather than listed, because the two
        // directions need opposite sets and a hardcoded list gets one of them wrong.
        // A settlement looks for an open payment; a refund looks for a settled one, and
        // searching only open rows is why a refunded buyer kept portal access.
        status: { in: candidateStatusesFor(targetStatus) },
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
      reversal,
    });
    if (!corroboration.ok) return { applied: false as const, reason: corroboration.reason };
  }
  if (reference && payment.externalPaymentReference && payment.externalPaymentReference !== reference) {
    return { applied: false as const, reason: "reference_conflict" as const };
  }

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

  const provisioning = await syncProvisionedAccess({
    id: payment.id,
    buyerEmail: payment.buyerEmail,
    productKey: payment.productKey,
    portalAccessStatus,
  });

  return { applied: true as const, paymentId: payment.id, status: targetStatus, portalAccessStatus, provisioning };
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
  const rows = await db.accessPayment.findMany({
    where: {
      ...(isPlatformOperator(session) ? {} : { organizationId: session.organizationId }),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.roleTarget ? { roleTarget: filter.roleTarget } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: { ...paymentSelect, metadata: true, onboarding: { select: { id: true, status: true, reviewApproved: true } } },
  });

  // Buyer-submitted references are lifted out of metadata rather than left in it. They
  // are the reason the buyer contacted us, and evidence a reviewer cannot see is the
  // same as evidence that was never recorded.
  return rows.map(({ metadata, ...row }) => ({ ...row, referenceClaims: referenceClaimsFrom(metadata) }));
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
