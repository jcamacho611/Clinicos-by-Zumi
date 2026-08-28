import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/auth/return-to";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  agreementPlainText,
  agreementSha256,
  buildGlobalAgreement,
  type AgreementPresentation,
} from "@/lib/legal/global-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";

export const AGREEMENT_AIRLOCK_COOKIE = "klinikos_agreement_airlock";
const AIRLOCK_TTL_SECONDS = 30 * 24 * 60 * 60;

export const AGREEMENT_AIRLOCK_AUTHORITY_BOUNDARY =
  "Agreement acceptance does not create clinical authority, professional credentials, organization ownership, Grid eligibility, financial authority, payment truth, or patient access.";

export const AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS = [
  { key: "terms", label: "Terms of Use" },
  { key: "privacy", label: "Privacy Notice" },
  { key: "acceptable_conduct", label: "Acceptable Conduct" },
  { key: "confidentiality", label: "Confidentiality and proprietary-use restrictions" },
  { key: "intellectual_property", label: "Intellectual Property protections" },
  { key: "electronic_signature", label: "Electronic-signature consent" },
  { key: "platform_disclosures", label: "Required platform disclosures" },
] as const;

export type AgreementAirlockAcknowledgmentKey = typeof AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS[number]["key"];
export type AgreementAirlockAcknowledgments = Record<AgreementAirlockAcknowledgmentKey, boolean>;

export type AgreementAirlockPass = {
  purpose: "agreement-airlock";
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  acceptedAt: string;
  acknowledgments: AgreementAirlockAcknowledgments;
  nonce: string;
  exp: number;
};

type BoundAcceptance = {
  id: string;
  userId: string | null;
  organizationId: string | null;
  documentSha256: string | null;
};

function signingSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return secret;
}

function signBody(body: string) {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

function encodePass(pass: AgreementAirlockPass) {
  const body = Buffer.from(JSON.stringify(pass)).toString("base64url");
  return `${body}.${signBody(body)}`;
}

function decodePass(token: string): AgreementAirlockPass | null {
  const [body, suppliedSignature] = token.split(".");
  if (!body || !suppliedSignature) return null;
  const expectedSignature = signBody(body);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const pass = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AgreementAirlockPass;
    if (pass.purpose !== "agreement-airlock" || !pass.exp || pass.exp <= Date.now()) return null;
    return pass;
  } catch {
    return null;
  }
}

function allAcknowledgmentsAccepted(value: AgreementAirlockAcknowledgments) {
  return AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS.every(({ key }) => value[key] === true);
}

function passMatchesAgreement(pass: AgreementAirlockPass, agreement: AgreementPresentation) {
  const hash = agreementSha256(agreement);
  return pass.documentKey === agreement.documentKey
    && pass.documentVersion === agreement.documentVersion
    && pass.documentSha256 === hash
    && allAcknowledgmentsAccepted(pass.acknowledgments);
}

export function issueAgreementAirlockPass(input: {
  agreement: AgreementPresentation;
  acknowledgments: AgreementAirlockAcknowledgments;
  acceptedAt?: Date;
}) {
  if (!allAcknowledgmentsAccepted(input.acknowledgments)) {
    throw new Error("Every Agreement Airlock disclosure must be accepted before entry can continue.");
  }

  const acceptedAt = input.acceptedAt ?? new Date();
  const hash = agreementSha256(input.agreement);
  const pass: AgreementAirlockPass = {
    purpose: "agreement-airlock",
    documentKey: input.agreement.documentKey,
    documentVersion: input.agreement.documentVersion,
    documentSha256: hash,
    acceptedAt: acceptedAt.toISOString(),
    acknowledgments: input.acknowledgments,
    nonce: randomUUID(),
    exp: acceptedAt.getTime() + AIRLOCK_TTL_SECONDS * 1000,
  };

  return {
    value: encodePass(pass),
    pass,
    expiresAt: new Date(pass.exp),
  };
}

