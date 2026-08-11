import "server-only";

import crypto from "node:crypto";
import { db } from "@/lib/db";
import type { AccessTier } from "@/lib/commerce/whop-catalog";
import { planIdForTier, verifyWhopMembership } from "@/lib/commerce/whop-client";
import {
  type EntitlementRecord,
  type WhopWebhookEnvelope,
  coerceWhopTimestamp,
  evaluateEntitlement,
  isActionableWebhookEvent,
  mapMembershipStatus,
} from "@/lib/commerce/whop-rules";

const CHECKOUT_INTENT_TTL_MS = 60 * 60 * 1000;
const TERMINAL_WEBHOOK_STATES = new Set(["applied", "ignored", "rejected"]);

export function payloadHash(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
}

export async function recordWebhookDelivery(input: {
  eventId: string;
  eventType: string;
  membershipId: string | null;
  signatureVerified: boolean;
  rawBody: string;
  payload: unknown;
  processingStatus: "received" | "rejected" | "ignored";
  failureReason?: string | null;
}) {
  try {
    const record = await db.whopWebhookEvent.create({
      data: {
        eventId: input.eventId,
        eventType: input.eventType,
        membershipId: input.membershipId,
        signatureVerified: input.signatureVerified,
        payloadHash: payloadHash(input.rawBody),
        processingStatus: input.processingStatus,
        failureReason: input.failureReason ?? null,
        payload: input.signatureVerified ? (input.payload as object) : undefined,
      },
      select: { id: true, processingStatus: true },
    });
    return { ok: true as const, id: record.id, duplicate: false as const, retryable: false as const };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      const existing = await db.whopWebhookEvent.findUnique({
        where: { eventId: input.eventId },
        select: { id: true, processingStatus: true, payloadHash: true },
      });
      if (!existing || existing.payloadHash !== payloadHash(input.rawBody)) {
        return { ok: true as const, id: null, duplicate: true as const, retryable: false as const };
      }
      return {
        ok: true as const,
        id: existing.id,
        duplicate: true as const,
        retryable: !TERMINAL_WEBHOOK_STATES.has(existing.processingStatus),
      };
    }
    throw error;
  }
}

/**
 * Record where a delivery got to.
 *
 * `applied` is terminal — a redelivery of a terminal event is acknowledged without
 * being reprocessed. Everything else is retryable, which is why entitlement
 * application deliberately does *not* write `applied` itself: a purchase is not
 * finished until it is also provisioned, and marking it terminal in between is what
 * stranded buyers with an entitlement and no organization.
 */
async function markWebhookOutcome(webhookRecordId: string | null, processingStatus: "applied" | "ignored" | "failed", failureReason?: string) {
  if (!webhookRecordId) return;
  await db.whopWebhookEvent.update({
    where: { id: webhookRecordId },
    data: { processingStatus, processedAt: new Date(), failureReason: failureReason ?? null },
  }).catch(() => undefined);
}

type ApplyResult =
  | { applied: true; entitlementId: string; state: string; tierKey: string }
  | { applied: false; reason: "not_actionable" | "no_membership" | "unmapped_plan" | "unverifiable" };

