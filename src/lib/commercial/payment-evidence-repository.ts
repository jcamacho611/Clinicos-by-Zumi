import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  configuredAllowanceCents,
  getCommercialProduct,
  type CommercialProductKey,
} from "@/lib/commercial/product-catalog";
import type { NormalizedCommercialWebhook } from "@/lib/commercial/payment-connectors/types";

const DEFAULT_ALLOWANCE_PERIOD_DAYS = 30;

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
  processingStatus: string;
  organizationId: string | null;
  productKey: string | null;
};

type SubscriptionRawRow = {
  id: string;
  modules: string[];
  externalSubscriptionId: string | null;
};

function normalizedEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function allowancePeriodEnd(input: Date | null | undefined) {
  if (input && input > new Date()) return input;
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + DEFAULT_ALLOWANCE_PERIOD_DAYS);
  return end;
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

  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new Error("Organization is not active.");

  const email = normalizedEmail(input.email);
  if (!email) throw new Error("Checkout requires a signed-in account email.");

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

async function insertPaymentEvent(tx: Prisma.TransactionClient, event: NormalizedCommercialWebhook) {
  const id = randomUUID();
  const rows = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    INSERT INTO "commercial_payment_events" (
      "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
      "payloadHash", "externalCustomerId", "externalSubscriptionId", "productKey", "amountCents", "currency", "payload"
    ) VALUES (
      ${id}, ${event.provider}, ${event.eventId}, ${event.eventType}, TRUE, ${event.verificationMethod}, TRUE,
      ${event.payloadHash}, ${event.externalCustomerId}, ${event.externalSubscriptionId}, ${event.productKey},
      ${event.amountCents}, ${event.currency ?? "USD"}, ${JSON.stringify(event.payload)}::jsonb
    )
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id", "provider", "eventId", "eventType", "processingStatus", "organizationId", "productKey"
  `);
  if (rows[0]) return { row: rows[0], inserted: true };

  const existing = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    SELECT "id", "provider", "eventId", "eventType", "processingStatus", "organizationId", "productKey"
    FROM "commercial_payment_events"
    WHERE "provider" = ${event.provider} AND "eventId" = ${event.eventId}
    FOR UPDATE
  `);
  if (!existing[0]) throw new Error("Commercial payment event could not be persisted.");
  return { row: existing[0], inserted: false };
}

async function findCheckoutIntent(tx: Prisma.TransactionClient, event: NormalizedCommercialWebhook) {
  if (!event.productKey || !event.email) return null;
  const email = normalizedEmail(event.email);
  if (!email) return null;

  const rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
    SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "expiresAt"
    FROM "commercial_checkout_intents"
    WHERE "provider" = ${event.provider}
      AND "productKey" = ${event.productKey}
      AND "email" = ${email}
      AND "status" IN ('created', 'completed')
      AND ("status" = 'completed' OR "expiresAt" > CURRENT_TIMESTAMP)
    ORDER BY "createdAt" DESC
    LIMIT 2
    FOR UPDATE
  `);

  if (rows.length !== 1) return null;
  return rows[0];
}

async function findOrganizationBySubscription(tx: Prisma.TransactionClient, externalSubscriptionId: string | null) {
  if (!externalSubscriptionId) return null;
  const row = await tx.clinicSubscription.findFirst({
    where: { externalSubscriptionId },
    select: { organizationId: true },
  });
  return row?.organizationId ?? null;
}

async function markEvent(
  tx: Prisma.TransactionClient,
  input: { id: string; status: "ignored" | "applied" | "failed"; organizationId?: string | null; productKey?: string | null; failureReason?: string | null },
) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "commercial_payment_events"
    SET "processingStatus" = ${input.status},
        "organizationId" = COALESCE(${input.organizationId ?? null}, "organizationId"),
        "productKey" = COALESCE(${input.productKey ?? null}, "productKey"),
        "failureReason" = ${input.failureReason ?? null},
        "processedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.id}
  `);
}

