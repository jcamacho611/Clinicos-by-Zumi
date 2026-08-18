import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";
import type { ClinicSession } from "@/lib/auth/types";

const issuer = "klinikos-legal-gate";
const audience = "klinikos-legal-review";
const TOKEN_TTL_SECONDS = 15 * 60;

const legalReviewTokenSchema = z.object({
  kind: z.enum(["presented", "reviewed"]),
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  documentKey: z.string().min(1),
  documentVersion: z.string().min(1),
  documentSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  presentedAt: z.string().datetime(),
  reachedEndAt: z.string().datetime().optional(),
});

export type LegalReviewTokenClaims = z.infer<typeof legalReviewTokenSchema>;

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

interface AgreementIdentity {
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
}

async function signClaims(claims: LegalReviewTokenClaims) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(claims.userId)
    .setJti(`${claims.sessionId}:${claims.kind}:${Date.now()}`)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS)
    .sign(key());
}

export async function createAgreementPresentedToken(
  session: ClinicSession,
  agreement: AgreementIdentity,
  presentedAt = new Date(),
) {
  return signClaims({
    kind: "presented",
    sessionId: session.sessionId,
    userId: session.userId,
    organizationId: session.organizationId,
    ...agreement,
    presentedAt: presentedAt.toISOString(),
  });
}

export async function createAgreementReviewedToken(
  claims: LegalReviewTokenClaims,
  reachedEndAt = new Date(),
) {
  if (claims.kind !== "presented") throw new Error("Only a presentation token can establish review completion.");
  return signClaims({ ...claims, kind: "reviewed", reachedEndAt: reachedEndAt.toISOString() });
}

export async function verifyLegalReviewToken(
  token: string,
  session: ClinicSession,
  agreement: AgreementIdentity,
  expectedKind: LegalReviewTokenClaims["kind"],
) {
  const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
  const claims = legalReviewTokenSchema.parse(payload);

  if (
    claims.kind !== expectedKind ||
    claims.sessionId !== session.sessionId ||
    claims.userId !== session.userId ||
    claims.organizationId !== session.organizationId ||
    claims.documentKey !== agreement.documentKey ||
    claims.documentVersion !== agreement.documentVersion ||
    claims.documentSha256 !== agreement.documentSha256
  ) {
    throw new Error("Legal review evidence does not match the current session and agreement.");
  }

  return claims;
}
