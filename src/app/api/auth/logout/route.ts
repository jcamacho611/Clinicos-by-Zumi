import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
  getAccountSession,
  revokeAccountSession,
} from "@/lib/auth/account-session";
import {
  getAuthenticationSession,
  revokeClinicSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const [clinicSession, accountSession] = await Promise.all([
    getAuthenticationSession(),
    getAccountSession(),
  ]);

  await Promise.all([
    revokeClinicSession(clinicSession).catch(() => undefined),
    revokeAccountSession(accountSession).catch(() => undefined),
  ]);

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, "", { ...accountSessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
