import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials, hasClinicIdentity } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { safeClinicReturnTo, safePersonReturnTo } from "@/lib/auth/return-to";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
} from "@/lib/auth/account-session";
import { authenticatePersonAccount } from "@/lib/auth/person-account-repository";
import { signAccountSessionToken } from "@/lib/auth/account-token";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  returnTo: z.string().max(500).optional().nullable(),
});

function jsonNoStore(payload: unknown, init: ResponseInit) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!evaluateSameOriginMutation(request).allowed) {
    return jsonNoStore(
      { error: "This request could not be verified." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonNoStore({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const key = `${ipAddress}:${parsed.data.email.toLowerCase()}`;
  const limit = checkLoginRateLimit(key);

  if (!limit.allowed) {
    return jsonNoStore(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const identity = await authenticateCredentials(parsed.data.email, parsed.data.password);
    if (identity) {
      const { token } = await createClinicSession(identity, {
        ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      clearLoginFailures(key);

      const response = NextResponse.json({ ok: true, redirectTo: safeClinicReturnTo(parsed.data.returnTo) ?? (identity.role === "contractor" ? "/grid/opportunities" : "/dashboard") });
      response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
      response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, "", { ...accountSessionCookieOptions(), maxAge: 0 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    // An active legacy clinic identity owns this address on the organization-bound
    // rail. A wrong clinic password must not silently fall through into a lower-context
    // person session using a coincidentally duplicated email.
    if (await hasClinicIdentity(parsed.data.email)) {
      recordLoginFailure(key);
      return jsonNoStore({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const person = await authenticatePersonAccount(parsed.data.email, parsed.data.password, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    if (!person) {
      recordLoginFailure(key);
      return jsonNoStore({ error: "Email or password is incorrect." }, { status: 401 });
    }
    clearLoginFailures(key);

    const response = NextResponse.json({ ok: true, redirectTo: safePersonReturnTo(parsed.data.returnTo) ?? "/member" });
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, await signAccountSessionToken(person), accountSessionCookieOptions());
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return jsonNoStore({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
