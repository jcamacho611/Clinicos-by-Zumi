import crypto from "node:crypto";
import { z } from "zod";
import { type AccessCapability, type AccessTierKey, accessTierKeys, tierCapabilities } from "@/lib/commerce/whop-catalog";

/**
 * Deterministic rules for Whop-sourced paid access. Pure functions only: no
 * database, no network, no environment reads. Callers supply the secret, the raw
 * request body, and the clock so every decision is reproducible in tests.
 */

/** Membership states Whop reports. Anything outside this set is treated as unknown. */
export const whopMembershipStatuses = [
  "active",
  "trialing",
  "past_due",
  "completed",
  "canceled",
  "expired",
  "unresolved",
  "drafted",
] as const;

export type WhopMembershipStatus = (typeof whopMembershipStatuses)[number];

/** Klinikos-side entitlement state derived from a Whop membership status. */
export const entitlementStates = ["active", "grace", "revoked", "pending_connection", "unknown"] as const;

export type EntitlementState = (typeof entitlementStates)[number];

export const WHOP_SIGNATURE_TOLERANCE_SECONDS = 300;

const hexSignature = /^[0-9a-f]{64}$/i;

/**
 * Parse the `x-whop-signature` header.
 *
 * Two shapes are accepted: a timestamped `t=<unix seconds>,v1=<hex>` header, and a
 * bare hex digest. The timestamped form is preferred because it lets us reject
 * replays; the bare form carries no timestamp, so callers must decide whether to
 * allow it (see `verifyWhopSignature`, which requires `allowUntimestamped`).
 */
export function parseWhopSignatureHeader(header: string | null | undefined) {
  const value = header?.trim();
  if (!value) return { ok: false as const, reason: "missing" as const };

  if (hexSignature.test(value)) {
    return { ok: true as const, timestamp: null, signatures: [value.toLowerCase()] };
  }

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const entry = part.slice(separator + 1).trim();
    if (key === "t") {
      const parsed = Number(entry);
      if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false as const, reason: "malformed" as const };
      timestamp = Math.trunc(parsed);
    } else if (key === "v1" && hexSignature.test(entry)) {
      signatures.push(entry.toLowerCase());
    }
  }

  if (!signatures.length) return { ok: false as const, reason: "malformed" as const };
  return { ok: true as const, timestamp, signatures };
}

function timingSafeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

export function whopSignatureDigest(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/**
 * Verify a Whop webhook signature against the exact raw request body.
 *
 * Fails closed: an absent secret, an absent header, a stale timestamp, or a digest
 * mismatch all return `ok: false`. The caller must never fall back to trusting the
 * payload when this returns false.
 */
export function verifyWhopSignature(input: {
  rawBody: string;
  header: string | null | undefined;
  secret: string | null | undefined;
  toleranceSeconds?: number;
  allowUntimestamped?: boolean;
  now?: Date;
}) {
  const secret = input.secret?.trim();
  if (!secret) return { ok: false as const, reason: "not_configured" as const };

  const parsed = parseWhopSignatureHeader(input.header);
  if (!parsed.ok) return { ok: false as const, reason: parsed.reason };

  if (parsed.timestamp === null) {
    if (!input.allowUntimestamped) return { ok: false as const, reason: "missing_timestamp" as const };
    const expected = whopSignatureDigest(input.rawBody, secret);
    const matched = parsed.signatures.some((signature) => timingSafeEqualHex(signature, expected));
    return matched ? { ok: true as const, timestamp: null } : { ok: false as const, reason: "mismatch" as const };
  }

  const tolerance = input.toleranceSeconds ?? WHOP_SIGNATURE_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > tolerance) return { ok: false as const, reason: "stale" as const };

  const expected = whopSignatureDigest(`${parsed.timestamp}.${input.rawBody}`, secret);
  const matched = parsed.signatures.some((signature) => timingSafeEqualHex(signature, expected));
  return matched ? { ok: true as const, timestamp: parsed.timestamp } : { ok: false as const, reason: "mismatch" as const };
}

/**
 * Standard Webhooks verification.
 *
 * This is the protocol Whop actually sends: `webhook-id`, `webhook-timestamp`, and
 * `webhook-signature`, where the signature is base64 over `{id}.{timestamp}.{body}` and
 * the secret is base64 after a `whsec_` prefix. The older hex scheme above signs a
 * different string with a differently-encoded key, so a deployment that only understood
 * that one rejected every genuine delivery with a 401 — the purchase path was closed and
 * the failure looked like an attack rather than a mismatch.
 *
 * Both schemes are supported deliberately. Neither is weakened: each still requires a
 * valid HMAC over the exact raw body, and each still enforces the timestamp tolerance
 * that makes a captured delivery unreplayable.
 */
