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

const DEFAULT_ALLOWANCE_DAYS = 30;

type IntentRow = {
  id: string;
  organizationId: string | null;
  status: string;
};

type EventRow = {
  id: string;
  processingStatus: string;
  organizationId: string | null;
};

type SubscriptionRow = {
  id: string;
  modules: string[];
};

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function defaultAllowanceEnd(candidate: Date | null | undefined) {
  if (candidate && candidate > new Date()) return candidate;
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + DEFAULT_ALLOWANCE_DAYS);
  return end;
}

async function ensureFundingAccount(tx: Prisma.TransactionClient, organizationId: string) {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_funding_accounts" ("organizationId")
    VALUES (${organizationId})
    ON CONFLICT ("organizationId") DO NOTHING
  `);
}

export async function createCommercialCheckoutIntent(input: {
  organizationId: string;
  email: string;
  provider: string;
  productKey: CommercialProductKey;
}) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");

  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: { status: true },
  });
  if (!organization || organization.status !== "active") throw new Error("Organization is not active.");

  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Checkout requires a signed-in account email.");

  const id = randomUUID();
  const state = randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_checkout_intents"
      ("id", "state", "provider", "productKey", "email", "organizationId", "expiresAt")
    VALUES
      (${id}, ${state}, ${input.provider}, ${product.key}, ${email}, ${input.organizationId}, ${expiresAt})
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

async function insertEvent(tx: Prisma.TransactionClient, event: NormalizedCommercialWebhook) {
  const id = randomUUID();
  const inserted = await tx.$queryRaw<EventRow[]>(Prisma.sql`
    INSERT INTO "commercial_payment_events" (
      "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
      "payloadHash", "externalCustomerId", "externalSubscriptionId", "productKey", "amountCents", "currency", "payload"
    ) VALUES (
      ${id}, ${event.provider}, ${event.eventId}, ${event.eventType}, TRUE, ${event.verificationMethod}, TRUE,
      ${event.payloadHash}, ${event.externalCustomerId}, ${event.externalSubscriptionId}, ${event.productKey},
      ${event.amountCents}, ${event.currency ?? "USD"}, ${JSON.stringify(event.payload)}::jsonb
    )
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id", "processingStatus", "organizationId"
  `);
  if (inserted[0]) return { row: inserted[0], inserted: true };

  const existing = await tx.$queryRaw<EventRow[]>(Prisma.sql`
    SELECT "id", "processingStatus", "organizationId"
    FROM "commercial_payment_events"
    WHERE "provider" = ${event.provider} AND "eventId" = ${event.eventId}
    FOR UPDATE
  `);
  if (!existing[0]) throw new Error("Commercial payment event could not be persisted.");
  return { row: existing[0], inserted: false };
}

async function resolveIntent(tx: Prisma.TransactionClient, event: NormalizedCommercialWebhook) {
  const email = normalizeEmail(event.email);
  if (!email || !event.productKey) return null;

  const rows = await tx.$queryRaw<IntentRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "status"
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

  return rows.length === 1 ? rows[0] : null;
}

async function resolveOrganization(tx: Prisma.TransactionClient, event: NormalizedCommercialWebhook) {
  const intent = await resolveIntent(tx, event);
  if (intent?.organizationId) return { organizationId: intent.organizationId, intent };

  if (event.externalSubscriptionId) {
    const subscription = await tx.clinicSubscription.findFirst({
      where: { externalSubscriptionId: event.externalSubscriptionId },
      select: { organizationId: true },
    });
    if (subscription) return { organizationId: subscription.organizationId, intent: null };
  }

  return { organizationId: null, intent: null };
}

async function markEvent(
  tx: Prisma.TransactionClient,
  id: string,
  status: "applied" | "ignored" | "failed",
  organizationId: string | null,
  productKey: string | null,
  failureReason?: string,
) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "commercial_payment_events"
    SET "processingStatus" = ${status},
        "organizationId" = COALESCE(${organizationId}, "organizationId"),
        "productKey" = COALESCE(${productKey}, "productKey"),
        "failureReason" = ${failureReason ?? null},
        "processedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `);
}

