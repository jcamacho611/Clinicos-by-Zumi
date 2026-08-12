import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  configuredAllowanceCents,
  getCommercialProduct,
  type CommercialProductKey,
} from "@/lib/commercial/product-catalog";
import type { CommercialCostBucket } from "@/lib/commercial/customer-funded-access";

export type CommercialVerificationMethod = "webhook_signature" | "api_verification" | "manual_reconciliation" | "unverified";
export type CommercialPaymentProcessingStatus = "received" | "ignored" | "applied" | "failed";

export type CommercialPaymentEvidenceInput = {
  provider: string;
  eventId: string;
  eventType: string;
  verified: boolean;
  verificationMethod: CommercialVerificationMethod;
  processorVerified: boolean;
  payloadHash: string;
  payload: Record<string, unknown>;
  productKey?: string | null;
  email?: string | null;
  checkoutState?: string | null;
  organizationId?: string | null;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
};

type CheckoutIntentRow = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  email: string;
  organizationId: string | null;
  status: string;
  expiresAt: Date;
};

type PaymentEventRow = {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  verified: boolean;
  processingStatus: CommercialPaymentProcessingStatus;
  externalSubscriptionId: string | null;
  organizationId: string | null;
  productKey: string | null;
};

type SubscriptionRawRow = {
  id: string;
  organizationId: string;
  planKey: string;
  status: string;
  modules: string[];
  currentPeriodEndsAt: Date | null;
  paymentConfirmedAt: Date | null;
  paymentProvider: string | null;
  paymentEvidenceId: string | null;
};

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || "USD";
}

function assertEvidenceShape(input: CommercialPaymentEvidenceInput) {
  if (!input.provider.trim() || !input.eventId.trim() || !input.eventType.trim() || !input.payloadHash.trim()) {
    throw new Error("Commercial payment evidence is missing required identifiers.");
  }
  if (input.processorVerified && input.verificationMethod === "manual_reconciliation") {
    throw new Error("Manual reconciliation cannot be represented as processor verification.");
  }
}

export async function createCommercialCheckoutIntent(input: {
  organizationId: string;
  email: string;
  provider: string;
  productKey: CommercialProductKey;
  expiresAt?: Date;
}) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");
  const organization = await db.organization.findUnique({ where: { id: input.organizationId }, select: { id: true, status: true } });
  if (!organization || organization.status !== "active") throw new Error("Organization is not active.");

  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Checkout requires a verified account email.");
  const id = randomUUID();
  const state = randomUUID().replaceAll("-", "");
  const expiresAt = input.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000);

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_checkout_intents" (
      "id", "state", "provider", "productKey", "email", "organizationId", "expiresAt"
    ) VALUES (${id}, ${state}, ${input.provider}, ${product.key}, ${email}, ${input.organizationId}, ${expiresAt})
  `);

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: null,
      actorType: "system",
      action: "commercial.checkout_intent_created",
      resourceType: "commercial_checkout_intent",
      resourceId: id,
      metadata: { provider: input.provider, productKey: product.key, expiresAt: expiresAt.toISOString() },
    },
  });
  return { id, state, expiresAt, product };
}

async function resolveCheckoutIntent(
  tx: Prisma.TransactionClient,
  input: CommercialPaymentEvidenceInput,
  productKey: string | null,
) {
  const email = normalizeEmail(input.email);

  if (input.checkoutState) {
    const rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "expiresAt"
      FROM "commercial_checkout_intents"
      WHERE "state" = ${input.checkoutState}
      FOR UPDATE
    `);
    const row = rows[0] ?? null;
    if (!row || row.status !== "created" || row.expiresAt <= new Date()) return null;
    if (row.provider !== input.provider) return null;
    if (productKey && row.productKey !== productKey) return null;
    if (email && row.email !== email) return null;
    return row;
  }

  if (input.organizationId) {
    const rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "expiresAt"
      FROM "commercial_checkout_intents"
      WHERE "organizationId" = ${input.organizationId}
        AND "provider" = ${input.provider}
        AND "status" = 'created'
        AND "expiresAt" > CURRENT_TIMESTAMP
        ${productKey ? Prisma.sql`AND "productKey" = ${productKey}` : Prisma.empty}
      ORDER BY "createdAt" DESC
      LIMIT 2
      FOR UPDATE
    `);
    return rows.length === 1 ? rows[0] : null;
  }

  if (!email || !productKey) return null;
  const rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
    SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "expiresAt"
    FROM "commercial_checkout_intents"
    WHERE "email" = ${email}
      AND "provider" = ${input.provider}
      AND "productKey" = ${productKey}
      AND "status" = 'created'
      AND "expiresAt" > CURRENT_TIMESTAMP
    ORDER BY "createdAt" DESC
    LIMIT 2
    FOR UPDATE
  `);
  return rows.length === 1 ? rows[0] : null;
}

