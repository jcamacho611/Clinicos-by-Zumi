import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";
import { clinicRoleSchema } from "@/lib/auth/rbac";
import type { AccountSession } from "@/lib/auth/account-types";

export const ACCOUNT_SESSION_COOKIE_NAME = "klinikos_account_session";
export const ACCOUNT_SESSION_TTL_SECONDS = 60 * 60 * 8;

const issuer = "klinikos-account";
const audience = "klinikos-member-app";

const base = {
  sessionId: z.string().min(1),
  accountId: z.string().min(1),
  personId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  demo: z.literal(false),
  expiresAt: z.number().int().positive(),
};

const accountSessionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("member"), ...base }),
  z.object({
    kind: z.literal("clinic"),
    ...base,
    legacyUserId: z.string().min(1),
    organizationId: z.string().min(1),
    organizationName: z.string().min(1),
    organizationSlug: z.string().min(1),
    role: clinicRoleSchema,
  }),
]);

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

export function accountSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCOUNT_SESSION_TTL_SECONDS,
  };
}

export async function signAccountSessionToken(session: AccountSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(session.accountId)
    .setJti(session.sessionId)
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .sign(key());
}

export async function verifyAccountSessionToken(token: string): Promise<AccountSession | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
    return accountSessionSchema.parse(payload);
  } catch {
    return null;
  }
}
