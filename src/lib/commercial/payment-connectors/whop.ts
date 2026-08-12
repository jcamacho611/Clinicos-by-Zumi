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
const WEBHOOK_TOLERANCE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 10_000;

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nestedString(record: Record<string, unknown> | null, key: string) {
  return asString(record?.[key]);
}

function asDate(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const date = new Date(value > 1_000_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return asDate(numeric);
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

export function verifyWhopStandardWebhook(input: {
  rawBody: string;
  webhookId: string | null | undefined;
  webhookTimestamp: string | null | undefined;
  webhookSignature: string | null | undefined;
  secret: string | null | undefined;
  now?: Date;
  toleranceSeconds?: number;
}) {
  const secret = input.secret?.trim();
  const id = input.webhookId?.trim();
  const timestampText = input.webhookTimestamp?.trim();
  const signatureHeader = input.webhookSignature?.trim();
  if (!secret) return { ok: false as const, reason: "not_configured" as const };
  if (!id || !timestampText || !signatureHeader) return { ok: false as const, reason: "missing" as const };

  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return { ok: false as const, reason: "malformed" as const };
  const tolerance = input.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - Math.trunc(timestamp)) > tolerance) return { ok: false as const, reason: "stale" as const };

  const expected = crypto
    .createHmac("sha256", decodeWebhookSecret(secret))
    .update(`${id}.${timestampText}.${input.rawBody}`, "utf8")
    .digest();
  const candidates = signatureHeader
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.startsWith("v1,") ? entry.slice(3) : entry));

  const matched = candidates.some((candidate) => {
    const provided = Buffer.from(candidate, "base64");
    return provided.length === expected.length && provided.length > 0 && crypto.timingSafeEqual(provided, expected);
  });
  return matched ? { ok: true as const, timestamp: Math.trunc(timestamp) } : { ok: false as const, reason: "mismatch" as const };
}

function planIdFromData(data: Record<string, unknown>) {
  return asString(data.plan_id) ?? nestedString(asObject(data.plan), "id") ?? nestedString(asObject(data.membership), "plan_id");
}

function emailFromData(data: Record<string, unknown>) {
  return (
    asString(data.email)?.toLowerCase() ??
    nestedString(asObject(data.member), "email")?.toLowerCase() ??
    nestedString(asObject(data.user), "email")?.toLowerCase() ??
    nestedString(asObject(data.customer), "email")?.toLowerCase() ??
    null
  );
}

function metadataFromData(data: Record<string, unknown>) {
  return asObject(data.metadata) ?? {};
}

function checkoutStateFromData(data: Record<string, unknown>) {
  const metadata = metadataFromData(data);
  return asString(metadata.klinikos_checkout_state) ?? asString(metadata.checkout_state) ?? asString(metadata.state);
}

function membershipIdFromData(data: Record<string, unknown>) {
  return asString(data.membership_id) ?? nestedString(asObject(data.membership), "id") ?? null;
}

function eventAmountCents(data: Record<string, unknown>) {
  return majorUnitsToCents(data.settlement_amount ?? data.final_amount ?? data.amount ?? data.subtotal);
}

function eventCurrency(data: Record<string, unknown>) {
  return asString(data.currency)?.toUpperCase() ?? null;
}

function eventPeriod(data: Record<string, unknown>) {
  const starts = asDate(data.current_period_start ?? data.period_start ?? data.created_at) ?? new Date();
  const ends = asDate(data.current_period_end ?? data.renewal_period_end ?? data.expires_at);
  return { starts, ends };
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
  const verification = verifyWhopStandardWebhook({
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
    const parsed = asObject(JSON.parse(input.rawBody));
    if (!parsed) return { ok: false, reason: "invalid_payload" };
    payload = parsed;
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const eventType = asString(payload.type) ?? asString(payload.action) ?? asString(payload.event);
  const eventId = asString(payload.id) ?? input.webhookId;
  const data = asObject(payload.data) ?? payload;
  if (!eventType || !eventId || !data) return { ok: false, reason: "missing_event_identity" };

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
  const metadata = metadataFromData(data);
  const period = eventPeriod(data);

  return {
    ok: true,
    event: {
      provider: "whop",
      eventId,
      eventType,
      payloadHash: crypto.createHash("sha256").update(input.rawBody, "utf8").digest("hex"),
      payload,
      verified: true,
      verificationMethod: "webhook_signature",
      processorVerified: true,
      productKey: product?.key ?? asString(metadata.klinikos_product_key),
      email: emailFromData(data),
      externalCustomerId:
        asString(data.customer_id) ?? nestedString(asObject(data.customer), "id") ?? nestedString(asObject(data.member), "id"),
      externalSubscriptionId: membershipIdFromData(data),
      amountCents: eventAmountCents(data),
      currency: eventCurrency(data),
      checkoutState: checkoutStateFromData(data),
      periodStartsAt: period.starts,
      periodEndsAt: period.ends,
    },
  };
}

export const whopPaymentConnector: CommercialPaymentConnector = {
  key: "whop",
  status(env = process.env) {
    const missing: string[] = [];
    if (!env.WHOP_API_KEY?.trim()) missing.push("WHOP_API_KEY");
    if (!env.WHOP_COMPANY_ID?.trim()) missing.push("WHOP_COMPANY_ID");
    if (!env.WHOP_WEBHOOK_SECRET?.trim()) missing.push("WHOP_WEBHOOK_SECRET");
    return {
      key: "whop",
      checkoutConfigured: Boolean(env.WHOP_API_KEY?.trim() && env.WHOP_COMPANY_ID?.trim()),
      webhookConfigured: Boolean(env.WHOP_WEBHOOK_SECRET?.trim()),
      processorVerification: Boolean(env.WHOP_WEBHOOK_SECRET?.trim()),
      missing,
    };
  },
  async createCheckout(request: CommercialCheckoutRequest, env = process.env): Promise<CommercialCheckoutResult> {
    const apiKey = env.WHOP_API_KEY?.trim();
    const companyId = env.WHOP_COMPANY_ID?.trim();
    const planId = whopPlanIdForProduct(request.product, env);
    if (!apiKey || !companyId || !planId) throw new Error("Whop checkout is pending connection for this Klinikos product.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${(env.WHOP_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/$/, "")}/checkout_configurations`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          plan_id: planId,
          redirect_url: request.returnUrl,
          metadata: {
            klinikos_checkout_state: request.state,
            klinikos_organization_id: request.organizationId,
            klinikos_product_key: request.product.key,
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) throw new Error(`Whop checkout configuration failed with status ${response.status}.`);
    const payload = asObject(await response.json().catch(() => null));
    const checkoutUrl = asString(payload?.purchase_url);
    const externalCheckoutId = asString(payload?.id);
    if (!checkoutUrl || !externalCheckoutId) throw new Error("Whop checkout response was missing a purchase URL or configuration id.");

    return { provider: "whop", checkoutUrl, externalCheckoutId, processorVerificationAvailable: true };
  },
};