async function insertPaymentEvent(tx: Prisma.TransactionClient, input: CommercialPaymentEvidenceInput, productKey: string | null) {
  const eventId = randomUUID();
  const rows = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    INSERT INTO "commercial_payment_events" (
      "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
      "payloadHash", "externalCustomerId", "externalSubscriptionId", "organizationId", "productKey",
      "amountCents", "currency", "payload"
    ) VALUES (
      ${eventId}, ${input.provider}, ${input.eventId}, ${input.eventType}, ${input.verified}, ${input.verificationMethod}, ${input.processorVerified},
      ${input.payloadHash}, ${input.externalCustomerId ?? null}, ${input.externalSubscriptionId ?? null}, ${input.organizationId ?? null}, ${productKey},
      ${input.amountCents ?? null}, ${normalizeCurrency(input.currency)}, ${JSON.stringify(input.payload)}::jsonb
    )
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id", "provider", "eventId", "eventType", "verified", "processingStatus", "externalSubscriptionId", "organizationId", "productKey"
  `);
  if (rows[0]) return { row: rows[0], inserted: true };
  const existing = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    SELECT "id", "provider", "eventId", "eventType", "verified", "processingStatus", "externalSubscriptionId", "organizationId", "productKey"
    FROM "commercial_payment_events"
    WHERE "provider" = ${input.provider} AND "eventId" = ${input.eventId}
    FOR UPDATE
  `);
  if (!existing[0]) throw new Error("Commercial payment event could not be persisted.");
  return { row: existing[0], inserted: false };
}

async function markEvent(
  tx: Prisma.TransactionClient,
  id: string,
  status: CommercialPaymentProcessingStatus,
  organizationId: string | null,
  productKey: string | null,
  failureReason: string | null = null,
) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "commercial_payment_events"
    SET "processingStatus" = ${status},
        "organizationId" = COALESCE(${organizationId}, "organizationId"),
        "productKey" = COALESCE(${productKey}, "productKey"),
        "failureReason" = ${failureReason},
        "processedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `);
}

/**
 * Record signed/API/manual payment evidence. This never grants access merely because
 * a processor called us: activation happens only after the event is verified and can
 * be unambiguously correlated to a Klinikos organization and known product.
 */
