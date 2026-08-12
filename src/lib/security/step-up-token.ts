import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = 1;
const MAX_TTL_SECONDS = 10 * 60;

export type StepUpPurpose =
  | "security_change"
  | "access_change"
  | "record_release"
  | "credential_decision"
  | "financial_commitment"
  | "payout_or_refund"
  | "external_write"
  | "clinical_high_impact";

type StepUpPayload = {
  v: number;
  sessionId: string;
  userId: string;
  organizationId: string;
  purpose: StepUpPurpose;
  issuedAt: number;
  expiresAt: number;
  method: "password_reauth" | "mfa" | "passkey";
};

function secret(env: NodeJS.ProcessEnv = process.env) {
  return env.KLINIKOS_STEP_UP_SIGNING_SECRET?.trim() || env.AUTH_SECRET?.trim() || null;
}

function sign(body: string, key: string) {
  return createHmac("sha256", key).update(`klinikos-step-up:${body}`).digest("base64url");
}

/**
 * Only an authenticated re-authentication/MFA/passkey ceremony may call this helper.
 * Merely possessing a normal session is not proof of step-up.
 */
export function sealStepUpProof(input: {
  sessionId: string;
  userId: string;
  organizationId: string;
  purpose: StepUpPurpose;
  method: StepUpPayload["method"];
  ttlSeconds?: number;
}, env: NodeJS.ProcessEnv = process.env) {
  const key = secret(env);
  if (!key) return null;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: StepUpPayload = {
    v: VERSION,
    sessionId: input.sessionId,
    userId: input.userId,
    organizationId: input.organizationId,
    purpose: input.purpose,
    method: input.method,
    issuedAt,
    expiresAt: issuedAt + Math.max(30, Math.min(input.ttlSeconds ?? 5 * 60, MAX_TTL_SECONDS)),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export function verifyStepUpProof(token: string | null | undefined, expected: {
  sessionId: string;
  userId: string;
  organizationId: string;
  purpose: StepUpPurpose;
}, env: NodeJS.ProcessEnv = process.env): StepUpPayload | null {
  if (!token) return null;
  const key = secret(env);
  if (!key) return null;
  const [body, supplied, extra] = token.split(".");
  if (!body || !supplied || extra) return null;

  const wanted = sign(body, key);
  const suppliedBytes = Buffer.from(supplied);
  const wantedBytes = Buffer.from(wanted);
  if (suppliedBytes.length !== wantedBytes.length || !timingSafeEqual(suppliedBytes, wantedBytes)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StepUpPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.v !== VERSION || payload.expiresAt <= now) return null;
    if (payload.sessionId !== expected.sessionId || payload.userId !== expected.userId || payload.organizationId !== expected.organizationId || payload.purpose !== expected.purpose) return null;
    if (!["password_reauth", "mfa", "passkey"].includes(payload.method)) return null;
    return payload;
  } catch {
    return null;
  }
}
