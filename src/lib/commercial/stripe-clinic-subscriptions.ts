import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { can } from "@/lib/auth/rbac";
import { getAuthSecret } from "@/lib/auth/config";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  clinicCheckoutRequestSchema,
  type ClinicPurchasablePlanKey,
} from "@/lib/commercial/clinic-activation-rules";
import {
  activateCommercialSubscription,
  revokeCommercialSubscription,
} from "@/lib/commercial/payment-evidence-repository";
import { stripeLivePaymentStatus } from "@/lib/commercial/payment-connectors/stripe";
import type { PaymentConnectorStatus } from "@/lib/commercial/payment-connectors/types";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import { slugifyOrganizationName } from "@/lib/onboarding-rules";

const INTENT_METADATA_KEY = "klinikos_checkout_intent_id";
const STATE_METADATA_KEY = "klinikos_checkout_state";
const PRODUCT_METADATA_KEY = "klinikos_product_key";
const CHECKOUT_TTL_MS = 23 * 60 * 60 * 1000;
const ACTIVATION_TTL_SECONDS = 7 * 24 * 60 * 60;

export class StripeClinicSubscriptionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type StripeSubscriptionSignal = {
  kind: "invoice_paid" | "invoice_failed" | "subscription_deleted";
  stripeEventId: string;
  stripeEventType: string;
  payloadHash: string;
  checkoutIntentId: string;
  checkoutState: string;
  productKey: ClinicPurchasablePlanKey;
  externalCustomerId: string | null;
  externalSubscriptionId: string;
  amountCents: number | null;
  currency: string | null;
  periodStartsAt: Date | null;
  periodEndsAt: Date | null;
  stripeObjectId: string;
};

type StripeIntentRow = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  email: string;
  organizationId: string | null;
  status: string;
  processorMode: string;
  externalCheckoutId: string | null;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
  amountCents: number | null;
  currency: string;
  metadata: Prisma.JsonValue;
};

type EvidenceRow = {
  id: string;
  eventType: string;
  payloadHash: string;
  processingStatus: string;
  organizationId: string | null;
  productKey: string | null;
  externalSubscriptionId: string | null;
};

type InvoiceShape = {
  id: string;
  customer?: string | { id: string } | null;
  amount_paid?: number | null;
  amount_due?: number | null;
  currency?: string | null;
  parent?: {
    type?: string | null;
    subscription_details?: {
      subscription?: string | { id: string } | null;
      metadata?: Record<string, string> | null;
    } | null;
  } | null;
  // Compatibility with Stripe webhook versions before invoice.parent became canonical.
  subscription?: string | { id: string } | null;
  subscription_details?: { metadata?: Record<string, string> | null } | null;
  lines?: {
    data?: Array<{
      amount?: number | null;
      period?: { start?: number | null; end?: number | null } | null;
      parent?: { type?: string | null } | null;
    }>;
  } | null;
};

type SubscriptionShape = {
  id: string;
  customer?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
};

function normalizeBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://klinikos.io").replace(/\/$/, "");
}

function stringId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function normalizedCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

function featureGateEnabled(env: NodeJS.ProcessEnv) {
  return env.KLINIKOS_STRIPE_RECURRING_ENABLED?.trim().toLowerCase() === "true";
}

export function stripeRecurringSubscriptionStatus(env: NodeJS.ProcessEnv = process.env): PaymentConnectorStatus {
  const base = stripeLivePaymentStatus(env);
  const enabled = featureGateEnabled(env);
  const missing = [...base.missing];
  if (!enabled) missing.push("KLINIKOS_STRIPE_RECURRING_ENABLED=true");
  return {
    key: "stripe_recurring",
    checkoutConfigured: base.checkoutConfigured && enabled,
    webhookConfigured: base.webhookConfigured,
    processorVerification: base.processorVerification && enabled,
    missing,
  };
}

