import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";

export const ENTRY_GATE_COOKIE_NAME = "klinikos_protected_entry";
export const ENTRY_PRESENTATION_TTL_SECONDS = 20 * 60;
export const ENTRY_ACCEPTED_TTL_SECONDS = 2 * 60 * 60;

const issuer = "klinikos-entry-gate";
const audience = "klinikos-protected-entry";

const entryTokenSchema = z.object({
  kind: z.enum(["presented", "reviewed", "accepted"]),
  entrySessionId: z.string().uuid(),
  acceptanceId: z.string().min(1).optional(),
  documentKey: z.string().min(1),
  documentVersion: z.string().min(1),
  documentSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  presentedAt: z.string().datetime(),
  reachedEndAt: z.string().datetime().optional(),
  acceptedAt: z.string().datetime().optional(),
});

export type EntryTokenClaims = z.infer<typeof entryTokenSchema>;
export type EntryTokenKind = EntryTokenClaims["kind"];

export interface EntryAgreementIdentity {
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
}

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

async function signClaims(claims: EntryTokenClaims, ttlSeconds: number) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(claims.entrySessionId)
    .setJti(`${claims.entrySessionId}:${claims.kind}:${Date.now()}`)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key());
}

export async function createEntryPresentedToken(entrySessionId: string, agreement: EntryAgreementIdentity, presentedAt = new Date()) {
  return signClaims({ kind: "presented", entrySessionId, ...agreement, presentedAt: presentedAt.toISOString() }, ENTRY_PRESENTATION_TTL_SECONDS);
}

export async function createEntryReviewedToken(claims: EntryTokenClaims, reachedEndAt = new Date()) {
  if (claims.kind !== "presented") throw new Error("Only presented entry evidence can establish review completion.");
  return signClaims({ ...claims, kind: "reviewed", reachedEndAt: reachedEndAt.toISOString() }, ENTRY_PRESENTATION_TTL_SECONDS);
}

export async function createEntryAcceptedToken(claims: EntryTokenClaims, acceptanceId: string, acceptedAt = new Date()) {
  if (claims.kind !== "reviewed" || !claims.reachedEndAt) throw new Error("Only reviewed entry evidence can establish acceptance.");
  return signClaims({ ...claims, kind: "accepted", acceptanceId, acceptedAt: acceptedAt.toISOString() }, ENTRY_ACCEPTED_TTL_SECONDS);
}

export async function verifyEntryToken(token: string, agreement: EntryAgreementIdentity, expectedKind: EntryTokenKind, expectedEntrySessionId?: string) {
  const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
  const claims = entryTokenSchema.parse(payload);
  if (
    claims.kind !== expectedKind ||
    (expectedEntrySessionId && claims.entrySessionId !== expectedEntrySessionId) ||
    claims.documentKey !== agreement.documentKey ||
    claims.documentVersion !== agreement.documentVersion ||
    claims.documentSha256 !== agreement.documentSha256
  ) throw new Error("Protected entry evidence does not match the current session and agreement.");
  if (expectedKind === "reviewed" && !claims.reachedEndAt) throw new Error("Protected entry review evidence is incomplete.");
  if (expectedKind === "accepted" && (!claims.reachedEndAt || !claims.acceptedAt || !claims.acceptanceId)) throw new Error("Protected entry acceptance evidence is incomplete.");
  return claims;
}