async function ensureFundingAccount(tx: Prisma.TransactionClient, organizationId: string) {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_funding_accounts" ("organizationId")
    VALUES (${organizationId})
    ON CONFLICT ("organizationId") DO NOTHING
  `);
}

async function activatePaidProduct(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    productKey: CommercialProductKey;
    provider: string;
    paymentEvidenceId: string;
    externalCustomerId: string | null;
    externalSubscriptionId: string | null;
    periodStartsAt: Date | null;
    periodEndsAt: Date | null;
  },
) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");

  const subscriptions = await tx.$queryRaw<SubscriptionRawRow[]>(Prisma.sql`
    SELECT "id", "modules", "externalSubscriptionId"
    FROM "subscriptions"
    WHERE "organizationId" = ${input.organizationId}
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE
  `);
  const existing = subscriptions[0] ?? null;
  const modules = [...new Set([...(existing?.modules ?? []), ...product.modules])];
  const startsAt = input.periodStartsAt ?? new Date();
  const endsAt = input.periodEndsAt ?? null;
  let subscriptionId: string;

  if (existing) {
    subscriptionId = existing.id;
    await tx.clinicSubscription.update({
      where: { id: existing.id },
      data: {
        planKey: product.key,
        status: "active",
        modules,
        currentPeriodStartsAt: startsAt,
        currentPeriodEndsAt: endsAt,
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
        currentPeriodStartsAt: startsAt,
        currentPeriodEndsAt: endsAt,
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
        "paymentEvidenceId" = ${input.paymentEvidenceId},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${subscriptionId}
  `);

  await ensureFundingAccount(tx, input.organizationId);
  const allowanceEnd = allowancePeriodEnd(input.periodEndsAt);
  const billingPeriodKey = `${input.provider}:${input.externalSubscriptionId ?? subscriptionId}:${startsAt.toISOString()}`;
  for (const allowance of configuredAllowanceCents(product)) {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_usage_allowances" (
        "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "periodStartsAt", "periodEndsAt"
      ) VALUES (
        ${randomUUID()}, ${input.organizationId}, ${billingPeriodKey}, ${allowance.bucket}, ${allowance.amountCents}, ${startsAt}, ${allowanceEnd}
      )
      ON CONFLICT ("organizationId", "billingPeriodKey", "bucket") DO UPDATE SET
        "includedBudgetCents" = GREATEST(
          "commercial_usage_allowances"."includedConsumedCents" + "commercial_usage_allowances"."includedReservedCents",
          EXCLUDED."includedBudgetCents"
        ),
        "periodStartsAt" = EXCLUDED."periodStartsAt",
        "periodEndsAt" = EXCLUDED."periodEndsAt",
        "updatedAt" = CURRENT_TIMESTAMP
    `);
  }

  return { subscriptionId, modules, billingPeriodKey };
}

async function blockVariableSpend(tx: Prisma.TransactionClient, organizationId: string, reason: string) {
  await ensureFundingAccount(tx, organizationId);
  await tx.$executeRaw(Prisma.sql`
    UPDATE "commercial_funding_accounts"
    SET "blockedAt" = CURRENT_TIMESTAMP, "blockReason" = ${reason}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "organizationId" = ${organizationId}
  `);
}

/**
 * Apply one cryptographically verified provider event.
 *
 * Provider truth is evidence, not authorization. The event must map to exactly one
 * Klinikos organization and one declared product before any entitlement changes.
 */
export async function applyNormalizedCommercialWebhook(event: NormalizedCommercialWebhook) {
  return db.$transaction(async (tx) => {
    const persisted = await insertPaymentEvent(tx, event);
    if (!persisted.inserted) {
      return {
        eventEvidenceId: persisted.row.id,
        status: persisted.row.processingStatus,
        idempotent: true,
        organizationId: persisted.row.organizationId,
      };
    }

    const product = getCommercialProduct(event.productKey);
    if (!product) {
      await markEvent(tx, { id: persisted.row.id, status: "ignored", failureReason: "Webhook did not map to a declared Klinikos product." });
      return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId: null };
    }

    const intent = await findCheckoutIntent(tx, event);
    const organizationId = intent?.organizationId ?? (await findOrganizationBySubscription(tx, event.externalSubscriptionId));
    if (!organizationId) {
      await markEvent(tx, {
        id: persisted.row.id,
        status: "ignored",
        productKey: product.key,
        failureReason: "Verified webhook could not be unambiguously linked to a Klinikos organization.",
      });
      return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId: null };
    }

    if (event.eventType === "payment.succeeded") {
      const activated = await activatePaidProduct(tx, {
        organizationId,
        productKey: product.key,
        provider: event.provider,
        paymentEvidenceId: persisted.row.id,
        externalCustomerId: event.externalCustomerId,
        externalSubscriptionId: event.externalSubscriptionId,
        periodStartsAt: event.periodStartsAt,
        periodEndsAt: event.periodEndsAt,
      });
      if (intent?.status === "created") {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "commercial_checkout_intents"
          SET "status" = 'completed', "completedAt" = CURRENT_TIMESTAMP,
              "externalCheckoutId" = COALESCE("externalCheckoutId", ${event.externalSubscriptionId}),
              "externalCustomerId" = ${event.externalCustomerId},
              "externalSubscriptionId" = ${event.externalSubscriptionId},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${intent.id}
        `);
      }
      await markEvent(tx, { id: persisted.row.id, status: "applied", organizationId, productKey: product.key });
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.subscription_activated_from_verified_payment",
          resourceType: "subscription",
          resourceId: activated.subscriptionId,
          metadata: {
            provider: event.provider,
            productKey: product.key,
            paymentEvidenceId: persisted.row.id,
            processorVerified: true,
            modules: activated.modules,
          },
        },
      });
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    if (event.eventType === "membership.activated") {
      const subscription = await tx.clinicSubscription.findFirst({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!subscription) {
        await markEvent(tx, {
          id: persisted.row.id,
          status: "ignored",
          organizationId,
          productKey: product.key,
          failureReason: "Membership activation arrived before a corroborating paid Klinikos subscription existed.",
        });
        return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId };
      }
      await tx.clinicSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          externalCustomerId: event.externalCustomerId ?? undefined,
          externalSubscriptionId: event.externalSubscriptionId ?? undefined,
          currentPeriodStartsAt: event.periodStartsAt ?? undefined,
          currentPeriodEndsAt: event.periodEndsAt ?? undefined,
        },
      });
      await markEvent(tx, { id: persisted.row.id, status: "applied", organizationId, productKey: product.key });
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    if (event.eventType === "membership.deactivated") {
      await tx.clinicSubscription.updateMany({
        where: {
          organizationId,
          status: { in: ["active", "trialing"] },
          ...(event.externalSubscriptionId ? { externalSubscriptionId: event.externalSubscriptionId } : {}),
        },
        data: { status: "canceled", currentPeriodEndsAt: new Date() },
      });
      await blockVariableSpend(tx, organizationId, "Membership was deactivated by the connected payment provider.");
      await markEvent(tx, { id: persisted.row.id, status: "applied", organizationId, productKey: product.key });
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    if (event.eventType === "refund.created" || event.eventType === "dispute.created") {
      await blockVariableSpend(
        tx,
        organizationId,
        event.eventType === "refund.created"
          ? "A refund was reported by the connected payment provider; variable-cost execution is held for review."
          : "A payment dispute was reported by the connected payment provider; variable-cost execution is held for review.",
      );
      await markEvent(tx, { id: persisted.row.id, status: "applied", organizationId, productKey: product.key });
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    await markEvent(tx, { id: persisted.row.id, status: "ignored", organizationId, productKey: product.key });
    return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId };
  });
}