function liveStripeClient(env: NodeJS.ProcessEnv = process.env) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key || !["sk_live_", "rk_live_"].some((prefix) => key.startsWith(prefix))) {
    throw new StripeClinicSubscriptionError("Stripe live recurring checkout is not configured.", 503);
  }
  return new Stripe(key, { appInfo: { name: "Klinikos", version: "0.1.0" } });
}

function metadataForIntent(input: { intentId: string; state: string; productKey: ClinicPurchasablePlanKey }) {
  return {
    [INTENT_METADATA_KEY]: input.intentId,
    [STATE_METADATA_KEY]: input.state,
    [PRODUCT_METADATA_KEY]: input.productKey,
  };
}

export function buildStripeSubscriptionCheckoutSessionParams(input: {
  productKey: ClinicPurchasablePlanKey;
  productLabel: string;
  amountCents: number;
  currency: string;
  email: string;
  intentId: string;
  state: string;
  expiresAt: Date;
  returnUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  if (!Number.isInteger(input.amountCents) || input.amountCents < 1) {
    throw new StripeClinicSubscriptionError("Stripe subscription checkout requires a positive server-owned monthly amount.");
  }
  const expiresAt = Math.floor(input.expiresAt.getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now + 30 * 60 || expiresAt > now + 24 * 60 * 60) {
    throw new StripeClinicSubscriptionError("Stripe subscription checkout expiration must be between 30 minutes and 24 hours.");
  }
  const metadata = metadataForIntent(input);
  return {
    mode: "subscription",
    ui_mode: "hosted",
    expires_at: expiresAt,
    client_reference_id: input.intentId,
    customer_email: input.email,
    success_url: input.returnUrl,
    cancel_url: input.returnUrl,
    metadata,
    subscription_data: { metadata },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: input.amountCents,
        recurring: { interval: "month" },
        product_data: { name: input.productLabel },
      },
    }],
  };
}

function requireSales(session: ClinicSession, action: "create" | "update") {
  if (!can(session.role, "sales", action)) {
    throw new StripeClinicSubscriptionError("Commercial activation access is not permitted for this role.", 403);
  }
}

