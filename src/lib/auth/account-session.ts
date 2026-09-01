import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PersonAccountSession } from "@/lib/auth/account-types";
import { verifyAccountSessionToken } from "@/lib/auth/account-token";
import {
  resolvePersonAccountSessionById,
  revokePersonAccountSessionById,
} from "@/lib/auth/person-account-repository";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
  accountSessionCookieOptions,
} from "@/lib/auth/account-session-config";

export type { PersonAccountSession };

/**
 * Cookie options for the person-account session, matching the existing clinic and
 * portal session cookies: httpOnly so script cannot read it, secure in production,
 * lax so a normal top-level navigation keeps the session.
 */
export const getPersonAccountSession = cache(async (): Promise<PersonAccountSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_SESSION_COOKIE_NAME)?.value;
  if (!token || !process.env.DATABASE_URL) return null;

  const claims = await verifyAccountSessionToken(token);
  if (!claims) return null;

  try {
    const persisted = await resolvePersonAccountSessionById(claims.sessionId);
    if (
      !persisted
      || persisted.accountId !== claims.accountId
      || persisted.personId !== claims.personId
      || persisted.email !== claims.email
      || persisted.expiresAt !== claims.expiresAt
    ) return null;
    return persisted;
  } catch {
    return null;
  }
});

export async function requirePersonAccountSession() {
  const session = await getPersonAccountSession();
  if (!session) redirect("/login?returnTo=%2Fmember");
  return session;
}

export async function revokePersonAccountSession(session: PersonAccountSession | null) {
  if (!session || !process.env.DATABASE_URL) return;
  await revokePersonAccountSessionById(session.sessionId, session.accountId);
}

export {
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
  accountSessionCookieOptions,
};