async function activateProduct(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    productKey: CommercialProductKey;
    provider: string;
    evidenceId: string;
    externalCustomerId: string | null;
    externalSubscriptionId: string | null;
    periodEndsAt: Date | null;
  },
) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");

  const existingRows = await tx.$queryRaw<SubscriptionRow[]>(Prisma.sql`
    SELECT "id", "modules"
    FROM "subscriptions"
    WHERE "organizationId" = ${input.organizationId}
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE
  `);
  const existing = existingRows[0] ?? null;
  const modules = [...new Set([...(existing?.modules ?? []), ...product.modules])];
  let subscriptionId: string;

  if (existing) {
    subscriptionId = existing.id;
    await tx.clinicSubscription.update({
      where: { id: existing.id },
      data: {
        planKey: product.key,
        status: "active",
        modules,
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
        "paymentEvidenceId" = ${input.evidenceId},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${subscriptionId}
  `);

  await ensureFundingAccount(tx, input.organizationId);
  const periodStart = new Date();
  const periodEnd = defaultAllowanceEnd(input.periodEndsAt);
  const billingPeriodKey = `${input.provider}:${input.externalSubscriptionId ?? subscriptionId}:${periodStart.toISOString()}`;

  for (const allowance of configuredAllowanceCents(product)) {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_usage_allowances" (
        "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "periodStartsAt", "periodEndsAt"
      ) VALUES (
        ${randomUUID()}, ${input.organizationId}, ${billingPeriodKey}, ${allowance.bucket}, ${allowance.amountCents}, ${periodStart}, ${periodEnd}
      )
      ON CONFLICT ("organizationId", "billingPeriodKey", "bucket") DO UPDATE SET
        "includedBudgetCents" = GREATEST(
          "commercial_usage_allowances"."includedConsumedCents" + "commercial_usage_allowances"."includedReservedCents",
          EXCLUDED."includedBudgetCents"
        ),
        "periodEndsAt" = EXCLUDED."periodEndsAt",
        "updatedAt" = CURRENT_TIMESTAMP
    `);
  }

  return { subscriptionId, modules };
}

async function holdVariableSpend(tx: Prisma.TransactionClient, organizationId: string, reason: string) {
  await ensureFundingAccount(tx, organizationId);
  await tx.$executeRaw(Prisma.sql`
    UPDATE "commercial_funding_accounts"
    SET "blockedAt" = CURRENT_TIMESTAMP, "blockReason" = ${reason}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "organizationId" = ${organizationId}
  `);
}

export async function applyNormalizedCommercialWebhook(event: NormalizedCommercialWebhook) {
  return db.$transaction(async (tx) => {
    const persisted = await insertEvent(tx, event);
    if (!persisted.inserted) {
      return { eventEvidenceId: persisted.row.id, status: persisted.row.processingStatus, idempotent: true, organizationId: persisted.row.organizationId };
    }

    const product = getCommercialProduct(event.productKey);
    if (!product) {
      await markEvent(tx, persisted.row.id, "ignored", null, null, "Webhook did not map to a declared Klinikos product.");
      return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId: null };
    }

    const resolved = await resolveOrganization(tx, event);
    if (!resolved.organizationId) {
      await markEvent(tx, persisted.row.id, "ignored", null, product.key, "Verified webhook could not be linked to exactly one Klinikos organization.");
      return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId: null };
    }
    const organizationId = resolved.organizationId;

    if (event.eventType === "payment.succeeded") {
      const activated = await activateProduct(tx, {
        organizationId,
        productKey: product.key,
        provider: event.provider,
        evidenceId: persisted.row.id,
        externalCustomerId: event.externalCustomerId,
        externalSubscriptionId: event.externalSubscriptionId,
        periodEndsAt: event.periodEndsAt,
      });

      if (resolved.intent?.status === "created") {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "commercial_checkout_intents"
          SET "status" = 'completed', "completedAt" = CURRENT_TIMESTAMP,
              "externalCustomerId" = ${event.externalCustomerId},
              "externalSubscriptionId" = ${event.externalSubscriptionId},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${resolved.intent.id}
        `);
      }

      await markEvent(tx, persisted.row.id, "applied", organizationId, product.key);
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.subscription_activated_from_verified_payment",
          resourceType: "subscription",
          resourceId: activated.subscriptionId,
          metadata: { provider: event.provider, productKey: product.key, paymentEvidenceId: persisted.row.id, processorVerified: true, modules: activated.modules },
        },
      });
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    if (event.eventType === "membership.activated") {
      const subscription = await tx.clinicSubscription.findFirst({ where: { organizationId }, orderBy: { createdAt: "desc" }, select: { id: true } });
      if (!subscription) {
        await markEvent(tx, persisted.row.id, "ignored", organizationId, product.key, "Membership activation arrived before verified payment activation.");
        return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId };
      }
      await tx.clinicSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          currentPeriodEndsAt: event.periodEndsAt ?? undefined,
          externalCustomerId: event.externalCustomerId ?? undefined,
          externalSubscriptionId: event.externalSubscriptionId ?? undefined,
        },
      });
      await markEvent(tx, persisted.row.id, "applied", organizationId, product.key);
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
      await holdVariableSpend(tx, organizationId, "Membership was deactivated by the connected payment provider.");
      await markEvent(tx, persisted.row.id, "applied", organizationId, product.key);
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    if (event.eventType === "refund.created" || event.eventType === "dispute.created") {
      await holdVariableSpend(
        tx,
        organizationId,
        event.eventType === "refund.created"
          ? "A refund was reported; variable-cost execution is held for review."
          : "A payment dispute was reported; variable-cost execution is held for review.",
      );
      await markEvent(tx, persisted.row.id, "applied", organizationId, product.key);
      return { eventEvidenceId: persisted.row.id, status: "applied", idempotent: false, organizationId };
    }

    await markEvent(tx, persisted.row.id, "ignored", organizationId, product.key);
    return { eventEvidenceId: persisted.row.id, status: "ignored", idempotent: false, organizationId };
  });
}

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
    const prior = await tx.$queryRaw<EventRow[]>(Prisma.sql`
      SELECT "id", "processingStatus", "organizationId"
      FROM "commercial_payment_events"
      WHERE "provider" = ${input.provider} AND "eventId" = ${eventId}
      FOR UPDATE
    `);
    if (prior[0]) return { eventEvidenceId: prior[0].id, status: prior[0].processingStatus, idempotent: true };

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

    const activated = await activateProduct(tx, {
      organizationId: input.organizationId,
      productKey: product.key,
      provider: input.provider,
      evidenceId,
      externalCustomerId: null,
      externalSubscriptionId: null,
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