export async function createStripeClinicSubscriptionCheckout(session: ClinicSession, rawInput: unknown) {
  requireSales(session, "create");
  const status = stripeRecurringSubscriptionStatus();
  if (!status.processorVerification) {
    throw new StripeClinicSubscriptionError("Native Stripe recurring checkout is not enabled and webhook-ready.", 503);
  }
  const input = clinicCheckoutRequestSchema.parse(rawInput);
  const product = getCommercialProduct(input.productKey);
  if (!product || product.billing !== "monthly" || !product.publicPurchasable || product.audience !== "clinic" || !product.priceCents) {
    throw new StripeClinicSubscriptionError("This clinic plan is not available for Stripe subscription checkout.", 400);
  }

  const id = randomUUID();
  const state = randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_checkout_intents" (
      "id", "state", "provider", "productKey", "email", "organizationId", "status",
      "amountCents", "currency", "processorMode", "expiresAt", "metadata"
    ) VALUES (
      ${id}, ${state}, 'stripe', ${product.key}, ${input.email}, NULL, 'created',
      ${product.priceCents}, 'USD', 'live', ${expiresAt},
      ${JSON.stringify({ clinicName: input.clinicName, createdBy: session.userId, source: "clinic_activation_desk", rail: "stripe_recurring" })}::jsonb
    )
  `);

  try {
    const client = liveStripeClient();
    const returnUrl = `${normalizeBaseUrl()}/payments/success?state=${encodeURIComponent(state)}`;
    const params = buildStripeSubscriptionCheckoutSessionParams({
      productKey: product.key as ClinicPurchasablePlanKey,
      productLabel: product.label,
      amountCents: product.priceCents,
      currency: "USD",
      email: input.email,
      intentId: id,
      state,
      expiresAt,
      returnUrl,
    });
    const checkout = await client.checkout.sessions.create(params, {
      idempotencyKey: `klinikos_subscription_checkout_${id}`,
    });
    if (!checkout.url || checkout.mode !== "subscription" || !checkout.livemode) {
      throw new Error("Stripe did not return the expected live subscription Checkout Session.");
    }
    await db.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "externalCheckoutId" = ${checkout.id}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id} AND "provider" = 'stripe' AND "status" = 'created'
    `);
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "commercial.stripe_subscription_checkout_created",
        resourceType: "commercial_checkout_intent",
        resourceId: id,
        metadata: {
          productKey: product.key,
          expectedAmountCents: product.priceCents,
          processorMode: "live",
          processorVerificationAvailable: true,
        },
      },
    });
    return {
      id,
      state,
      provider: "stripe",
      productKey: product.key,
      productLabel: product.label,
      expectedAmountCents: product.priceCents,
      checkoutUrl: checkout.url,
      expiresAt: expiresAt.toISOString(),
      processorVerificationAvailable: true,
      processorMode: "live" as const,
    };
  } catch (error) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "status" = 'abandoned', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id} AND "status" = 'created'
    `).catch(() => undefined);
    throw error;
  }
}

function metadataValue(metadata: Record<string, string> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clinicPlanKey(value: string | null): ClinicPurchasablePlanKey | null {
  return value === "clinic_core" || value === "clinic_growth" || value === "clinic_scale" ? value : null;
}

function invoiceSubscriptionDetails(invoice: InvoiceShape) {
  const modern = invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details : null;
  const subscriptionId = stringId(modern?.subscription) ?? stringId(invoice.subscription);
  const metadata = modern?.metadata ?? invoice.subscription_details?.metadata ?? null;
  return { subscriptionId, metadata };
}

function invoiceServicePeriod(invoice: InvoiceShape) {
  const lines = invoice.lines?.data ?? [];
  const subscriptionLines = lines.filter((line) => line.parent?.type === "subscription_item_details");
  const candidates = subscriptionLines.length ? subscriptionLines : lines;
  const periods = candidates.flatMap((line) => {
    const start = line.period?.start;
    const end = line.period?.end;
    if (!start || !end || end <= start || line.amount === 0) return [];
    return [`${start}:${end}`];
  });
  const unique = [...new Set(periods)];
  if (unique.length !== 1) return null;
  const [start, end] = unique[0].split(":").map(Number);
  return { periodStartsAt: new Date(start * 1000), periodEndsAt: new Date(end * 1000) };
}

export function normalizeStripeClinicSubscriptionSignal(event: Stripe.Event, rawBody: string): StripeSubscriptionSignal | null {
  const payloadHash = createHash("sha256").update(rawBody, "utf8").digest("hex");

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as unknown as InvoiceShape;
    const details = invoiceSubscriptionDetails(invoice);
    const metadata = details.metadata;
    const checkoutIntentId = metadataValue(metadata, INTENT_METADATA_KEY);
    const checkoutState = metadataValue(metadata, STATE_METADATA_KEY);
    const productKey = clinicPlanKey(metadataValue(metadata, PRODUCT_METADATA_KEY));
    if (!checkoutIntentId || !checkoutState || !productKey || !details.subscriptionId) return null;
    const period = invoiceServicePeriod(invoice);
    if (event.type === "invoice.paid" && !period) return null;
    return {
      kind: event.type === "invoice.paid" ? "invoice_paid" : "invoice_failed",
      stripeEventId: event.id,
      stripeEventType: event.type,
      payloadHash,
      checkoutIntentId,
      checkoutState,
      productKey,
      externalCustomerId: stringId(invoice.customer),
      externalSubscriptionId: details.subscriptionId,
      amountCents: event.type === "invoice.paid" ? invoice.amount_paid ?? null : invoice.amount_due ?? null,
      currency: invoice.currency ?? null,
      periodStartsAt: period?.periodStartsAt ?? null,
      periodEndsAt: period?.periodEndsAt ?? null,
      stripeObjectId: invoice.id,
    };
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as unknown as SubscriptionShape;
    const checkoutIntentId = metadataValue(subscription.metadata, INTENT_METADATA_KEY);
    const checkoutState = metadataValue(subscription.metadata, STATE_METADATA_KEY);
    const productKey = clinicPlanKey(metadataValue(subscription.metadata, PRODUCT_METADATA_KEY));
    if (!checkoutIntentId || !checkoutState || !productKey || !subscription.id) return null;
    return {
      kind: "subscription_deleted",
      stripeEventId: event.id,
      stripeEventType: event.type,
      payloadHash,
      checkoutIntentId,
      checkoutState,
      productKey,
      externalCustomerId: stringId(subscription.customer),
      externalSubscriptionId: subscription.id,
      amountCents: null,
      currency: null,
      periodStartsAt: null,
      periodEndsAt: null,
      stripeObjectId: subscription.id,
    };
  }

  return null;
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function uniqueSlug(tx: Prisma.TransactionClient, clinicName: string) {
  const base = slugifyOrganizationName(clinicName);
  const existing = await tx.organization.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? `${base}-${randomUUID().slice(0, 6)}` : base;
}

async function loadAndValidateIntent(
  tx: Prisma.TransactionClient,
  signal: StripeSubscriptionSignal,
  options: { createOrganization: boolean },
) {
  const rows = await tx.$queryRaw<StripeIntentRow[]>(Prisma.sql`
    SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "processorMode",
           "externalCheckoutId", "externalCustomerId", "externalSubscriptionId", "amountCents", "currency", "metadata"
    FROM "commercial_checkout_intents"
    WHERE "id" = ${signal.checkoutIntentId}
    FOR UPDATE
  `);
  const intent = rows[0];
  if (!intent) throw new StripeClinicSubscriptionError("Stripe subscription evidence does not match a Klinikos checkout intent.", 409);
  if (intent.provider !== "stripe" || intent.processorMode !== "live") throw new StripeClinicSubscriptionError("Stripe subscription evidence does not match the checkout processor mode.", 409);
  if (intent.state !== signal.checkoutState) throw new StripeClinicSubscriptionError("Stripe subscription state does not match the checkout intent.", 409);
  if (intent.productKey !== signal.productKey) throw new StripeClinicSubscriptionError("Stripe subscription product does not match the checkout intent.", 409);
  if (!["created", "completed"].includes(intent.status)) throw new StripeClinicSubscriptionError("Stripe subscription checkout is not available for this lifecycle event.", 409);
  if (intent.externalSubscriptionId && intent.externalSubscriptionId !== signal.externalSubscriptionId) throw new StripeClinicSubscriptionError("Stripe subscription reference conflicts with the checkout intent.", 409);
  if (intent.externalCustomerId && signal.externalCustomerId && intent.externalCustomerId !== signal.externalCustomerId) throw new StripeClinicSubscriptionError("Stripe customer reference conflicts with the checkout intent.", 409);

  const product = getCommercialProduct(intent.productKey);
  if (!product || product.billing !== "monthly" || !product.publicPurchasable || product.audience !== "clinic" || !product.priceCents) {
    throw new StripeClinicSubscriptionError("Stripe subscription evidence references an unavailable clinic plan.", 409);
  }
  if (intent.amountCents !== product.priceCents) throw new StripeClinicSubscriptionError("Stored recurring checkout amount does not match the server-owned clinic plan price.", 409);
  if (normalizedCurrency(intent.currency) !== "USD") throw new StripeClinicSubscriptionError("Stored recurring checkout currency is invalid.", 409);
  if (signal.currency && normalizedCurrency(signal.currency) !== normalizedCurrency(intent.currency)) throw new StripeClinicSubscriptionError("Stripe subscription currency does not match the checkout intent.", 409);
  if (signal.kind === "invoice_paid" && signal.amountCents !== intent.amountCents) {
    throw new StripeClinicSubscriptionError("Stripe subscription invoice amount does not match the server-owned clinic plan price.", 409);
  }

  let organizationId = intent.organizationId;
  if (!organizationId && options.createOrganization) {
    const metadata = asRecord(intent.metadata);
    const clinicName = typeof metadata.clinicName === "string" && metadata.clinicName.trim() ? metadata.clinicName.trim() : "Klinikos Clinic";
    organizationId = randomUUID();
    const slug = await uniqueSlug(tx, clinicName);
    await tx.organization.create({
      data: { id: organizationId, name: clinicName, slug, clinicType: "Pending onboarding", status: "active", demoMode: false },
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: null,
        actorType: "system",
        action: "commercial.stripe_subscription_provisioning_shell_created",
        resourceType: "organization",
        resourceId: organizationId,
        metadata: { checkoutIntentId: intent.id, productKey: product.key, processorVerified: true },
      },
    });
  }

  if (organizationId) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "organizationId" = ${organizationId},
          "externalCustomerId" = COALESCE("externalCustomerId", ${signal.externalCustomerId}),
          "externalSubscriptionId" = COALESCE("externalSubscriptionId", ${signal.externalSubscriptionId}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${intent.id}
    `);
  }

  return { intent, organizationId, product };
}