export async function recordCommercialPaymentEvidence(input: CommercialPaymentEvidenceInput) {
  assertEvidenceShape(input);
  const product = getCommercialProduct(input.productKey);
  const productKey = product?.key ?? null;

  return db.$transaction(async (tx) => {
    const inserted = await insertPaymentEvent(tx, input, productKey);
    const event = inserted.row;
    if (!inserted.inserted) return { eventId: event.id, status: event.processingStatus, idempotent: true, organizationId: event.organizationId };

    if (!input.verified) {
      await markEvent(tx, event.id, "failed", null, productKey, "Payment evidence was not verified.");
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId: null };
    }
    if (!product) {
      await markEvent(tx, event.id, "ignored", null, null, "Payment referenced an unmapped Klinikos product.");
      return { eventId: event.id, status: "ignored" as const, idempotent: false, organizationId: null };
    }

    const intent = await resolveCheckoutIntent(tx, input, product.key);
    const organizationId = input.organizationId ?? intent?.organizationId ?? null;
    if (!organizationId) {
      await markEvent(tx, event.id, "ignored", null, product.key, "Verified payment could not be unambiguously linked to a Klinikos organization.");
      return { eventId: event.id, status: "ignored" as const, idempotent: false, organizationId: null };
    }

    const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true, status: true } });
    if (!organization || organization.status !== "active") {
      await markEvent(tx, event.id, "failed", organizationId, product.key, "Linked organization is not active.");
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId };
    }

    if (intent) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_checkout_intents"
        SET "status" = 'completed', "completedAt" = CURRENT_TIMESTAMP,
            "externalCustomerId" = ${input.externalCustomerId ?? null},
            "externalSubscriptionId" = ${input.externalSubscriptionId ?? null},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${intent.id}
      `);
    }

    await markEvent(tx, event.id, "applied", organizationId, product.key);
    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: null,
        actorType: "system",
        action: "commercial.payment_evidence_applied",
        resourceType: "commercial_payment_event",
        resourceId: event.id,
        metadata: {
          provider: input.provider,
          eventType: input.eventType,
          productKey: product.key,
          processorVerified: input.processorVerified,
          verificationMethod: input.verificationMethod,
          amountCents: input.amountCents ?? null,
        },
      },
    });
    return { eventId: event.id, status: "applied" as const, idempotent: false, organizationId };
  });
}

async function corroboratingPaymentExists(
  tx: Prisma.TransactionClient,
  input: { provider: string; organizationId: string; productKey: string; externalSubscriptionId?: string | null },
) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "commercial_payment_events"
    WHERE "provider" = ${input.provider}
      AND "organizationId" = ${input.organizationId}
      AND "productKey" = ${input.productKey}
      AND "verified" = TRUE
      AND "processingStatus" = 'applied'
      AND "eventType" IN ('payment.succeeded', 'manual.payment_confirmed')
      ${input.externalSubscriptionId ? Prisma.sql`AND ("externalSubscriptionId" = ${input.externalSubscriptionId} OR "externalSubscriptionId" IS NULL)` : Prisma.empty}
    ORDER BY "receivedAt" DESC
    LIMIT 1
    FOR SHARE
  `);
  return rows[0]?.id ?? null;
}

/**
 * Activate or renew Klinikos access from a verified membership/subscription event,
 * but only when a separate applied payment event corroborates that the plan was paid.
 */