export function verifyStandardWebhookSignature(input: {
  rawBody: string;
  webhookId: string | null | undefined;
  webhookTimestamp: string | null | undefined;
  webhookSignature: string | null | undefined;
  secret: string | null | undefined;
  toleranceSeconds?: number;
  now?: Date;
}) {
  const secret = input.secret?.trim();
  const id = input.webhookId?.trim();
  const timestamp = input.webhookTimestamp?.trim();
  const header = input.webhookSignature?.trim();
  if (!secret) return { ok: false as const, reason: "not_configured" as const };
  if (!id || !timestamp || !header) return { ok: false as const, reason: "missing" as const };

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return { ok: false as const, reason: "malformed" as const };

  const tolerance = input.toleranceSeconds ?? WHOP_SIGNATURE_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - Math.trunc(seconds)) > tolerance) return { ok: false as const, reason: "stale" as const };

  // The header carries one or more space-separated `v1,<base64>` entries so a secret can
  // be rotated without dropping deliveries signed by the previous one.
  const candidates = header
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.startsWith("v1,") ? entry.slice(3) : entry))
    .filter(Boolean);
  if (candidates.length === 0) return { ok: false as const, reason: "malformed" as const };

  // `whsec_` prefixes a base64 key. Without stripping and decoding it, every signature
  // is computed against the wrong key and nothing ever matches.
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
    if (key.length === 0) key = Buffer.from(rawSecret, "utf8");
  } catch {
    key = Buffer.from(rawSecret, "utf8");
  }

  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${input.rawBody}`, "utf8")
    .digest();

  const matched = candidates.some((candidate) => {
    const provided = Buffer.from(candidate, "base64");
    if (provided.length !== expected.length || provided.length === 0) return false;
    return crypto.timingSafeEqual(provided, expected);
  });

  return matched
    ? { ok: true as const, timestamp: Math.trunc(seconds) }
    : { ok: false as const, reason: "mismatch" as const };
}

/**
 * Map a Whop membership status onto a Klinikos entitlement state.
 *
 * `past_due` maps to `grace` rather than `active`: the buyer keeps read access while
 * billing is retried, but grace never unlocks capabilities on its own.
 */
export function mapMembershipStatus(status: string | null | undefined): EntitlementState {
  switch (status?.trim().toLowerCase()) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "grace";
    case "completed":
    case "canceled":
    case "expired":
    case "unresolved":
    case "drafted":
      return "revoked";
    default:
      return "unknown";
  }
}

/** Webhook event types Klinikos acts on. Every other event is recorded and ignored. */
export const actionableWebhookEvents = [
  "membership.went_valid",
  "membership.went_invalid",
  "membership.metadata_updated",
  "membership.cancel_at_period_end_changed",
  "payment.succeeded",
  "payment.failed",
] as const;

export function isActionableWebhookEvent(eventType: string | null | undefined) {
  return actionableWebhookEvents.includes((eventType?.trim() ?? "") as (typeof actionableWebhookEvents)[number]);
}

const nullableString = z.string().trim().min(1).max(200).nullish();

export const whopWebhookEnvelopeSchema = z.object({
  id: z.string().trim().min(1).max(200).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  event: z.string().trim().min(1).max(120).optional(),
  data: z.object({
    id: nullableString,
    status: z.string().trim().max(60).nullish(),
    valid: z.boolean().nullish(),
    plan_id: nullableString,
    product_id: nullableString,
    user_id: nullableString,
    email: z.string().trim().toLowerCase().email().max(254).nullish(),
    renewal_period_end: z.union([z.number(), z.string()]).nullish(),
    expires_at: z.union([z.number(), z.string()]).nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  }).passthrough(),
}).passthrough();

export type WhopWebhookEnvelope = z.infer<typeof whopWebhookEnvelopeSchema>;

/** Whop sends seconds-based epochs on some fields and ISO strings on others. */
export function coerceWhopTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && numeric > 0) return coerceWhopTimestamp(numeric);
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export type EntitlementRecord = {
  tierKey: string;
  state: string;
  validUntil: Date | null;
  revokedAt: Date | null;
  lastVerifiedAt: Date | null;
};

/**
 * Decide whether a stored entitlement is currently usable.
 *
 * An entitlement expires on its own once `validUntil` passes, even if no revocation
 * webhook ever arrived, so a missed webhook degrades to no access rather than to
 * indefinite access.
 */
export function evaluateEntitlement(record: EntitlementRecord | null | undefined, now = new Date()) {
  if (!record) return { active: false as const, reason: "no_entitlement" as const, capabilities: [] as AccessCapability[] };
  if (record.revokedAt && record.revokedAt <= now) {
    return { active: false as const, reason: "revoked" as const, capabilities: [] as AccessCapability[] };
  }
  if (record.state !== "active") {
    return { active: false as const, reason: record.state === "grace" ? ("grace" as const) : ("inactive" as const), capabilities: [] as AccessCapability[] };
  }
  if (record.validUntil && record.validUntil <= now) {
    return { active: false as const, reason: "expired" as const, capabilities: [] as AccessCapability[] };
  }
  return { active: true as const, reason: "active" as const, capabilities: [...tierCapabilities(record.tierKey)] };
}

export function entitlementGrants(record: EntitlementRecord | null | undefined, capability: AccessCapability, now = new Date()) {
  const evaluated = evaluateEntitlement(record, now);
  return evaluated.active && evaluated.capabilities.includes(capability);
}

export const checkoutIntentSchema = z.object({
  tierKey: z.enum(accessTierKeys),
  email: z.string().trim().toLowerCase().email().max(254),
  acceptedTerms: z.literal(true),
});

export type CheckoutIntentInput = z.infer<typeof checkoutIntentSchema>;

export const checkoutReturnSchema = z.object({
  state: z.string().trim().min(16).max(128),
  membershipId: z.string().trim().min(1).max(200).optional(),
});

/** Tier keys re-exported so API routes validate against one source of truth. */
export type { AccessTierKey };
