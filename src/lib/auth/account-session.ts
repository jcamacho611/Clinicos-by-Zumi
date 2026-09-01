import "server-only";

import type { PersonAccountSession } from "@/lib/auth/account-types";

export const ACCOUNT_SESSION_COOKIE_NAME = "klinikos_person_session";
export const ACCOUNT_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type { PersonAccountSession };

/**
 * Cookie options for the person-account session, matching the existing clinic and
 * portal session cookies: httpOnly so script cannot read it, secure in production,
 * lax so a normal top-level navigation keeps the session.
 */
export function accountSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCOUNT_SESSION_TTL_SECONDS,
  };
}