export async function applyWebhookToEntitlement(input: {
  envelope: WhopWebhookEnvelope;
  eventType: string;
  webhookRecordId: string | null;
}): Promise<ApplyResult> {
  if (!isActionableWebhookEvent(input.eventType)) {
    await markWebhookOutcome(input.webhookRecordId, "ignored", "event type is not actionable");
    return { applied: false, reason: "not_actionable" };
  }

  const membershipId = input.envelope.data?.id?.trim() || null;
  if (!membershipId) {
    await markWebhookOutcome(input.webhookRecordId, "ignored", "payload carried no membership id");
    return { applied: false, reason: "no_membership" };
  }

  const verification = await verifyWhopMembership(membershipId);
  if (!verification.ok) {
    if (verification.reason === "unmapped_plan") {
      await markWebhookOutcome(input.webhookRecordId, "ignored", "membership plan is not mapped to a Klinikos tier");
      return { applied: false, reason: "unmapped_plan" };
    }
    await markWebhookOutcome(input.webhookRecordId, "failed", `membership verification failed: ${verification.reason}`);
    return { applied: false, reason: "unverifiable" };
  }

  const membership = verification.membership;
  const tier = membership.tier as AccessTier;
  const now = new Date();
  const state = membership.entitlementState;
  const isActive = state === "active";

  const entitlement = await db.whopEntitlement.upsert({
    where: { whopMembershipId: membership.membershipId },
    create: {
      email: membership.email ?? input.envelope.data?.email ?? "",
      whopMembershipId: membership.membershipId,
      whopUserId: membership.userId,
      whopPlanId: membership.planId,
      whopProductId: membership.productId,
      tierKey: tier.key,
      state,
      membershipStatus: membership.membershipStatus,
      validUntil: membership.validUntil,
      grantedAt: isActive ? now : null,
      revokedAt: state === "revoked" ? now : null,
      lastVerifiedAt: now,
      verificationSource: "webhook",
      metadata: { eventType: input.eventType },
    },
    update: {
      whopUserId: membership.userId,
      whopPlanId: membership.planId,
      whopProductId: membership.productId,
      tierKey: tier.key,
      state,
      membershipStatus: membership.membershipStatus,
      validUntil: membership.validUntil,
      grantedAt: isActive ? now : undefined,
      revokedAt: state === "revoked" ? now : null,
      lastVerifiedAt: now,
      verificationSource: "webhook",
      ...(membership.email ? { email: membership.email } : {}),
    },
    select: { id: true, state: true, tierKey: true },
  });

  // Deliberately not marked terminal here. The caller owns that, because the caller
  // knows whether the rest of the purchase completed.
  return { applied: true, entitlementId: entitlement.id, state: entitlement.state, tierKey: entitlement.tierKey };
}

const entitlementSelect = {
  id: true,
  email: true,
  tierKey: true,
  state: true,
  membershipStatus: true,
  validUntil: true,
  revokedAt: true,
  grantedAt: true,
  lastVerifiedAt: true,
  whopMembershipId: true,
  organizationId: true,
} as const;

export type StoredEntitlement = {
  id: string;
  email: string;
  tierKey: string;
  state: string;
  membershipStatus: string | null;
  validUntil: Date | null;
  revokedAt: Date | null;
  grantedAt: Date | null;
  lastVerifiedAt: Date | null;
  whopMembershipId: string;
  organizationId: string | null;
};

export async function findEntitlementForEmail(email: string, now = new Date()): Promise<StoredEntitlement | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const candidates = await db.whopEntitlement.findMany({
    where: { email: normalized },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: entitlementSelect,
  });
  const active = candidates.find((candidate) => evaluateEntitlement(candidate as EntitlementRecord, now).active);
  return (active ?? candidates[0] ?? null) as StoredEntitlement | null;
}

export async function findEntitlementForIdentity(input: { email: string; organizationId: string }, now = new Date()): Promise<StoredEntitlement | null> {
  const direct = await findEntitlementForEmail(input.email, now);
  if (direct && evaluateEntitlement(direct as EntitlementRecord, now).active) return direct;
  const organizationGrant = await db.whopEntitlement.findFirst({
    where: { organizationId: input.organizationId, state: "active" },
    orderBy: { updatedAt: "desc" },
    select: entitlementSelect,
  });
  if (organizationGrant && evaluateEntitlement(organizationGrant as EntitlementRecord, now).active) return organizationGrant as StoredEntitlement;
  return direct;
}

export async function claimEntitlementForOrganization(entitlementId: string, organizationId: string) {
  return db.whopEntitlement.updateMany({ where: { id: entitlementId, organizationId: null }, data: { organizationId } });
}