export function verifyAgreementAirlockToken(token: string | undefined | null, agreement: AgreementPresentation) {
  if (!token) return null;
  const pass = decodePass(token);
  return pass && passMatchesAgreement(pass, agreement) ? pass : null;
}

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return null;
}

export function readAgreementAirlockPass(request: Request) {
  const legal = getLegalConfigurationStatus();
  if (!legal.ready) return null;
  const agreement = buildGlobalAgreement(legal.config);
  return verifyAgreementAirlockToken(cookieValue(request, AGREEMENT_AIRLOCK_COOKIE), agreement);
}

export async function requireAgreementAirlockPass(returnTo?: string | null) {
  const legal = getLegalConfigurationStatus();
  const target = safeReturnTo(returnTo) ?? "/home";
  if (!legal.ready) redirect(`/access?blocked=configuration&returnTo=${encodeURIComponent(target)}`);

  const agreement = buildGlobalAgreement(legal.config);
  const cookieStore = await cookies();
  const pass = verifyAgreementAirlockToken(cookieStore.get(AGREEMENT_AIRLOCK_COOKIE)?.value, agreement);
  if (!pass) redirect(`/access?returnTo=${encodeURIComponent(target)}`);
  return pass;
}

export async function bindAirlockAcceptanceToSession({
  session,
  pass,
  ipAddress,
  userAgent,
}: {
  session: ClinicSession;
  pass: AgreementAirlockPass;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (session.demo || !process.env.DATABASE_URL) {
    throw new Error("Agreement Airlock binding requires a persistent authenticated account.");
  }

  const legal = getLegalConfigurationStatus();
  if (!legal.ready) throw new Error("Legal execution configuration is incomplete.");
  const agreement = buildGlobalAgreement(legal.config);
  if (!passMatchesAgreement(pass, agreement)) {
    throw new Error("Agreement Airlock evidence does not match the current agreement.");
  }

  const acceptedAt = new Date(pass.acceptedAt);
  if (!Number.isFinite(acceptedAt.getTime())) throw new Error("Agreement Airlock acceptance timestamp is invalid.");

  const snapshot = agreementPlainText(agreement);
  const idempotencyKey = `agreement-airlock:${pass.nonce}`;

  return db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "legal_agreement_versions" (
        "id", "documentKey", "documentVersion", "title", "effectiveAt",
        "documentSha256", "documentSnapshot", "requiredAcknowledgments", "status"
      ) VALUES (
        ${randomUUID()}, ${agreement.documentKey}, ${agreement.documentVersion}, ${agreement.title},
        ${new Date(`${agreement.effectiveDate}T00:00:00.000Z`)}, ${pass.documentSha256}, ${snapshot},
        CAST(${JSON.stringify(AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS)} AS JSONB), 'published'
      )
      ON CONFLICT ("documentKey", "documentVersion") DO NOTHING
    `);

    const registered = await tx.$queryRaw<Array<{ documentSha256: string; documentSnapshot: string }>>(Prisma.sql`
      SELECT "documentSha256", "documentSnapshot"
      FROM "legal_agreement_versions"
      WHERE "documentKey" = ${agreement.documentKey}
        AND "documentVersion" = ${agreement.documentVersion}
      LIMIT 1
    `);
    if (!registered[0] || registered[0].documentSha256 !== pass.documentSha256 || registered[0].documentSnapshot !== snapshot) {
      throw new Error("Published agreement evidence does not match the Airlock pass.");
    }

    const nonceBinding = await tx.$queryRaw<BoundAcceptance[]>(Prisma.sql`
      SELECT "id", "userId", "organizationId", "documentSha256"
      FROM "access_gate_acceptances"
      WHERE "idempotencyKey" = ${idempotencyKey}
      LIMIT 1
    `);
    if (nonceBinding[0]) {
      if (
        nonceBinding[0].userId !== session.userId
        || nonceBinding[0].organizationId !== session.organizationId
        || nonceBinding[0].documentSha256 !== pass.documentSha256
      ) {
        throw new Error("Agreement Airlock evidence is already bound to a different authenticated identity.");
      }
      return nonceBinding[0];
    }

    const current = await tx.$queryRaw<BoundAcceptance[]>(Prisma.sql`
      SELECT "id", "userId", "organizationId", "documentSha256"
      FROM "access_gate_acceptances"
      WHERE "userId" = ${session.userId}
        AND "organizationId" = ${session.organizationId}
        AND "documentKey" = ${agreement.documentKey}
        AND "documentVersion" = ${agreement.documentVersion}
        AND "status" = 'active'
      LIMIT 1
    `);
    if (current[0]) {
      if (current[0].documentSha256 !== pass.documentSha256) {
        throw new Error("Current agreement acceptance has conflicting document evidence.");
      }
      return current[0];
    }

    const acceptanceId = randomUUID();
    const inserted = await tx.$queryRaw<BoundAcceptance[]>(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt", "ipAddress", "userAgent", "source",
        "userId", "organizationId", "legalName", "signerCapacity", "signatureMethod", "authorityConfirmed",
        "electronicSignatureConsentedAt", "presentedAt", "firstViewedAt", "reachedEndAt", "acknowledgedAt", "signedAt",
        "documentSha256", "documentSnapshot", "acknowledgments", "sessionId", "idempotencyKey", "sourceRoute", "status"
      ) VALUES (
        ${acceptanceId}, ${session.email}, ${agreement.documentKey}, ${agreement.documentVersion}, ${acceptedAt},
        ${ipAddress ?? null}, ${userAgent ?? null}, 'preauth-agreement-airlock', ${session.userId}, ${session.organizationId},
        ${session.name}, 'individual', 'clickwrap', false, ${acceptedAt}, ${acceptedAt}, ${acceptedAt}, ${acceptedAt}, ${acceptedAt}, ${acceptedAt},
        ${pass.documentSha256}, ${snapshot}, CAST(${JSON.stringify(pass.acknowledgments)} AS JSONB), ${session.sessionId},
        ${idempotencyKey}, '/access', 'active'
      )
      ON CONFLICT DO NOTHING
      RETURNING "id", "userId", "organizationId", "documentSha256"
    `);

    const acceptance = inserted[0] ?? (await tx.$queryRaw<BoundAcceptance[]>(Prisma.sql`
      SELECT "id", "userId", "organizationId", "documentSha256"
      FROM "access_gate_acceptances"
      WHERE "userId" = ${session.userId}
        AND "organizationId" = ${session.organizationId}
        AND "documentKey" = ${agreement.documentKey}
        AND "documentVersion" = ${agreement.documentVersion}
        AND "status" = 'active'
      LIMIT 1
    `))[0];

    if (!acceptance || acceptance.documentSha256 !== pass.documentSha256) {
      throw new Error("Agreement Airlock acceptance could not be bound safely.");
    }

    if (inserted[0]) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "legal_agreement_events" (
          "id", "acceptanceId", "userId", "organizationId", "eventType",
          "documentKey", "documentVersion", "metadata"
        ) VALUES (
          ${randomUUID()}, ${acceptance.id}, ${session.userId}, ${session.organizationId},
          'legal.airlock.bound_to_identity', ${agreement.documentKey}, ${agreement.documentVersion},
          CAST(${JSON.stringify({ acceptedAt: pass.acceptedAt, documentSha256: pass.documentSha256, signatureMethod: "clickwrap" })} AS JSONB)
        )
      `);
      await tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "legal.airlock.bound_to_identity",
          resourceType: "legal_agreement",
          resourceId: acceptance.id,
          metadata: {
            documentKey: agreement.documentKey,
            documentVersion: agreement.documentVersion,
            documentSha256: pass.documentSha256,
            acceptedAt: pass.acceptedAt,
            authorityGranted: false,
          },
        },
      });
    }

    return acceptance;
  });
}

export function agreementAirlockCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