/**
 * Manual evidence path for the current GoDaddy checkout. This is intentionally
 * explicit and operator-attributed; it never claims processor verification.
 */
export async function applyManualCommercialPayment(input: {
  organizationId: string;
  actorId: string;
  productKey: CommercialProductKey;
  provider: "godaddy";
  externalReference: string;
  amountCents: number;
  currency?: string;
}) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");
  if (!input.externalReference.trim()) throw new Error("Manual payment reconciliation requires an external reference.");
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("Manual payment amount must be a positive integer number of cents.");

  const eventId = `manual:${input.provider}:${input.externalReference.trim()}`;
  return db.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
      SELECT "id", "provider", "eventId", "eventType", "processingStatus", "organizationId", "productKey"
      FROM "commercial_payment_events"
      WHERE "provider" = ${input.provider} AND "eventId" = ${eventId}
      FOR UPDATE
    `);
    if (existing[0]) return { eventEvidenceId: existing[0].id, status: existing[0].processingStatus, idempotent: true };

    const evidenceId = randomUUID();
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_payment_events" (
        "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
        "payloadHash", "processingStatus", "organizationId", "productKey", "amountCents", "currency", "payload", "processedAt"
      ) VALUES (
        ${evidenceId}, ${input.provider}, ${eventId}, 'manual.payment_confirmed', TRUE, 'manual_reconciliation', FALSE,
        ${input.externalReference.trim()}, 'applied', ${input.organizationId}, ${product.key}, ${input.amountCents}, ${input.currency?.toUpperCase() ?? "USD"},
        ${JSON.stringify({ externalReference: input.externalReference.trim(), reconciledBy: input.actorId })}::jsonb, CURRENT_TIMESTAMP
      )
    `);

    const activated = await activatePaidProduct(tx, {
      organizationId: input.organizationId,
      productKey: product.key,
      provider: input.provider,
      paymentEvidenceId: evidenceId,
      externalCustomerId: null,
      externalSubscriptionId: null,
      periodStartsAt: new Date(),
      periodEndsAt: null,
    });

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: "user",
        action: "commercial.manual_payment_reconciled",
        resourceType: "subscription",
        resourceId: activated.subscriptionId,
        metadata: {
          provider: input.provider,
          productKey: product.key,
          externalReference: input.externalReference.trim(),
          amountCents: input.amountCents,
          processorVerified: false,
          manualReconciliation: true,
        },
      },
    });

    return { eventEvidenceId: evidenceId, status: "applied", idempotent: false };
  });
}