export async function createCheckoutIntent(input: {
  email: string;
  tier: AccessTier;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const planId = planIdForTier(input.tier);
  if (!planId) return { ok: false as const, reason: "tier_not_purchasable" as const };
  const state = crypto.randomBytes(32).toString("base64url");
  const record = await db.whopCheckoutIntent.create({
    data: {
      state,
      email: input.email.trim().toLowerCase(),
      tierKey: input.tier.key,
      whopPlanId: planId,
      expiresAt: new Date(Date.now() + CHECKOUT_INTENT_TTL_MS),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    select: { id: true, state: true, expiresAt: true, tierKey: true, whopPlanId: true },
  });
  return { ok: true as const, intent: record, planId };
}

type CheckoutReturnResult =
  | { ok: true; tierKey: string; entitlementId: string; state: string; alreadyCompleted: boolean }
  | { ok: false; reason: "unknown_state" | "expired" | "not_configured" | "unverified" | "tier_mismatch" | "identity_mismatch" | "membership_required" };

export async function completeCheckoutReturn(input: { state: string; membershipId?: string | null }): Promise<CheckoutReturnResult> {
  const intent = await db.whopCheckoutIntent.findUnique({
    where: { state: input.state },
    select: { id: true, email: true, tierKey: true, whopPlanId: true, status: true, expiresAt: true, entitlementId: true },
  });
  if (!intent) return { ok: false, reason: "unknown_state" };

  if (intent.status === "completed" && intent.entitlementId) {
    const existing = await db.whopEntitlement.findUnique({ where: { id: intent.entitlementId }, select: entitlementSelect });
    if (existing) return { ok: true, tierKey: existing.tierKey, entitlementId: existing.id, state: existing.state, alreadyCompleted: true };
  }

  if (intent.expiresAt <= new Date()) {
    await db.whopCheckoutIntent.update({ where: { id: intent.id }, data: { status: "expired" } }).catch(() => undefined);
    return { ok: false, reason: "expired" };
  }

  const membershipId = input.membershipId?.trim();
  if (!membershipId) return { ok: false, reason: "membership_required" };

  const verification = await verifyWhopMembership(membershipId);
  if (!verification.ok) return { ok: false, reason: verification.reason === "not_configured" ? "not_configured" : "unverified" };

  const membership = verification.membership;
  if (membership.tier?.key !== intent.tierKey || membership.planId !== intent.whopPlanId) return { ok: false, reason: "tier_mismatch" };
  const membershipEmail = membership.email?.trim().toLowerCase() || null;
  if (!membershipEmail || membershipEmail !== intent.email.trim().toLowerCase()) return { ok: false, reason: "identity_mismatch" };

  const now = new Date();
  const state = membership.entitlementState;
  const isActive = state === "active";

  const entitlement = await db.whopEntitlement.upsert({
    where: { whopMembershipId: membership.membershipId },
    create: {
      email: intent.email,
      whopMembershipId: membership.membershipId,
      whopUserId: membership.userId,
      whopPlanId: membership.planId,
      whopProductId: membership.productId,
      tierKey: intent.tierKey,
      state,
      membershipStatus: membership.membershipStatus,
      validUntil: membership.validUntil,
      grantedAt: isActive ? now : null,
      revokedAt: state === "revoked" ? now : null,
      lastVerifiedAt: now,
      verificationSource: "checkout_return",
    },
    update: {
      email: intent.email,
      state,
      membershipStatus: membership.membershipStatus,
      validUntil: membership.validUntil,
      grantedAt: isActive ? now : undefined,
      revokedAt: state === "revoked" ? now : null,
      lastVerifiedAt: now,
      verificationSource: "checkout_return",
    },
    select: { id: true, state: true, tierKey: true },
  });

  await db.whopCheckoutIntent.update({
    where: { id: intent.id },
    data: { status: "completed", completedAt: now, entitlementId: entitlement.id },
  });
  return { ok: true, tierKey: entitlement.tierKey, entitlementId: entitlement.id, state: entitlement.state, alreadyCompleted: false };
}

export async function hasVerifiedAccessEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const acceptance = await db.accessGateAcceptance.findFirst({
    where: { email: normalized, verifiedEmailAt: { not: null } },
    orderBy: { acceptedAt: "desc" },
    select: { id: true },
  });
  return Boolean(acceptance);
}

export { evaluateEntitlement, mapMembershipStatus, coerceWhopTimestamp };

/**
 * Mark a delivery finished. Only the handler that completed every step calls this.
 */
export async function markWebhookProcessed(webhookRecordId: string | null) {
  return markWebhookOutcome(webhookRecordId, "applied");
}

/**
 * Mark a delivery incomplete so the next redelivery is reprocessed rather than
 * acknowledged. Pairs with a 5xx response: the provider retries, and this is what
 * makes the retry do something.
 */
export async function markWebhookIncomplete(webhookRecordId: string | null, reason: string) {
  return markWebhookOutcome(webhookRecordId, "failed", reason);
}
