import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { recordCommercialPaymentEvidence } from "@/lib/commercial/payment-evidence-repository";
import { stripeWebhookSecretForMode, type StripeProcessorMode } from "@/lib/commercial/payment-connectors/stripe";
import { assertStripeCheckoutEvidence } from "@/lib/commercial/stripe-evidence-guard";

const DEFAULT_TOLERANCE_SECONDS = 300;

type StripeSignatureResult =
  | { ok: true; mode: StripeProcessorMode; timestamp: number }
  | { ok: false; reason: "missing_signature" | "missing_secret" | "invalid_signature" | "stale_signature" };

type StripeEvent = {
  id?: string;
  type?: string;
  livemode?: boolean;
  data?: { object?: unknown };
};

type StripeCheckoutSession = {
  id?: string;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  metadata?: Record<string, string | undefined> | null;
  client_reference_id?: string | null;
};

function parseSignatureHeader(header: string) {
  const values = header.split(",").map((part) => part.trim()).filter(Boolean);
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const value of values) {
    const separator = value.indexOf("=");
    if (separator <= 0) continue;
    const key = value.slice(0, separator);
    const data = value.slice(separator + 1);
    if (key === "t") {
      const parsed = Number(data);
      if (Number.isInteger(parsed) && parsed > 0) timestamp = parsed;
    } else if (key === "v1" && /^[a-f0-9]{64}$/i.test(data)) {
      v1.push(data.toLowerCase());
    }
  }
  return { timestamp, v1 };
}

function constantTimeHexEqual(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyWithSecret(rawBody: string, timestamp: number, signatures: string[], secret: string) {
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  return signatures.some((signature) => constantTimeHexEqual(expected, signature));
}

/**
 * Stripe's documented manual signature algorithm: signed payload is
 * `<timestamp>.<raw request body>`, HMAC-SHA256 with the endpoint secret, v1 only,
 * constant-time comparison, and a bounded timestamp tolerance.
 */
export function verifyStripeWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  env?: NodeJS.ProcessEnv;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): StripeSignatureResult {
  if (!input.signatureHeader) return { ok: false, reason: "missing_signature" };
  const parsed = parseSignatureHeader(input.signatureHeader);
  if (!parsed.timestamp || parsed.v1.length === 0) return { ok: false, reason: "invalid_signature" };

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - parsed.timestamp) > tolerance) return { ok: false, reason: "stale_signature" };

  const env = input.env ?? process.env;
  const candidates: Array<{ mode: StripeProcessorMode; secret: string }> = [];
  const live = stripeWebhookSecretForMode("live", env);
  const test = stripeWebhookSecretForMode("test", env);
  if (live) candidates.push({ mode: "live", secret: live });
  if (test) candidates.push({ mode: "test", secret: test });
  if (!candidates.length) return { ok: false, reason: "missing_secret" };

  for (const candidate of candidates) {
    if (verifyWithSecret(input.rawBody, parsed.timestamp, parsed.v1, candidate.secret)) {
      return { ok: true, mode: candidate.mode, timestamp: parsed.timestamp };
    }
  }
  return { ok: false, reason: "invalid_signature" };
}

function opaqueId(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

function safeEventPayload(event: StripeEvent, object: StripeCheckoutSession) {
  return {
    stripeEventType: event.type ?? null,
    livemode: Boolean(event.livemode),
    checkoutSessionId: object.id ?? null,
    paymentStatus: object.payment_status ?? null,
  };
}

export type StripeWebhookProcessResult =
  | { handled: false; eventType: string }
  | { handled: true; eventType: string; status: string; idempotent?: boolean; organizationId?: string | null };

/**
 * Process only the Stripe events Klinikos currently knows how to prove safely.
 * Unsupported signed events are acknowledged but cannot mutate financial truth.
 */
export async function processVerifiedStripeEvent(input: {
  rawBody: string;
  verifiedMode: StripeProcessorMode;
}): Promise<StripeWebhookProcessResult> {
  const event = JSON.parse(input.rawBody) as StripeEvent;
  if (!event.id || !event.type || typeof event.livemode !== "boolean" || !event.data?.object) {
    throw new Error("Stripe event is missing required event fields.");
  }
  const eventMode: StripeProcessorMode = event.livemode ? "live" : "test";
  if (eventMode !== input.verifiedMode) throw new Error("Stripe event mode does not match the signing endpoint mode.");

  if (event.type !== "checkout.session.completed") {
    return { handled: false, eventType: event.type };
  }

  const session = event.data.object as StripeCheckoutSession;
  if (!session.id) throw new Error("Stripe Checkout event is missing the Checkout Session ID.");

  const metadata = session.metadata ?? {};
  const checkoutState = metadata.klinikos_checkout_state?.trim() || session.client_reference_id?.trim() || null;
  const productKey = metadata.klinikos_product_key?.trim() || null;
  if (!checkoutState || !productKey) throw new Error("Stripe Checkout event is missing its opaque Klinikos correlation state.");

  const amountCents = Number.isInteger(session.amount_total) && (session.amount_total ?? -1) >= 0 ? session.amount_total! : null;
  const currency = session.currency?.trim().toUpperCase() || null;

  // Checkout completion alone is not enough: Stripe documents that processing can
  // still be in progress for some sessions. Only an explicit paid payment_status can
  // become payment evidence in this first live rail.
  if (session.payment_status !== "paid") {
    return { handled: true, eventType: event.type, status: "ignored" };
  }

  await assertStripeCheckoutEvidence({
    checkoutState,
    productKey,
    amountCents,
    currency,
    mode: eventMode,
  });

  const result = await recordCommercialPaymentEvidence({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    verified: true,
    verificationMethod: "webhook_signature",
    processorVerified: true,
    payloadHash: createHash("sha256").update(input.rawBody, "utf8").digest("hex"),
    payload: safeEventPayload(event, session),
    productKey,
    checkoutState,
    externalCustomerId: opaqueId(session.customer),
    externalSubscriptionId: opaqueId(session.subscription),
    amountCents,
    currency,
  });

  return {
    handled: true,
    eventType: event.type,
    status: result.status,
    idempotent: result.idempotent,
    organizationId: result.organizationId,
  };
}
