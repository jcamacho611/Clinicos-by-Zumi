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
import { checkOnboardingRateLimit, recordOnboardingAttempt } from "@/lib/auth/rate-limit";

/**
 * Free entry. Creates a Person and an Account in one transaction and signs the person
 * in, and does nothing else — no organization, no membership, no professional or
 * clinical authority, no Grid eligibility.
 *
 * Reuses the existing onboarding rate limiter rather than adding another, because
 * account creation is the same class of abuse surface it already guards.
 */
export async function POST(request: Request) {
  const parsed = personAccountSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const limit = checkOnboardingRateLimit(ipAddress);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  recordOnboardingAttempt(ipAddress);

  try {
    const created = await createFreePersonAccount(parsed.data, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // The response carries no identifiers. The session is the cookie; the browser has
    // no need for the account or person id, and publishing them would be disclosure
    // without a purpose.
    const response = NextResponse.json({ data: { joined: true } }, { status: 201 });
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, created.sessionId, accountSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof PersonAccountEmailTakenError) {
      // Deliberately the same shape as success-adjacent errors: this endpoint should not
      // become a way to enumerate who already has a Klinikos account.
      return NextResponse.json(
        { error: "That email cannot be used to create a new account. Try signing in instead." },
        { status: 409 },
      );
    }
    console.error("Free account creation failed.", error);
    return NextResponse.json({ error: "We could not create the account. Try again." }, { status: 500 });
  }
}