async function persistVerifiedSignal(
  tx: Prisma.TransactionClient,
  signal: StripeSubscriptionSignal,
  organizationId: string | null,
) {
  const normalizedEventType = signal.kind === "invoice_paid"
    ? "payment.succeeded"
    : signal.kind === "invoice_failed"
      ? "payment.failed"
      : "subscription.ended";
  const processingStatus = signal.kind === "invoice_failed" ? "failed" : "applied";
  const outcome = signal.kind === "invoice_failed" ? "failed" : "succeeded";
  const evidenceId = randomUUID();
  const safePayload = {
    stripeEventType: signal.stripeEventType,
    stripeObjectId: signal.stripeObjectId,
    externalSubscriptionId: signal.externalSubscriptionId,
    processorMode: "live",
  };
  const inserted = await tx.$queryRaw<EvidenceRow[]>(Prisma.sql`
    INSERT INTO "commercial_payment_events" (
      "id", "provider", "eventId", "eventType", "verified", "verificationMethod", "processorVerified",
      "processorMode", "outcome", "payloadHash", "processingStatus", "externalCheckoutId",
      "externalCustomerId", "externalSubscriptionId", "organizationId", "productKey", "amountCents", "currency",
      "payload", "failureReason", "processedAt"
    ) VALUES (
      ${evidenceId}, 'stripe', ${signal.stripeEventId}, ${normalizedEventType}, TRUE, 'webhook_signature', TRUE,
      'live', ${outcome}, ${signal.payloadHash}, ${processingStatus}, NULL,
      ${signal.externalCustomerId}, ${signal.externalSubscriptionId}, ${organizationId}, ${signal.productKey}, ${signal.amountCents},
      ${normalizedCurrency(signal.currency) ?? "USD"}, ${JSON.stringify(safePayload)}::jsonb,
      ${signal.kind === "invoice_failed" ? "Stripe reported that the recurring invoice was not paid." : null}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id", "eventType", "payloadHash", "processingStatus", "organizationId", "productKey", "externalSubscriptionId"
  `);
  if (inserted[0]) return { row: inserted[0], idempotent: false };

  const existing = await tx.$queryRaw<EvidenceRow[]>(Prisma.sql`
    SELECT "id", "eventType", "payloadHash", "processingStatus", "organizationId", "productKey", "externalSubscriptionId"
    FROM "commercial_payment_events"
    WHERE "provider" = 'stripe' AND "eventId" = ${signal.stripeEventId}
    FOR UPDATE
  `);
  const row = existing[0];
  if (!row || row.eventType !== normalizedEventType || row.payloadHash !== signal.payloadHash || row.productKey !== signal.productKey || row.externalSubscriptionId !== signal.externalSubscriptionId) {
    throw new StripeClinicSubscriptionError("Stripe subscription webhook replay does not match the original evidence.", 409);
  }
  return { row, idempotent: true };
}

