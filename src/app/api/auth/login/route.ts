import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import {
  createClinicSession,
  revokeClinicSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  bindAirlockAcceptanceToSession,
  readAgreementAirlockPass,
} from "@/lib/legal/agreement-airlock";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  returnTo: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  const requestedReturnTo = safeReturnTo(parsed.data.returnTo) ?? "/home";
  const airlockPass = readAgreementAirlockPass(request);
  if (!airlockPass) {
    return NextResponse.json(
      {
        error: "Review and accept the Klinikos Agreement Airlock before signing in.",
        redirectTo: `/access?returnTo=${encodeURIComponent(requestedReturnTo)}`,
      },
      { status: 428, headers: { "Cache-Control": "no-store" } },
    );
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

    const { session, token } = await createClinicSession(identity, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    try {
      await bindAirlockAcceptanceToSession({
        session,
        pass: airlockPass,
        ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
    } catch (bindingError) {
      await revokeClinicSession(session);
      throw bindingError;
    }

    clearLoginFailures(key);
    const response = NextResponse.json({ ok: true, redirectTo: requestedReturnTo });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
