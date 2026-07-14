import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const key = `${ipAddress}:${parsed.data.email.toLowerCase()}`;
  const limit = checkLoginRateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const identity = await authenticateCredentials(parsed.data.email, parsed.data.password);
    if (!identity) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const { token } = await createClinicSession(identity, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    clearLoginFailures(key);

    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
