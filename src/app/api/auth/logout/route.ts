import { NextResponse } from "next/server";
import { getAuthenticationSession, revokeClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
  getPersonAccountSession,
  revokePersonAccountSession,
} from "@/lib/auth/account-session";

export async function POST(request: Request) {
  const session = await getAuthenticationSession();
  const personSession = await getPersonAccountSession();
  await Promise.all([
    revokeClinicSession(session).catch(() => undefined),
    revokePersonAccountSession(personSession).catch(() => undefined),
  ]);

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, "", { ...accountSessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
