import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 2;
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

type ConversationPayload = {
  v: number;
  responseId: string | null;
  conversationId: string | null;
  organizationId: string;
  userId: string | null;
  issuedAt: number;
  expiresAt: number;
};

type LegacyConversationPayload = {
  v: 1;
  responseId: string;
  organizationId: string;
  userId: string | null;
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
  responseId?: string | null;
  conversationId?: string | null;
  organizationId: string;
  userId: string | null;
  ttlSeconds?: number;
}, env: NodeJS.ProcessEnv = process.env) {
  const secret = signingSecret(env);
  if (!secret) return null;
  if (!input.responseId && !input.conversationId) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: ConversationPayload = {
    v: TOKEN_VERSION,
    responseId: input.responseId?.trim() || null,
    conversationId: input.conversationId?.trim() || null,
    organizationId: input.organizationId,
    userId: input.userId,
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
    const raw = JSON.parse(decode(body)) as ConversationPayload | LegacyConversationPayload;
    const now = Math.floor(Date.now() / 1000);
    if (raw.expiresAt <= now) return null;
    if (raw.organizationId !== expected.organizationId || raw.userId !== expected.userId) return null;

    if (raw.v === 1) {
      if (!raw.responseId) return null;
      return {
        v: TOKEN_VERSION,
        responseId: raw.responseId,
        conversationId: null,
        organizationId: raw.organizationId,
        userId: raw.userId,
        issuedAt: raw.issuedAt,
        expiresAt: raw.expiresAt,
      };
    }

    if (raw.v !== TOKEN_VERSION) return null;
    const responseId = typeof raw.responseId === "string" && raw.responseId.trim() ? raw.responseId.trim() : null;
    const conversationId = typeof raw.conversationId === "string" && raw.conversationId.trim() ? raw.conversationId.trim() : null;
    if (!responseId && !conversationId) return null;
    return { ...raw, responseId, conversationId };
  } catch {
    return null;
  }
}
