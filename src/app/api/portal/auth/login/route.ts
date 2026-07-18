import { NextResponse } from "next/server";
import { authenticatePortalCredentials } from "@/lib/auth/portal-credentials";
import { portalLoginSchema } from "@/lib/auth/portal-rules";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createPortalSession, PORTAL_SESSION_COOKIE_NAME, portalSessionCookieOptions } from "@/lib/auth/portal-session";

export async function POST(request: Request) {
  const parsed = portalLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your clinic, email address, and password." }, { status: 400 });
  const metadata = requestMetadata(request);
  const key = `portal:${metadata.ipAddress ?? "unknown"}:${parsed.data.organization}:${parsed.data.email}`;
  const limit = checkLoginRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  try {
    const identity = await authenticatePortalCredentials({ organizationSlug: parsed.data.organization, email: parsed.data.email, password: parsed.data.password, metadata });
    if (!identity) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Clinic, email, or password is incorrect." }, { status: 401 });
    }
    const { token } = await createPortalSession(identity, metadata);
    clearLoginFailures(key);
    const response = NextResponse.json({ ok: true, redirectTo: "/portal" });
    response.cookies.set(PORTAL_SESSION_COOKIE_NAME, token, portalSessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Portal sign-in is temporarily unavailable." }, { status: 503 });
  }
}