export async function activateCommercialSubscription(input: {
  provider: string;
  eventEvidenceId: string;
  organizationId: string;
  productKey: CommercialProductKey;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  periodStartsAt: Date;
  periodEndsAt: Date;
}) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");
  if (input.periodEndsAt <= input.periodStartsAt) throw new Error("Subscription period is invalid.");

  return db.$transaction(async (tx) => {
    const membershipEvidence = await tx.$queryRaw<Array<{ id: string; verified: boolean; processingStatus: string }>>(Prisma.sql`
      SELECT "id", "verified", "processingStatus"
      FROM "commercial_payment_events"
      WHERE "id" = ${input.eventEvidenceId} AND "organizationId" = ${input.organizationId} AND "provider" = ${input.provider}
      FOR SHARE
    `);
    if (!membershipEvidence[0]?.verified || membershipEvidence[0].processingStatus !== "applied") {
      throw new Error("Subscription activation requires applied verified membership evidence.");
    }

    const paymentEvidenceId = await corroboratingPaymentExists(tx, input);
    if (!paymentEvidenceId) throw new Error("Subscription activation is waiting for corroborating verified payment evidence.");

    const subscriptions = await tx.$queryRaw<SubscriptionRawRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "planKey", "status", "modules", "currentPeriodEndsAt",
             "paymentConfirmedAt", "paymentProvider", "paymentEvidenceId"
      FROM "subscriptions"
      WHERE "organizationId" = ${input.organizationId}
      ORDER BY "createdAt" DESC
      LIMIT 1
      FOR UPDATE
    `);
    const existing = subscriptions[0] ?? null;
    const mergedModules = [...new Set([...(existing?.modules ?? []), ...product.modules])];
    let subscriptionId: string;

    if (existing) {
      subscriptionId = existing.id;
      await tx.clinicSubscription.update({
        where: { id: existing.id },
        data: {
          planKey: product.key,
          status: "active",
          modules: mergedModules,
          currentPeriodEndsAt: input.periodEndsAt,
          externalCustomerId: input.externalCustomerId ?? undefined,
          externalSubscriptionId: input.externalSubscriptionId ?? undefined,
        },
      });
    } else {
      const created = await tx.clinicSubscription.create({
        data: {
          organizationId: input.organizationId,
          planKey: product.key,
          status: "active",
          modules: [...product.modules],
          currentPeriodEndsAt: input.periodEndsAt,
          externalCustomerId: input.externalCustomerId ?? undefined,
          externalSubscriptionId: input.externalSubscriptionId ?? undefined,
        },
        select: { id: true },
      });
      subscriptionId = created.id;
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE "subscriptions"
      SET "paymentConfirmedAt" = CURRENT_TIMESTAMP,
          "paymentProvider" = ${input.provider},
          "paymentEvidenceId" = ${paymentEvidenceId},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${subscriptionId}
    `);

    const periodKey = `${input.provider}:${input.externalSubscriptionId ?? subscriptionId}:${input.periodStartsAt.toISOString()}`;
    for (const allowance of configuredAllowanceCents(product)) {
      const bucket = allowance.bucket as CommercialCostBucket;
      const allowanceId = randomUUID();
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "commercial_usage_allowances" (
          "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "periodStartsAt", "periodEndsAt"
        ) VALUES (
          ${allowanceId}, ${input.organizationId}, ${periodKey}, ${bucket}, ${allowance.amountCents}, ${input.periodStartsAt}, ${input.periodEndsAt}
        )
        ON CONFLICT ("organizationId", "billingPeriodKey", "bucket") DO UPDATE SET
          "includedBudgetCents" = GREATEST("commercial_usage_allowances"."includedConsumedCents" + "commercial_usage_allowances"."includedReservedCents", EXCLUDED."includedBudgetCents"),
          "periodStartsAt" = EXCLUDED."periodStartsAt",
          "periodEndsAt" = EXCLUDED."periodEndsAt",
          "updatedAt" = CURRENT_TIMESTAMP
      `);
    }

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: null,
        actorType: "system",
        action: "commercial.subscription_activated",
        resourceType: "subscription",
        resourceId: subscriptionId,
        metadata: {
          provider: input.provider,
          productKey: product.key,
          externalSubscriptionId: input.externalSubscriptionId ?? null,
          periodStartsAt: input.periodStartsAt.toISOString(),
          periodEndsAt: input.periodEndsAt.toISOString(),
          paymentEvidenceId,
          membershipEvidenceId: input.eventEvidenceId,
          modules: mergedModules,
          allowancesConfiguredFromEnvironment: configuredAllowanceCents(product),
        },
      },
    });

    return { subscriptionId, modules: mergedModules, periodKey };
  });
}

export async function revokeCommercialSubscription(input: {
  provider: string;
  eventEvidenceId: string;
  organizationId: string;
  externalSubscriptionId?: string | null;
  reason: string;
}) {
  return db.$transaction(async (tx) => {
    const evidence = await tx.$queryRaw<Array<{ id: string; verified: boolean; processingStatus: string }>>(Prisma.sql`
      SELECT "id", "verified", "processingStatus"
      FROM "commercial_payment_events"
      WHERE "id" = ${input.eventEvidenceId} AND "organizationId" = ${input.organizationId} AND "provider" = ${input.provider}
      FOR SHARE
    `);
    if (!evidence[0]?.verified || evidence[0].processingStatus !== "applied") throw new Error("Subscription revocation requires applied verified provider evidence.");

    const updated = await tx.clinicSubscription.updateMany({
      where: {
        organizationId: input.organizationId,
        status: { in: ["active", "trialing"] },
        ...(input.externalSubscriptionId ? { externalSubscriptionId: input.externalSubscriptionId } : {}),
      },
      data: { status: "canceled", currentPeriodEndsAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: null,
        actorType: "system",
        action: "commercial.subscription_revoked",
        resourceType: "subscription",
        resourceId: input.externalSubscriptionId ?? input.organizationId,
        metadata: { provider: input.provider, reason: input.reason, updatedSubscriptions: updated.count, evidenceId: input.eventEvidenceId },
      },
    });
    return updated.count;
  });
}
