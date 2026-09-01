import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
} from "@/lib/auth/account-session";
import {
  createFreePersonAccount,
  PersonAccountEmailTakenError,
} from "@/lib/auth/person-account-repository";
import { personAccountSignupSchema } from "@/lib/auth/person-account-signup";
import { signAccountSessionToken } from "@/lib/auth/account-token";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";
import {
  assertMemberSignupAllowed,
  MemberSignupAdmissionError,
} from "@/lib/auth/member-signup-admission";

function jsonNoStore(payload: unknown, init: ResponseInit) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/**
 * Free entry. Creates a Person and an Account in one transaction and signs the person
 * in, and does nothing else — no organization, no membership, no professional or
 * clinical authority, no Grid eligibility.
 *
 * Reuses the existing onboarding rate limiter rather than adding another, because
 * account creation is the same class of abuse surface it already guards.
 */
export async function POST(request: Request) {
  // The account rail is built, but opening it publicly is a deployment decision.
  // Keep this off until the baseline person-account terms/privacy evidence path has
  // completed counsel and release review; a frontend button is never that approval.
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") {
    return jsonNoStore(
      { error: "Free Klinikos membership is not enabled in this deployment." },
      { status: 404 },
    );
  }

  if (!evaluateSameOriginMutation(request).allowed) {
    return jsonNoStore({ error: "This request could not be verified." }, { status: 403 });
  }

  const parsed = personAccountSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonNoStore(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  try {
    await assertMemberSignupAllowed({
      email: parsed.data.email,
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
    });
    const created = await createFreePersonAccount(parsed.data, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // The response carries no identifiers. The session is the cookie; the browser has
    // no need for the account or person id, and publishing them would be disclosure
    // without a purpose.
    const expiresAt = Math.floor(created.expiresAt.getTime() / 1_000);
    const token = await signAccountSessionToken({
      sessionId: created.sessionId,
      accountId: created.accountId,
      personId: created.personId,
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      expiresAt,
    });
    const response = jsonNoStore({ data: { joined: true } }, { status: 201 });
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, token, accountSessionCookieOptions());
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof MemberSignupAdmissionError) {
      const headers: Record<string, string> = {};
      if (error.retryAfterSeconds) headers["Retry-After"] = String(error.retryAfterSeconds);
      return jsonNoStore({ error: error.message }, { status: error.status, headers });
    }
    if (error instanceof PersonAccountEmailTakenError) {
      return jsonNoStore(
        { error: "That email cannot be used to create a new account. Try signing in instead." },
        { status: 409 },
      );
    }
    console.error("Free account creation failed.", error);
    return jsonNoStore({ error: "We could not create the account. Try again." }, { status: 500 });
  }
}
