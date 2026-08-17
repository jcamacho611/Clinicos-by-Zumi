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
import type {
  CommercialPaymentOutcome,
  CommercialProcessorMode,
} from "@/lib/commercial/payment-connectors/types";

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
  processorMode?: CommercialProcessorMode;
  outcome?: CommercialPaymentOutcome;
  checkoutIntentId?: string | null;
  externalCheckoutId?: string | null;
  externalPaymentIntentId?: string | null;
};

export type CheckoutIntentRow = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  email: string;
  organizationId: string | null;
  status: string;
  expiresAt: Date;
  amountCents: number | null;
  currency: string;
  processorMode: CommercialProcessorMode;
  externalCheckoutId: string | null;
  externalPaymentIntentId: string | null;
  refundedAmountCents: number;
};

type PaymentEventRow = {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  verified: boolean;
  verificationMethod: CommercialVerificationMethod;
  processorVerified: boolean;
  processorMode: CommercialProcessorMode;
  outcome: CommercialPaymentOutcome;
  payloadHash: string;
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

function normalizeProcessorMode(value: CommercialProcessorMode | null | undefined): CommercialProcessorMode {
  return value ?? "manual";
}

function normalizeOutcome(value: CommercialPaymentOutcome | null | undefined): CommercialPaymentOutcome {
  return value ?? "succeeded";
}

function assertEvidenceShape(input: CommercialPaymentEvidenceInput) {
  if (!input.provider.trim() || !input.eventId.trim() || !input.eventType.trim() || !input.payloadHash.trim()) {
    throw new Error("Commercial payment evidence is missing required identifiers.");
  }
  if (input.processorVerified && input.verificationMethod === "manual_reconciliation") {
    throw new Error("Manual reconciliation cannot be represented as processor verification.");
  }
  if (input.processorVerified && normalizeProcessorMode(input.processorMode) === "manual") {
    throw new Error("Processor-verified evidence must declare live or test mode.");
  }
}

export async function createCommercialCheckoutIntent(input: {
  organizationId: string;
  email: string;
  provider: string;
  productKey: CommercialProductKey;
  amountCents?: number | null;
  currency?: string | null;
  processorMode?: CommercialProcessorMode;
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
  const amountCents = input.amountCents ?? product.priceCents ?? null;
  if (amountCents !== null && (!Number.isInteger(amountCents) || amountCents < 0)) {
    throw new Error("Checkout amount must be a non-negative integer number of cents.");
  }
  if (product.priceCents !== null && amountCents !== product.priceCents) {
    throw new Error("Checkout amount does not match the server-owned product price.");
  }
  const currency = normalizeCurrency(input.currency);
  const processorMode = normalizeProcessorMode(input.processorMode);

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_checkout_intents" (
      "id", "state", "provider", "productKey", "email", "organizationId", "amountCents", "currency", "processorMode", "expiresAt"
    ) VALUES (
      ${id}, ${state}, ${input.provider}, ${product.key}, ${email}, ${input.organizationId},
      ${amountCents}, ${currency}, ${processorMode}, ${expiresAt}
    )
  `);

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: null,
      actorType: "system",
      action: "commercial.checkout_intent_created",
      resourceType: "commercial_checkout_intent",
      resourceId: id,
      metadata: { provider: input.provider, productKey: product.key, processorMode, amountCents, currency, expiresAt: expiresAt.toISOString() },
    },
  });
  return { id, state, expiresAt, product, amountCents, currency, processorMode };
}

export async function attachCommercialCheckoutReferences(input: {
  intentId: string;
  organizationId: string;
  provider: string;
  externalCheckoutId: string;
}) {
  const updated = await db.$executeRaw(Prisma.sql`
    UPDATE "commercial_checkout_intents"
    SET "externalCheckoutId" = ${input.externalCheckoutId}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.intentId}
      AND "organizationId" = ${input.organizationId}
      AND "provider" = ${input.provider}
      AND "status" = 'created'
  `);
  if (updated !== 1) throw new Error("Commercial checkout intent could not be linked to the processor session.");
}

async function resolveCheckoutIntent(
  tx: Prisma.TransactionClient,
  input: CommercialPaymentEvidenceInput,
  productKey: string | null,
) {
  const email = normalizeEmail(input.email);
  const columns = Prisma.sql`
    "id", "state", "provider", "productKey", "email", "organizationId", "status", "expiresAt",
    "amountCents", "currency", "processorMode", "externalCheckoutId", "externalPaymentIntentId", "refundedAmountCents"
  `;

  let rows: CheckoutIntentRow[] = [];

  if (input.checkoutIntentId) {
    rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT ${columns}
      FROM "commercial_checkout_intents"
      WHERE "id" = ${input.checkoutIntentId}
      FOR UPDATE
    `);
  } else if (input.checkoutState) {
    rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT ${columns}
      FROM "commercial_checkout_intents"
      WHERE "state" = ${input.checkoutState}
      FOR UPDATE
    `);
  } else if (input.externalPaymentIntentId) {
    rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT ${columns}
      FROM "commercial_checkout_intents"
      WHERE "provider" = ${input.provider}
        AND "externalPaymentIntentId" = ${input.externalPaymentIntentId}
      LIMIT 2
      FOR UPDATE
    `);
  } else if (input.organizationId) {
    rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT ${columns}
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
  } else if (email && productKey) {
    rows = await tx.$queryRaw<CheckoutIntentRow[]>(Prisma.sql`
      SELECT ${columns}
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
  }

  return rows.length === 1 ? rows[0] : null;
}

export function validateProcessorEvidenceAgainstIntent(
  input: CommercialPaymentEvidenceInput,
  intent: CheckoutIntentRow,
) {
  const email = normalizeEmail(input.email);
  if (intent.provider !== input.provider) return "Payment provider does not match the checkout intent.";
  if (input.checkoutIntentId && input.checkoutIntentId !== intent.id) return "Payment checkout reference does not match the checkout intent.";
  if (input.checkoutState && input.checkoutState !== intent.state) return "Payment checkout state does not match the checkout intent.";
  if (input.productKey && intent.productKey !== input.productKey) return "Payment product does not match the checkout intent.";
  if (input.organizationId && intent.organizationId !== input.organizationId) return "Payment organization does not match the checkout intent.";
  if (email && intent.email !== email) return "Payment buyer does not match the checkout intent.";

  if (!input.processorVerified) {
    if (!["created", "completed"].includes(intent.status)) return "Checkout intent is not available for authorized reconciliation.";
    if (intent.amountCents !== null && input.amountCents !== null && input.amountCents !== undefined && input.amountCents !== intent.amountCents) {
      return "Reconciled amount does not match the checkout intent.";
    }
    if (input.currency && intent.currency !== normalizeCurrency(input.currency)) return "Reconciled currency does not match the checkout intent.";
    return null;
  }
  if (!input.checkoutIntentId && !input.checkoutState && !input.externalPaymentIntentId) {
    return "Processor payment is missing an opaque Klinikos checkout reference.";
  }

  const mode = normalizeProcessorMode(input.processorMode);
  const outcome = normalizeOutcome(input.outcome);
  if (mode === "manual" || intent.processorMode !== mode) return "Processor mode does not match the checkout intent.";
  if (!input.currency?.trim()) return "Processor evidence is missing its currency.";
  if (intent.currency !== normalizeCurrency(input.currency)) return "Payment currency does not match the checkout intent.";

  if (outcome === "succeeded") {
    // The Stripe Checkout Session is created with this same server-owned expiry.
    // A signed completion may arrive after that moment, but the customer could not
    // have completed the expired Session, so webhook delivery latency must not turn
    // real collected money into an uncorrelated failure.
    const successAfterRefund = ["completed", "refunded"].includes(intent.status)
      && intent.refundedAmountCents > 0
      && Boolean(intent.externalPaymentIntentId)
      && intent.externalPaymentIntentId === input.externalPaymentIntentId;
    if (intent.status !== "created" && !successAfterRefund) return "Checkout intent is not open for payment.";
    if (intent.amountCents === null || input.amountCents !== intent.amountCents) return "Payment amount does not match the checkout intent.";
    if (!intent.externalCheckoutId || input.externalCheckoutId !== intent.externalCheckoutId) {
      return "Processor Checkout Session does not match the checkout intent.";
    }
    if (!input.externalPaymentIntentId) return "Processor success is missing its PaymentIntent reference.";
    if (intent.externalPaymentIntentId && intent.externalPaymentIntentId !== input.externalPaymentIntentId) {
      return "Processor PaymentIntent does not match the checkout intent.";
    }
  }

  if (outcome === "pending") {
    if (intent.status !== "created") return "Checkout intent is not open for pending payment.";
    if (intent.amountCents === null || input.amountCents !== intent.amountCents) return "Pending payment amount does not match the checkout intent.";
    if (!intent.externalCheckoutId || input.externalCheckoutId !== intent.externalCheckoutId) {
      return "Pending processor Checkout Session does not match the checkout intent.";
    }
  }

  if (outcome === "failed") {
    if (intent.status !== "created") return "Checkout intent is not open for a payment failure.";
    if (intent.externalCheckoutId && input.externalCheckoutId && input.externalCheckoutId !== intent.externalCheckoutId) {
      return "Failed processor payment does not match the Checkout Session.";
    }
  }

  if (outcome === "refunded") {
    if (!["created", "completed", "refunded"].includes(intent.status)) return "Checkout intent cannot accept refund evidence in its current state.";
    if (!input.externalPaymentIntentId || (intent.externalPaymentIntentId && input.externalPaymentIntentId !== intent.externalPaymentIntentId)) {
      return "Refund does not match the completed PaymentIntent.";
    }
    if (intent.status === "created" && !input.checkoutIntentId && !input.checkoutState) {
      return "Out-of-order refund is missing an opaque Klinikos checkout reference.";
    }
    if (intent.amountCents === null || !input.amountCents || input.amountCents > intent.amountCents) {
      return "Refund amount is invalid for the checkout intent.";
    }
  }

  return null;
}

async function insertPaymentEvent(tx: Prisma.TransactionClient, input: CommercialPaymentEvidenceInput, productKey: string | null) {
  const eventId = randomUUID();
  const rows = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    INSERT INTO "commercial_payment_events" (
      "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
      "processorMode", "outcome", "payloadHash", "externalCheckoutId", "externalPaymentIntentId",
      "externalCustomerId", "externalSubscriptionId", "organizationId", "productKey", "amountCents", "currency", "payload"
    ) VALUES (
      ${eventId}, ${input.provider}, ${input.eventId}, ${input.eventType}, ${input.verified}, ${input.verificationMethod}, ${input.processorVerified},
      ${normalizeProcessorMode(input.processorMode)}, ${normalizeOutcome(input.outcome)}, ${input.payloadHash},
      ${input.externalCheckoutId ?? null}, ${input.externalPaymentIntentId ?? null},
      ${input.externalCustomerId ?? null}, ${input.externalSubscriptionId ?? null}, ${input.organizationId ?? null}, ${productKey},
      ${input.amountCents ?? null}, ${normalizeCurrency(input.currency)}, ${JSON.stringify(input.payload)}::jsonb
    )
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
              "processorMode", "outcome", "payloadHash", "processingStatus", "externalSubscriptionId", "organizationId", "productKey"
  `);
  if (rows[0]) return { row: rows[0], inserted: true };
  const existing = await tx.$queryRaw<PaymentEventRow[]>(Prisma.sql`
    SELECT "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
           "processorMode", "outcome", "payloadHash", "processingStatus", "externalSubscriptionId", "organizationId", "productKey"
    FROM "commercial_payment_events"
    WHERE "provider" = ${input.provider} AND "eventId" = ${input.eventId}
    FOR UPDATE
  `);
  if (!existing[0]) throw new Error("Commercial payment event could not be persisted.");
  if (
    existing[0].eventType !== input.eventType ||
    existing[0].verified !== input.verified ||
    existing[0].verificationMethod !== input.verificationMethod ||
    existing[0].processorVerified !== input.processorVerified ||
    existing[0].processorMode !== normalizeProcessorMode(input.processorMode) ||
    existing[0].outcome !== normalizeOutcome(input.outcome) ||
    existing[0].payloadHash !== input.payloadHash
  ) {
    throw new Error("Commercial payment event replay did not match the original signed evidence.");
  }
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
  const requestedProduct = getCommercialProduct(input.productKey);
  const requestedProductKey = requestedProduct?.key ?? null;
  const outcome = normalizeOutcome(input.outcome);

  return db.$transaction(async (tx) => {
    const inserted = await insertPaymentEvent(tx, input, requestedProductKey);
    const event = inserted.row;
    if (!inserted.inserted) return { eventId: event.id, status: event.processingStatus, idempotent: true, organizationId: event.organizationId };

    if (!input.verified) {
      await markEvent(tx, event.id, "failed", null, requestedProductKey, "Payment evidence was not verified.");
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId: null };
    }

    const intent = await resolveCheckoutIntent(tx, input, requestedProductKey);
    if (input.processorVerified && !intent) {
      if (outcome === "refunded") {
        // Stripe can deliver a refund before Checkout completion. Rolling this
        // transaction back keeps the external event retryable; once success stores
        // the PaymentIntent, the same signed refund can correlate and apply.
        throw new Error("Signed refund evidence is waiting for its original checkout intent.");
      }
      await markEvent(tx, event.id, "failed", null, requestedProductKey, "Processor payment could not be correlated to one server-owned checkout intent.");
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId: null };
    }

    const product = getCommercialProduct(intent?.productKey ?? requestedProductKey);
    if (!product) {
      await markEvent(tx, event.id, "ignored", intent?.organizationId ?? null, null, "Payment referenced an unmapped Klinikos product.");
      return { eventId: event.id, status: "ignored" as const, idempotent: false, organizationId: intent?.organizationId ?? null };
    }

    if (intent) {
      const rejection = validateProcessorEvidenceAgainstIntent(input, intent);
      if (rejection) {
        await markEvent(tx, event.id, "failed", intent.organizationId, product.key, rejection);
        if (intent.organizationId) {
          await tx.auditLog.create({
            data: {
              organizationId: intent.organizationId,
              actorId: null,
              actorType: "system",
              action: "commercial.payment_evidence_rejected",
              resourceType: "commercial_payment_event",
              resourceId: event.id,
              metadata: { provider: input.provider, eventType: input.eventType, outcome, processorMode: normalizeProcessorMode(input.processorMode), reason: rejection },
            },
          });
        }
        return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId: intent.organizationId };
      }
    }

    const organizationId = intent?.organizationId ?? input.organizationId ?? null;
    if (!organizationId) {
      await markEvent(tx, event.id, "ignored", null, product.key, "Verified payment could not be unambiguously linked to a Klinikos organization.");
      return { eventId: event.id, status: "ignored" as const, idempotent: false, organizationId: null };
    }

    const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true, status: true } });
    if (!organization || organization.status !== "active") {
      await markEvent(tx, event.id, "failed", organizationId, product.key, "Linked organization is not active.");
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId };
    }

    if (outcome === "failed") {
      await markEvent(tx, event.id, "failed", organizationId, product.key, "The processor reported that payment did not succeed.");
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.payment_failed",
          resourceType: "commercial_payment_event",
          resourceId: event.id,
          metadata: { provider: input.provider, eventType: input.eventType, processorMode: normalizeProcessorMode(input.processorMode), checkoutIntentId: intent?.id ?? null },
        },
      });
      return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId };
    }

    if (outcome === "pending") {
      await markEvent(tx, event.id, "ignored", organizationId, product.key, "The signed Checkout Session is awaiting processor payment confirmation.");
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.payment_pending",
          resourceType: "commercial_payment_event",
          resourceId: event.id,
          metadata: { provider: input.provider, eventType: input.eventType, processorMode: normalizeProcessorMode(input.processorMode), checkoutIntentId: intent?.id ?? null },
        },
      });
      return { eventId: event.id, status: "ignored" as const, idempotent: false, organizationId };
    }

    if (outcome === "refunded") {
      if (!intent) {
        await markEvent(tx, event.id, "failed", organizationId, product.key, "Refund evidence is missing its original checkout intent.");
        return { eventId: event.id, status: "failed" as const, idempotent: false, organizationId };
      }
      const refundedAmountCents = Math.max(intent.refundedAmountCents, input.amountCents ?? 0);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_checkout_intents"
        SET "refundedAmountCents" = ${refundedAmountCents},
            "refundedAt" = CURRENT_TIMESTAMP,
            "externalPaymentIntentId" = COALESCE("externalPaymentIntentId", ${input.externalPaymentIntentId ?? null}),
            "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
            "status" = CASE WHEN "amountCents" IS NOT NULL AND ${refundedAmountCents} >= "amountCents" THEN 'refunded' ELSE 'completed' END,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${intent.id}
      `);
      await markEvent(tx, event.id, "applied", organizationId, product.key);
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.payment_refund_recorded",
          resourceType: "commercial_checkout_intent",
          resourceId: intent.id,
          metadata: { provider: input.provider, eventType: input.eventType, processorMode: normalizeProcessorMode(input.processorMode), refundedAmountCents },
        },
      });
      return { eventId: event.id, status: "applied" as const, idempotent: false, organizationId };
    }

    if (intent) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_checkout_intents"
        SET "status" = CASE WHEN "amountCents" IS NOT NULL AND "refundedAmountCents" >= "amountCents" THEN 'refunded' ELSE 'completed' END,
            "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
            "externalCustomerId" = ${input.externalCustomerId ?? null},
            "externalSubscriptionId" = ${input.externalSubscriptionId ?? null},
            "externalPaymentIntentId" = COALESCE("externalPaymentIntentId", ${input.externalPaymentIntentId ?? null}),
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
          currency: normalizeCurrency(input.currency),
          processorMode: normalizeProcessorMode(input.processorMode),
          checkoutIntentId: intent?.id ?? null,
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
