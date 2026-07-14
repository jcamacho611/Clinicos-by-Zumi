import { NextResponse } from "next/server";
import { getClinicSession, revokeClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getClinicSession();
  await revokeClinicSession(session).catch(() => undefined);

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
