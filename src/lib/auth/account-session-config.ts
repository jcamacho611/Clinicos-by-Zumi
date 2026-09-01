import "server-only";

export const ACCOUNT_SESSION_COOKIE_NAME = "klinikos_person_session";
export const ACCOUNT_SESSION_TTL_SECONDS = 60 * 60 * 8;

export function accountSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCOUNT_SESSION_TTL_SECONDS,
  };
}
