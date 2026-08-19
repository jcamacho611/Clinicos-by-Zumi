import { NextResponse } from "next/server";
import { checkOnboardingRateLimit, recordOnboardingAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/onboarding-rules";
import { createOrganizationWorkspace, OnboardingError } from "@/lib/repositories/onboarding-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

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
      { error: "Direct workspace creation is not available. Use an approved Klinikos activation path." },
      { status: 403, headers: NO_STORE },
    );
  }

  // Do not disclose deployment/database topology through a browser-facing error.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Synthetic workspace creation is temporarily unavailable." },
      { status: 503, headers: NO_STORE },
    );
  }

  const metadata = requestMetadata(request);
  const rateLimitKey = metadata.ipAddress ?? "unknown";
  const limit = checkOnboardingRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many workspace creation attempts. Try again later." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    recordOnboardingAttempt(rateLimitKey);
    return NextResponse.json({ error: "Review the workspace information and try again." }, { status: 400, headers: NO_STORE });
  }

  try {
    recordOnboardingAttempt(rateLimitKey);
    const workspace = await createOrganizationWorkspace(parsed.data, metadata);
    const { token } = await createClinicSession(workspace.identity, metadata);
    const response = NextResponse.json(
      { ok: true, redirectTo: "/dashboard?onboarding=synthetic-demo" },
      { status: 201, headers: NO_STORE },
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof OnboardingError) {
      const message = error.status === 409
        ? "A workspace with these details already exists."
        : error.status === 403
          ? "Access denied."
          : "Synthetic workspace creation could not be completed.";
      return NextResponse.json({ error: message }, { status: error.status, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Synthetic workspace creation is temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }
}
