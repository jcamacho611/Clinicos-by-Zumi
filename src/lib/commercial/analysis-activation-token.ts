import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A signed reference to one analysis reservation, safe to put in a return URL.
 *
 * The checkout return previously carried `?reservation=<cuid>`. That is fine as a
 * correlation hint and unsafe as an authorization fact: a return URL travels through
 * browser history, referrer headers, shared links and support tickets, and anyone
 * holding one would be able to read or mutate that reservation. The id alone proves
 * nothing about who is asking.
 *
 * Signing it fixes the forgeable half — a token cannot be minted or edited without the
 * server secret, and it expires. It deliberately does NOT become an authenticated
 * session: it is scoped to a single reservation, carries no role, and the surfaces that
 * accept it stay limited to non-clinical, non-financial activation details. Payment
 * state is still only ever read from the server, never asserted by the holder.
 *
 * Without a signing secret configured, `sealActivationReference` returns null and the
 * return URL simply carries no token. The activation surface then shows its generic
 * truthful state rather than pretending to know which purchase it belongs to.
 */

const VERSION = 1;
const DEFAULT_TTL_SECONDS = 14 * 24 * 60 * 60;

interface ActivationPayload {
  v: number;
  reservationId: string;
  issuedAt: number;
  expiresAt: number;
}

function secret(env: NodeJS.ProcessEnv = process.env) {
  return env.KLINIKOS_ACTIVATION_SIGNING_SECRET?.trim() || env.AUTH_SECRET?.trim() || null;
}

function sign(body: string, key: string) {
  return createHmac("sha256", key).update(`klinikos-analysis-activation:${body}`).digest("base64url");
}

export function sealActivationReference(
  reservationId: string,
  options: { ttlSeconds?: number } = {},
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = secret(env);
  if (!key || !reservationId) return null;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: ActivationPayload = {
    v: VERSION,
    reservationId,
    issuedAt,
    expiresAt: issuedAt + Math.max(60, options.ttlSeconds ?? DEFAULT_TTL_SECONDS),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export type ActivationReference =
  | { ok: true; reservationId: string }
  | { ok: false; reason: "missing" | "not_configured" | "malformed" | "bad_signature" | "expired" };

export function openActivationReference(
  token: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): ActivationReference {
  if (!token) return { ok: false, reason: "missing" };
  const key = secret(env);
  if (!key) return { ok: false, reason: "not_configured" };

  const [body, signature] = token.split(".");
  if (!body || !signature) return { ok: false, reason: "malformed" };

  const expected = sign(body, key);
  const provided = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  // Constant-time, and length-checked first because timingSafeEqual throws on a mismatch.
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: ActivationPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.v !== VERSION || typeof payload.reservationId !== "string" || !payload.reservationId) {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, reservationId: payload.reservationId };
}
