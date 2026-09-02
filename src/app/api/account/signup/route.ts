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
import { getMemberSignupReleaseState } from "@/lib/auth/member-signup-release";
import {
  MemberSignupAcceptanceMismatchError,
  MemberSignupAcceptanceUnavailableError,
  resolveMemberSignupAcceptance,
} from "@/lib/legal/member-signup-acceptance";

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
 * Public account creation uses durable, privacy-minimized admission buckets. It stays
 * separate from provider onboarding because creating an Account grants no provider,
 * organization, patient, Grid, or other authority.
 */
export async function POST(request: Request) {
  // The account rail is built, but opening it publicly is a deployment decision.
  // Keep this off until the baseline person-account terms/privacy evidence path has
  // completed counsel and release review; a frontend button is never that approval.
  if (!getMemberSignupReleaseState().enabled) {
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

  // Proxy headers are request-controlled unless the deployment proves its edge strips
  // and rewrites them. The email digest remains the durable admission key; IP becomes
  // an additional signal only in an explicitly configured trusted-proxy deployment.
  const forwardedFor = process.env.KLINIKOS_TRUST_PROXY_HEADERS === "true"
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const ipAddress = forwardedFor
    || (process.env.KLINIKOS_TRUST_PROXY_HEADERS === "true" ? request.headers.get("x-real-ip") : null)
    || "unknown";
  try {
    await assertMemberSignupAllowed({
      email: parsed.data.email,
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
    });

    // The browser proves only its affirmative clicks plus the versions it saw. The
    // server resolves the authoritative source text/hash again before any identity is
    // created; stale, missing, draft, or unapproved source evidence fails closed.
    const legalAcceptance = resolveMemberSignupAcceptance(parsed.data.legalAcceptances);
    const created = await createFreePersonAccount(
      parsed.data,
      {
        ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
      legalAcceptance,
    );

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
    if (error instanceof MemberSignupAcceptanceMismatchError) {
      return jsonNoStore({ error: error.message }, { status: 409 });
    }
    if (error instanceof MemberSignupAcceptanceUnavailableError) {
      return jsonNoStore(
        { error: "Required membership documents are not ready in this deployment." },
        { status: 503 },
      );
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
