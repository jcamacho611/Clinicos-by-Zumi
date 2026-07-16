import { NextResponse } from "next/server";
import { checkOnboardingRateLimit, recordOnboardingAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { onboardingErrorMessage, onboardingSchema } from "@/lib/onboarding-rules";
import { createOrganizationWorkspace, OnboardingError } from "@/lib/repositories/onboarding-repository";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Workspace creation requires PostgreSQL. Connect DATABASE_URL and try again." }, { status: 503 });
  }

  const metadata = requestMetadata(request);
  const rateLimitKey = metadata.ipAddress ?? "unknown";
  const limit = checkOnboardingRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many workspace creation attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    recordOnboardingAttempt(rateLimitKey);
    return NextResponse.json({ error: onboardingErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    recordOnboardingAttempt(rateLimitKey);
    const workspace = await createOrganizationWorkspace(parsed.data, metadata);
    const { token } = await createClinicSession(workspace.identity, metadata);
    const response = NextResponse.json({
      ok: true,
      redirectTo: "/dashboard?onboarding=complete",
      organizationId: workspace.identity.organizationId,
      organizationSlug: workspace.identity.organizationSlug,
      trialEndsAt: workspace.trialEndsAt.toISOString(),
      mode: "synthetic-data-only",
    }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof OnboardingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Workspace creation is temporarily unavailable." }, { status: 503 });
  }
}
