import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-routing";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { hasCurrentAgreementAcceptance } from "@/lib/legal/legal-access";
import { getLegalConfigurationStatus, isLegalGateEnforcementEnabled } from "@/lib/legal/legal-config";

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
    clearLoginFailures(key);

    const legalGateEnabled = isLegalGateEnforcementEnabled();
    const legalStatus = legalGateEnabled ? getLegalConfigurationStatus() : null;
    let agreementAccepted = false;

    if (legalGateEnabled && legalStatus?.ready && !session.demo && process.env.DATABASE_URL) {
      try {
        agreementAccepted = await hasCurrentAgreementAcceptance(session, buildGlobalAgreement(legalStatus.config));
      } catch {
        // Fail closed without discarding the authenticated session. The legal page will
        // retry its own evidence read and explain the blocker rather than granting
        // product access or treating a lookup failure as acceptance.
        agreementAccepted = false;
      }
    }

    const redirectTo = resolvePostLoginRedirect({
      role: session.role,
      requestedReturnTo: parsed.data.returnTo,
      legalGateEnabled,
      legalConfigurationReady: legalStatus?.ready ?? true,
      agreementAccepted,
    });

    const response = NextResponse.json({ ok: true, redirectTo });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
