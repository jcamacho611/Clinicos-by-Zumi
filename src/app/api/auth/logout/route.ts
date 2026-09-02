import { NextResponse } from "next/server";
import { getAuthenticationSession, revokeClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
  getPersonAccountSession,
  revokePersonAccountSession,
} from "@/lib/auth/account-session";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export async function POST(request: Request) {
  if (!evaluateSameOriginMutation(request).allowed) {
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

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
