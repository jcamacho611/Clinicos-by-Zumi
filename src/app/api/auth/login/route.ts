import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAccountCredentials } from "@/lib/auth/account-credentials";
import { accountIdentityHasClinicContext } from "@/lib/auth/account-types";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
  createAccountSession,
} from "@/lib/auth/account-session";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";

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

  const metadata = {
    ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    // Compatibility law: existing organization-bound clinic authentication remains
    // first and unchanged during this migration tranche.
    const identity = await authenticateCredentials(parsed.data.email, parsed.data.password);
    if (identity) {
      const { token } = await createClinicSession(identity, metadata);
      clearLoginFailures(key);

      const response = NextResponse.json({
        ok: true,
        redirectTo: safeReturnTo(parsed.data.returnTo) ?? (identity.role === "contractor" ? "/grid/opportunities" : "/dashboard"),
      });
      response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    // Free members need a durable re-login path, but this fallback may not establish
    // Clinic OS authority. A canonical Account that currently resolves to clinic
    // context must keep using the legacy clinic rail until the separately verified
    // account-auth cutover is ready.
    const accountIdentity = await authenticateAccountCredentials(parsed.data.email, parsed.data.password);
    if (!accountIdentity || accountIdentityHasClinicContext(accountIdentity)) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const { token: accountToken } = await createAccountSession(accountIdentity, metadata);
    clearLoginFailures(key);

    const response = NextResponse.json({ ok: true, redirectTo: "/member" });
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, accountToken, accountSessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