export async function processVerifiedStripeClinicSubscriptionEvent(event: Stripe.Event, rawBody: string) {
  const signal = normalizeStripeClinicSubscriptionSignal(event, rawBody);
  if (!signal) return null;
  if (!event.livemode) throw new StripeClinicSubscriptionError("Test-mode Stripe subscription events cannot enter the live recurring rail.", 409);

  if (signal.kind === "invoice_paid") {
    if (!signal.periodStartsAt || !signal.periodEndsAt) throw new StripeClinicSubscriptionError("Paid Stripe subscription invoice is missing one unambiguous service period.", 409);
    const prepared = await db.$transaction(async (tx) => {
      const resolved = await loadAndValidateIntent(tx, signal, { createOrganization: true });
      if (!resolved.organizationId) throw new StripeClinicSubscriptionError("Paid Stripe subscription could not create a clinic organization.", 500);
      const evidence = await persistVerifiedSignal(tx, signal, resolved.organizationId);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_checkout_intents"
        SET "status" = 'completed', "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
            "externalCustomerId" = COALESCE("externalCustomerId", ${signal.externalCustomerId}),
            "externalSubscriptionId" = COALESCE("externalSubscriptionId", ${signal.externalSubscriptionId}),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${signal.checkoutIntentId}
      `);
      await tx.auditLog.create({
        data: {
          organizationId: resolved.organizationId,
          actorId: null,
          actorType: "system",
          action: "commercial.stripe_subscription_payment_applied",
          resourceType: "commercial_payment_event",
          resourceId: evidence.row.id,
          metadata: {
            productKey: signal.productKey,
            stripeEventType: signal.stripeEventType,
            externalSubscriptionId: signal.externalSubscriptionId,
            amountCents: signal.amountCents,
            currency: normalizedCurrency(signal.currency),
            idempotent: evidence.idempotent,
          },
        },
      });
      return { organizationId: resolved.organizationId, evidenceId: evidence.row.id, idempotent: evidence.idempotent };
    });

    const activation = await activateCommercialSubscription({
      provider: "stripe",
      eventEvidenceId: prepared.evidenceId,
      organizationId: prepared.organizationId,
      productKey: signal.productKey,
      externalCustomerId: signal.externalCustomerId,
      externalSubscriptionId: signal.externalSubscriptionId,
      periodStartsAt: signal.periodStartsAt,
      periodEndsAt: signal.periodEndsAt,
    });
    return {
      kind: signal.kind,
      status: "applied",
      organizationId: prepared.organizationId,
      productKey: signal.productKey,
      subscriptionId: activation.subscriptionId,
      idempotent: prepared.idempotent,
    };
  }

  if (signal.kind === "invoice_failed") {
    const result = await db.$transaction(async (tx) => {
      const resolved = await loadAndValidateIntent(tx, signal, { createOrganization: false });
      const evidence = await persistVerifiedSignal(tx, signal, resolved.organizationId);
      if (resolved.organizationId) {
        await tx.auditLog.create({
          data: {
            organizationId: resolved.organizationId,
            actorId: null,
            actorType: "system",
            action: "commercial.stripe_subscription_payment_failed",
            resourceType: "commercial_payment_event",
            resourceId: evidence.row.id,
            metadata: { productKey: signal.productKey, externalSubscriptionId: signal.externalSubscriptionId, accessExtended: false },
          },
        });
      }
      return { organizationId: resolved.organizationId, idempotent: evidence.idempotent };
    });
    return { kind: signal.kind, status: "failed", productKey: signal.productKey, ...result };
  }

  const prepared = await db.$transaction(async (tx) => {
    const resolved = await loadAndValidateIntent(tx, signal, { createOrganization: false });
    if (!resolved.organizationId) throw new StripeClinicSubscriptionError("Stripe cancellation is not linked to an activated clinic organization.", 409);
    const evidence = await persistVerifiedSignal(tx, signal, resolved.organizationId);
    return { organizationId: resolved.organizationId, evidenceId: evidence.row.id, idempotent: evidence.idempotent };
  });
  const revoked = await revokeCommercialSubscription({
    provider: "stripe",
    eventEvidenceId: prepared.evidenceId,
    organizationId: prepared.organizationId,
    externalSubscriptionId: signal.externalSubscriptionId,
    reason: "Stripe reported customer.subscription.deleted.",
  });
  return {
    kind: signal.kind,
    status: "revoked",
    organizationId: prepared.organizationId,
    productKey: signal.productKey,
    revokedSubscriptions: revoked,
    idempotent: prepared.idempotent,
  };
}

function signActivationToken(input: {
  organizationId: string;
  checkoutIntentId: string;
  email: string;
  productKey: ClinicPurchasablePlanKey;
}) {
  const payload = {
    v: 1 as const,
    organizationId: input.organizationId,
    checkoutIntentId: input.checkoutIntentId,
    email: input.email,
    productKey: input.productKey,
    exp: Math.floor(Date.now() / 1000) + ACTIVATION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export async function issueStripeClinicActivationLink(session: ClinicSession, intentId: string) {
  requireSales(session, "update");
  const rows = await db.$queryRaw<StripeIntentRow[]>(Prisma.sql`
    SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "processorMode",
           "externalCheckoutId", "externalCustomerId", "externalSubscriptionId", "amountCents", "currency", "metadata"
    FROM "commercial_checkout_intents"
    WHERE "id" = ${intentId}
    LIMIT 1
  `);
  const intent = rows[0];
  if (!intent || intent.provider !== "stripe" || intent.processorMode !== "live" || intent.status !== "completed" || !intent.organizationId) {
    throw new StripeClinicSubscriptionError("This Stripe checkout is not eligible for owner activation.", 409);
  }
  const productKey = clinicPlanKey(intent.productKey);
  if (!productKey) throw new StripeClinicSubscriptionError("This Stripe checkout does not reference a clinic subscription plan.", 409);
  const subscriptions = await db.$queryRaw<Array<{ planKey: string; status: string; paymentConfirmedAt: Date | null; currentPeriodEndsAt: Date | null; externalSubscriptionId: string | null }>>(Prisma.sql`
    SELECT "planKey", "status", "paymentConfirmedAt", "currentPeriodEndsAt", "externalSubscriptionId"
    FROM "subscriptions"
    WHERE "organizationId" = ${intent.organizationId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);
  const subscription = subscriptions[0];
  if (!subscription || subscription.planKey !== productKey || subscription.status !== "active" || !subscription.paymentConfirmedAt || (subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt <= new Date())) {
    throw new StripeClinicSubscriptionError("Verified paid Klinikos access is not active for this checkout.", 409);
  }
  if (intent.externalSubscriptionId && subscription.externalSubscriptionId && intent.externalSubscriptionId !== subscription.externalSubscriptionId) {
    throw new StripeClinicSubscriptionError("Activated subscription does not match the Stripe checkout.", 409);
  }

  const token = signActivationToken({
    organizationId: intent.organizationId,
    checkoutIntentId: intent.id,
    email: intent.email,
    productKey,
  });
  const activationUrl = `${normalizeBaseUrl()}/activate?token=${encodeURIComponent(token)}`;
  await db.auditLog.create({
    data: {
      organizationId: intent.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "commercial.stripe_activation_link_issued",
      resourceType: "commercial_checkout_intent",
      resourceId: intent.id,
      metadata: { productKey, processorVerified: true, activationLinkIssued: true },
    },
  });
  return { organizationId: intent.organizationId, productKey, activationUrl };
}
