import "server-only";

import crypto from "node:crypto";
import { productForWhopPlanId, whopPlanIdForProduct } from "@/lib/commercial/product-catalog";
import type {
  CommercialCheckoutRequest,
  CommercialCheckoutResult,
  CommercialPaymentConnector,
  NormalizedCommercialWebhook,
} from "@/lib/commercial/payment-connectors/types";

const DEFAULT_API_BASE = "https://api.whop.com/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const WEBHOOK_TOLERANCE_SECONDS = 300;

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nestedString(record: Record<string, unknown> | null, key: string) {
  return stringValue(record?.[key]);
}

function dateValue(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const date = new Date(value > 1_000_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return dateValue(numeric);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function majorUnitsToCents(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : null;
}

function decodeWebhookSecret(secret: string) {
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    const decoded = Buffer.from(raw, "base64");
    return decoded.length ? decoded : Buffer.from(raw, "utf8");
  } catch {
    return Buffer.from(raw, "utf8");
  }
}

export function verifyWhopWebhook(input: {
  rawBody: string;
  webhookId: string | null | undefined;
  webhookTimestamp: string | null | undefined;
  webhookSignature: string | null | undefined;
  secret: string | null | undefined;
  now?: Date;
  toleranceSeconds?: number;
}) {
  const secret = input.secret?.trim();
  const webhookId = input.webhookId?.trim();
  const timestampText = input.webhookTimestamp?.trim();
  const signatureHeader = input.webhookSignature?.trim();

  if (!secret) return { ok: false as const, reason: "not_configured" as const };
  if (!webhookId || !timestampText || !signatureHeader) return { ok: false as const, reason: "missing_headers" as const };

  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return { ok: false as const, reason: "bad_timestamp" as const };

  const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  const tolerance = input.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS;
  if (Math.abs(nowSeconds - Math.trunc(timestamp)) > tolerance) return { ok: false as const, reason: "stale" as const };

  const expected = crypto
    .createHmac("sha256", decodeWebhookSecret(secret))
    .update(`${webhookId}.${timestampText}.${input.rawBody}`, "utf8")
    .digest();

  const candidates = signatureHeader
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.startsWith("v1,") ? entry.slice(3) : entry));

  const matched = candidates.some((candidate) => {
    let provided: Buffer;
    try {
      provided = Buffer.from(candidate, "base64");
    } catch {
      return false;
    }
    return provided.length === expected.length && provided.length > 0 && crypto.timingSafeEqual(provided, expected);
  });

  return matched ? { ok: true as const } : { ok: false as const, reason: "signature_mismatch" as const };
}

function planIdFromData(data: Record<string, unknown>) {
  const membership = objectValue(data.membership);
  return (
    stringValue(data.plan_id) ??
    nestedString(objectValue(data.plan), "id") ??
    nestedString(membership, "plan_id") ??
    nestedString(objectValue(membership?.plan), "id") ??
    null
  );
}

function emailFromData(data: Record<string, unknown>) {
  return (
    stringValue(data.email)?.toLowerCase() ??
    nestedString(objectValue(data.user), "email")?.toLowerCase() ??
    nestedString(objectValue(data.customer), "email")?.toLowerCase() ??
    nestedString(objectValue(data.member), "email")?.toLowerCase() ??
    nestedString(objectValue(objectValue(data.membership)?.user), "email")?.toLowerCase() ??
    null
  );
}

function subscriptionIdFromData(data: Record<string, unknown>) {
  return (
    stringValue(data.membership_id) ??
    nestedString(objectValue(data.membership), "id") ??
    stringValue(data.subscription_id) ??
    null
  );
}

function customerIdFromData(data: Record<string, unknown>) {
  return (
    stringValue(data.customer_id) ??
    nestedString(objectValue(data.customer), "id") ??
    nestedString(objectValue(data.user), "id") ??
    nestedString(objectValue(data.member), "id") ??
    null
  );
}

function periodFromData(data: Record<string, unknown>) {
  const start = dateValue(data.current_period_start ?? data.period_start ?? data.created_at);
  const end = dateValue(data.current_period_end ?? data.renewal_period_end ?? data.expires_at);
  return { start, end };
}

