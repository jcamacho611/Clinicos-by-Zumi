export const SESSION_COOKIE_NAME = "clinicos_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const DEVELOPMENT_DEMO_EMAIL = "nadja@example.test";
export const DEVELOPMENT_DEMO_PASSWORD = "ClinicOS-Demo-2026!";

export function isDemoAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEMO_AUTH !== "false";
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  }

  return "clinicos-development-only-session-secret-do-not-use-in-production";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
