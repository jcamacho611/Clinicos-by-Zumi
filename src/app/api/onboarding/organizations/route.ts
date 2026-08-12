import { NextResponse } from "next/server";
import { checkOnboardingRateLimit, recordOnboardingAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { onboardingErrorMessage, onboardingSchema } from "@/lib/onboarding-rules";
import { createOrganizationWorkspace, OnboardingError } from "@/lib/repositories/onboarding-repository";

/**
 * Legacy synthetic-workspace creator.
 *
 * Production clinic access is commercial/provisioned and must never be created by a
 * public form alone. This endpoint remains available only for explicitly enabled
 * non-production synthetic testing so development fixtures do not become a paid-access
 * bypass.
 */
export async function POST(request: Request) {
  const syntheticWorkspaceCreationEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.KLINIKOS_SYNTHETIC_WORKSPACE_CREATION === "true";

  if (!syntheticWorkspaceCreationEnabled) {
    return NextResponse.json(
      {
        error:
          "Direct workspace creation is not available. Start with the Klinikos Clinic Operating Analysis or use an approved activation link.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Synthetic workspace creation requires PostgreSQL. Connect DATABASE_URL and try again." },
      { status: 503 },
    );
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
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: "/dashboard?onboarding=synthetic-demo",
        organizationId: workspace.identity.organizationId,
        organizationSlug: workspace.identity.organizationSlug,
        trialEndsAt: workspace.trialEndsAt.toISOString(),
        mode: "synthetic-data-only",
        productionAccessActivated: false,
      },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof OnboardingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Synthetic workspace creation is temporarily unavailable." }, { status: 503 });
  }
}
