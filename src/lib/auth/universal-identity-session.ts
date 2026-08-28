import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { safeReturnTo } from "@/lib/auth/return-to";
import type { AgreementAirlockPass } from "@/lib/legal/agreement-airlock";
import { agreementPlainText, agreementSha256, buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { ensureAgreementVersionRegistered } from "@/lib/legal/legal-access";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";

export const UNIVERSAL_IDENTITY_SESSION_COOKIE = "klinikos_identity_session";
const VERIFY_TTL_MS = 30 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type IdentityVerificationPayload = {
  purpose: "universal-identity-email";
  personId: string;
  email: string;
  displayName: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  acceptedAt: string;
  acknowledgments: Record<string, boolean>;
  airlockNonce: string;
  returnTo: string;
  exp: number;
};

type IdentitySessionPayload = {
  purpose: "universal-identity-session";
  personId: string;
  email: string;
  acceptanceId: string;
  exp: number;
};

function authSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return value;
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.klinikos.io").replace(/\/$/, "");
}

function sign<T extends object>(payload: T) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verify<T extends { purpose: string; exp: number }>(token: string): T | null {
  const [body, suppliedSignature] = token.split(".");
  if (!body || !suppliedSignature) return null;
  const expectedSignature = createHmac("sha256", authSecret()).update(body).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function sendUniversalIdentityVerification(input: {
  personId: string;
  email: string;
  displayName: string;
  airlockPass: AgreementAirlockPass;
  returnTo?: string | null;
}) {
  const returnTo = safeReturnTo(input.returnTo) ?? "/home";
  const payload: IdentityVerificationPayload = {
    purpose: "universal-identity-email",
    personId: input.personId,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName,
    documentKey: input.airlockPass.documentKey,
    documentVersion: input.airlockPass.documentVersion,
    documentSha256: input.airlockPass.documentSha256,
    acceptedAt: input.airlockPass.acceptedAt,
    acknowledgments: input.airlockPass.acknowledgments,
    airlockNonce: input.airlockPass.nonce,
    returnTo,
    exp: Date.now() + VERIFY_TTL_MS,
  };
  const verifyUrl = `${appUrl()}/identity/verify?token=${encodeURIComponent(sign(payload))}`;

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is required for production identity verification.");
    console.info("Klinikos universal identity verification URL", { email: payload.email, verifyUrl });
    return { delivered: false, expiresAt: new Date(payload.exp) };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.ACCESS_EMAIL_FROM || "Klinikos Identity <access@klinikos.io>",
      to: [payload.email],
      subject: "Verify your Klinikos identity",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Verify your Klinikos identity</h2><p>Confirm this email address to continue the protected Klinikos conversation you started.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#181011;color:white;padding:12px 18px;text-decoration:none;border-radius:999px">Verify and continue</a></p><p>This link expires in 30 minutes. Verification creates identity only. It does not create professional, clinical, organization, Grid, patient-access, payment, or financial authority.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Identity verification delivery failed with ${response.status}`);
  return { delivered: true, expiresAt: new Date(payload.exp) };
}

export async function verifyUniversalIdentityEmail(rawToken: string) {
  const payload = verify<IdentityVerificationPayload>(rawToken.trim());
  if (!payload || payload.purpose !== "universal-identity-email") return { ok: false as const };

  const person = await db.person.findUnique({ where: { id: payload.personId } });
  if (!person || person.status !== "active" || person.primaryEmail?.toLowerCase() !== payload.email) return { ok: false as const };

  const legal = getLegalConfigurationStatus();
  if (!legal.ready) return { ok: false as const };
  const agreement = buildGlobalAgreement(legal.config);
  const hash = agreementSha256(agreement);
  if (
    payload.documentKey !== agreement.documentKey
    || payload.documentVersion !== agreement.documentVersion
    || payload.documentSha256 !== hash
  ) return { ok: false as const };

  const acceptedAt = new Date(payload.acceptedAt);
  if (!Number.isFinite(acceptedAt.getTime())) return { ok: false as const };
  await ensureAgreementVersionRegistered(agreement, []);
  const idempotencyKey = `airlock-person:${payload.personId}:${payload.airlockNonce}`;
  const snapshot = agreementPlainText(agreement);

  const acceptance = await db.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "access_gate_acceptances" WHERE "idempotencyKey" = ${idempotencyKey} LIMIT 1
    `);
    if (existing[0]) return existing[0];

    const id = randomUUID();
    const inserted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt", "source",
        "legalName", "signerCapacity", "signatureMethod", "authorityConfirmed",
        "electronicSignatureConsentedAt", "presentedAt", "firstViewedAt", "reachedEndAt",
        "acknowledgedAt", "signedAt", "documentSha256", "documentSnapshot", "acknowledgments",
        "idempotencyKey", "sourceRoute", "status"
      ) VALUES (
        ${id}, ${payload.email}, ${agreement.documentKey}, ${agreement.documentVersion}, ${acceptedAt},
        'agreement-airlock-universal-identity', ${person.displayName ?? payload.displayName}, 'individual',
        'email_verified_clickwrap', false, ${acceptedAt}, ${acceptedAt}, ${acceptedAt}, ${acceptedAt},
        ${acceptedAt}, ${acceptedAt}, ${hash}, ${snapshot}, CAST(${JSON.stringify(payload.acknowledgments)} AS JSONB),
        ${idempotencyKey}, '/access', 'active'
      )
      ON CONFLICT DO NOTHING
      RETURNING "id"
    `);
    const record = inserted[0] ?? (await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "access_gate_acceptances" WHERE "idempotencyKey" = ${idempotencyKey} LIMIT 1
    `))[0];
    if (!record) throw new Error("Universal identity acceptance could not be bound safely.");

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "legal_agreement_events" (
        "id", "acceptanceId", "eventType", "documentKey", "documentVersion", "metadata"
      ) VALUES (
        ${randomUUID()}, ${record.id}, 'legal.airlock.identity_bound', ${agreement.documentKey}, ${agreement.documentVersion},
        CAST(${JSON.stringify({ personId: person.id, documentSha256: hash, acceptedAt: acceptedAt.toISOString() })} AS JSONB)
      )
    `);
    return record;
  });

  const sessionPayload: IdentitySessionPayload = {
    purpose: "universal-identity-session",
    personId: person.id,
    email: payload.email,
    acceptanceId: acceptance.id,
    exp: Date.now() + SESSION_TTL_MS,
  };

  return {
    ok: true as const,
    token: sign(sessionPayload),
    expiresAt: new Date(sessionPayload.exp),
    returnTo: safeReturnTo(payload.returnTo) ?? "/home",
  };
}

export async function getUniversalIdentitySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(UNIVERSAL_IDENTITY_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verify<IdentitySessionPayload>(token);
  if (!payload || payload.purpose !== "universal-identity-session") return null;
  const person = await db.person.findUnique({ where: { id: payload.personId } });
  if (!person || person.status !== "active" || person.primaryEmail?.toLowerCase() !== payload.email) return null;
  return { personId: person.id, email: payload.email, name: person.displayName ?? person.legalName ?? "Klinikos member", acceptanceId: payload.acceptanceId };
}

export function universalIdentitySessionCookieOptions(expiresAt: Date) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", expires: expiresAt };
}
