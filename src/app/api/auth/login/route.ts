import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { authenticateAccountCredentials } from "@/lib/auth/account-credentials";
import { accountIdentityHasClinicContext } from "@/lib/auth/account-types";
import { createAccountSession, ACCOUNT_SESSION_COOKIE_NAME, accountSessionCookieOptions } from "@/lib/auth/account-session";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  returnTo: z.string().max(500).optional().nullable(),
});

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400, headers: noStore });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const key = `${ipAddress}:${parsed.data.email.toLowerCase()}`;
  const limit = checkLoginRateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    // Legacy clinic authentication remains the first and only rail that can create
    // the existing Clinic OS session during this migration tranche.
    const identity = await authenticateCredentials(parsed.data.email, parsed.data.password);
    if (identity) {
      const { token } = await createClinicSession(identity, {
        ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      clearLoginFailures(key);

      const response = NextResponse.json({
        ok: true,
        redirectTo: safeReturnTo(parsed.data.returnTo) ?? (identity.role === "contractor" ? "/grid/opportunities" : "/dashboard"),
      }, { headers: noStore });
      response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
      return response;
    }

    // Only organization-free Account identities can use the free-member fallback.
    // Backfilled/clinic-linked account credentials are intentionally rejected here.
    const accountIdentity = await authenticateAccountCredentials(parsed.data.email, parsed.data.password);
    if (!accountIdentity || accountIdentityHasClinicContext(accountIdentity)) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401, headers: noStore });
    }

    const { token: accountToken } = await createAccountSession(accountIdentity, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    clearLoginFailures(key);

    const response = NextResponse.json({ ok: true, redirectTo: "/member" }, { headers: noStore });
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, accountToken, accountSessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503, headers: noStore });
  }
}
