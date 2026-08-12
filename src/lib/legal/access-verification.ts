import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { canonicalAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";

const ACCESS_VERIFICATION_TTL_MS = 30 * 60 * 1000;
const EVALUATION_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type VerificationPayload = {
  purpose: "evaluation-email";
  email: string;
  acceptanceId: string;
  documentVersion: string;
  exp: number;
};

type EvaluationPayload = {
  purpose: "evaluation-session";
  email: string;
  exp: number;
};

type AcceptanceRow = {
  id: string;
  email: string;
  documentVersion: string;
  source: string;
  verifiedEmailAt: Date | null;
};

function appUrl() {
  // Was hard-coded to the production domain, which sends every preview deployment's
  // verification link to production instead of to itself.
  return canonicalAppUrl();
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return value;
}

function signPayload(payload: VerificationPayload | EvaluationPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function readPayload<T extends VerificationPayload | EvaluationPayload>(token: string): T | null {
  const [body, suppliedSignature] = token.split(".");
  if (!body || !suppliedSignature) return null;
  const expectedSignature = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (!payload.exp || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function sendAccessVerificationEmail(input: {
  email: string;
  acceptanceId: string;
  documentVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const expiresAt = new Date(Date.now() + ACCESS_VERIFICATION_TTL_MS);
  const token = signPayload({
    purpose: "evaluation-email",
    email: input.email,
    acceptanceId: input.acceptanceId,
    documentVersion: input.documentVersion,
    exp: expiresAt.getTime(),
  });
  const verifyUrl = `${appUrl()}/access/verify?token=${encodeURIComponent(token)}`;

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is required for production access verification.");
    console.info("Klinikos access verification URL", { email: input.email, verifyUrl });
    return { expiresAt, delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.ACCESS_EMAIL_FROM || "Klinikos Access <access@klinikos.io>",
      to: [input.email],
      subject: "Verify your Klinikos evaluation access",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0b1e3a"><h2>Verify your Klinikos access</h2><p>Your agreement has been recorded. Verify this work email to continue into protected Klinikos evaluation materials.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#0b1e3a;color:white;padding:12px 18px;text-decoration:none">Verify work email</a></p><p>This link expires in 30 minutes. If you did not request access, you can ignore this message.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend delivery failed with ${response.status}`);
  return { expiresAt, delivered: true };
}

/**
 * Verify an access email from its token.
 *
 * This used to accept the caller's request metadata — IP and user agent — and discard
 * it. Accepting context that is never recorded reads as provenance being captured when
 * none is, so the parameter is gone. When verification writes an audit row, the metadata
 * comes back with somewhere to go.
 */
export async function verifyAccessEmail(rawToken: string) {
  const token = rawToken.trim();
  if (!token) return { ok: false as const, reason: "missing" as const };
  const payload = readPayload<VerificationPayload>(token);
  if (!payload || payload.purpose !== "evaluation-email") return { ok: false as const, reason: "invalid" as const };

  const rows = await db.$queryRaw<AcceptanceRow[]>(Prisma.sql`
    SELECT "id", "email", "documentVersion", "source", "verifiedEmailAt"
    FROM "access_gate_acceptances"
    WHERE "id" = ${payload.acceptanceId}
    LIMIT 1
  `);
  const acceptance = rows[0];
  if (!acceptance || acceptance.email !== payload.email || acceptance.documentVersion !== payload.documentVersion) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const alreadyVerified = Boolean(acceptance.verifiedEmailAt);
  if (!alreadyVerified) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "access_gate_acceptances"
      SET "source" = 'web-access-gate-verified', "verifiedEmailAt" = NOW()
      WHERE "id" = ${acceptance.id} AND "verifiedEmailAt" IS NULL
    `);
  }

  return { ok: true as const, email: payload.email, alreadyVerified };
}

export function createEvaluationAccessToken(email: string) {
  const expiresAt = new Date(Date.now() + EVALUATION_SESSION_TTL_MS);
  return {
    value: signPayload({ purpose: "evaluation-session", email, exp: expiresAt.getTime() }),
    expiresAt,
  };
}
