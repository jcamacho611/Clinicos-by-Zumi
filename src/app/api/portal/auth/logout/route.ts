import { NextResponse } from "next/server";
import { getPortalSession, PORTAL_SESSION_COOKIE_NAME, portalSessionCookieOptions, revokePortalSession } from "@/lib/auth/portal-session";

export async function POST(request: Request) {
  const session = await getPortalSession();
  await revokePortalSession(session).catch(() => undefined);
  const response = NextResponse.redirect(new URL("/portal/login", request.url), 303);
  response.cookies.set(PORTAL_SESSION_COOKIE_NAME, "", { ...portalSessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