export function normalizeWhopWebhook(input: {
  rawBody: string;
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
  env?: NodeJS.ProcessEnv;
  now?: Date;
}): { ok: true; event: NormalizedCommercialWebhook } | { ok: false; reason: string } {
  const env = input.env ?? process.env;
  const verification = verifyWhopWebhook({
    rawBody: input.rawBody,
    webhookId: input.webhookId,
    webhookTimestamp: input.webhookTimestamp,
    webhookSignature: input.webhookSignature,
    secret: env.WHOP_WEBHOOK_SECRET,
    now: input.now,
  });
  if (!verification.ok) return { ok: false, reason: verification.reason };

  let payload: Record<string, unknown>;
  try {
    const parsed = objectValue(JSON.parse(input.rawBody));
    if (!parsed) return { ok: false, reason: "invalid_payload" };
    payload = parsed;
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const eventType = stringValue(payload.type) ?? stringValue(payload.action) ?? stringValue(payload.event);
  const data = objectValue(payload.data) ?? payload;
  if (!eventType || !data) return { ok: false, reason: "missing_event_type" };

  const supported = new Set([
    "payment.succeeded",
    "membership.activated",
    "membership.deactivated",
    "refund.created",
    "dispute.created",
  ]);
  if (!supported.has(eventType)) return { ok: false, reason: "unsupported_event" };

  const planId = planIdFromData(data);
  const product = productForWhopPlanId(planId, env);
  const period = periodFromData(data);

  return {
    ok: true,
    event: {
      provider: "whop",
      eventId: input.webhookId ?? crypto.createHash("sha256").update(input.rawBody).digest("hex"),
      eventType,
      payloadHash: crypto.createHash("sha256").update(input.rawBody, "utf8").digest("hex"),
      payload,
      verified: true,
      verificationMethod: "webhook_signature",
      processorVerified: true,
      productKey: product?.key ?? null,
      email: emailFromData(data),
      externalCustomerId: customerIdFromData(data),
      externalSubscriptionId: subscriptionIdFromData(data),
      amountCents: majorUnitsToCents(data.settlement_amount ?? data.final_amount ?? data.amount ?? data.subtotal),
      currency: stringValue(data.currency)?.toUpperCase() ?? null,
      checkoutState: null,
      periodStartsAt: period.start,
      periodEndsAt: period.end,
    },
  };
}

export const whopPaymentConnector: CommercialPaymentConnector = {
  key: "whop",
  status(env = process.env) {
    const missing: string[] = [];
    if (!env.WHOP_API_KEY?.trim()) missing.push("WHOP_API_KEY");
    if (!env.WHOP_WEBHOOK_SECRET?.trim()) missing.push("WHOP_WEBHOOK_SECRET");
    return {
      key: "whop",
      checkoutConfigured: Boolean(env.WHOP_API_KEY?.trim()),
      webhookConfigured: Boolean(env.WHOP_WEBHOOK_SECRET?.trim()),
      processorVerification: Boolean(env.WHOP_WEBHOOK_SECRET?.trim()),
      missing,
    };
  },
  async createCheckout(request: CommercialCheckoutRequest, env = process.env): Promise<CommercialCheckoutResult> {
    const apiKey = env.WHOP_API_KEY?.trim();
    const planId = whopPlanIdForProduct(request.product, env);
    if (!apiKey || !planId) throw new Error("Whop checkout is pending connection for this Klinikos product.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${(env.WHOP_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/$/, "")}/plans/${encodeURIComponent(planId)}`, {
        method: "GET",
        headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Whop plan lookup failed with status ${response.status}.`);
      const payload = objectValue(await response.json().catch(() => null));
      const purchaseUrl = stringValue(payload?.purchase_url);
      const returnedPlanId = stringValue(payload?.id);
      if (!purchaseUrl || returnedPlanId !== planId) throw new Error("Whop plan lookup did not return the configured plan purchase URL.");
      return {
        provider: "whop",
        checkoutUrl: purchaseUrl,
        externalCheckoutId: planId,
        processorVerificationAvailable: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};
