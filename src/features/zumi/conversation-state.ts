import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 1;
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * What the deterministic path needs to follow a thread.
 *
 * Deliberately only product metadata: which surface the last turn pointed at, which
 * route it resolved to, and which topic matched. No patient data, no counts, no names,
 * no free text from the person — a conversation token travels in a client and is not a
 * place to put anything about a patient. "What about tomorrow?" needs to know we were
 * talking about intake, not who was on the list.
 */
export type ZumiThreadContext = {
  surface?: string;
  routeId?: string;
  topic?: string;
};

type ConversationPayload = {
  v: number;
  /** Provider-side thread pointer. Absent on the deterministic path. */
  responseId: string;
  organizationId: string;
  userId: string | null;
  thread?: ZumiThreadContext;
  issuedAt: number;
  expiresAt: number;
};

function signingSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.ZUMI_CONVERSATION_SIGNING_SECRET?.trim() || env.AUTH_SECRET?.trim() || null;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(`klinikos-zumi-conversation:${body}`).digest("base64url");
}

export function sealZumiConversation(input: {
  /** Empty string when there is no provider thread, which is the deterministic case. */
  responseId: string;
  organizationId: string;
  userId: string | null;
  thread?: ZumiThreadContext;
  ttlSeconds?: number;
}, env: NodeJS.ProcessEnv = process.env) {
  const secret = signingSecret(env);
  if (!secret) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: ConversationPayload = {
    v: TOKEN_VERSION,
    responseId: input.responseId,
    organizationId: input.organizationId,
    userId: input.userId,
    // Bounded so a token cannot grow without limit across a long conversation.
    thread: input.thread
      ? {
          surface: input.thread.surface?.slice(0, 120),
          routeId: input.thread.routeId?.slice(0, 80),
          topic: input.thread.topic?.slice(0, 40),
        }
      : undefined,
    issuedAt,
    expiresAt: issuedAt + Math.max(60, Math.min(input.ttlSeconds ?? DEFAULT_TTL_SECONDS, DEFAULT_TTL_SECONDS)),
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${signature(body, secret)}`;
}

export function openZumiConversation(token: string | null | undefined, expected: {
  organizationId: string;
  userId: string | null;
}, env: NodeJS.ProcessEnv = process.env): ConversationPayload | null {
  if (!token) return null;
  const secret = signingSecret(env);
  if (!secret) return null;

  const [body, suppliedSignature, extra] = token.split(".");
  if (!body || !suppliedSignature || extra) return null;

  const expectedSignature = signature(body, secret);
  const supplied = Buffer.from(suppliedSignature);
  const wanted = Buffer.from(expectedSignature);
  if (supplied.length !== wanted.length || !timingSafeEqual(supplied, wanted)) return null;

  try {
    const payload = JSON.parse(decode(body)) as ConversationPayload;
    const now = Math.floor(Date.now() / 1000);
    // A deterministic turn has no provider responseId but does carry thread context.
    // Requiring responseId made every deterministic follow-up look like a forged token.
    const hasThread = Boolean(payload.thread?.surface || payload.thread?.routeId || payload.thread?.topic);
    if (payload.v !== TOKEN_VERSION || (!payload.responseId && !hasThread) || payload.expiresAt <= now) return null;
    if (payload.organizationId !== expected.organizationId || payload.userId !== expected.userId) return null;
    return payload;
  } catch {
    return null;
  }
}
