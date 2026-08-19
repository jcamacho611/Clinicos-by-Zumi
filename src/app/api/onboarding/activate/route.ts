import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { clinicActivationDraftSchema, clinicActivationSchema } from "@/lib/commercial/clinic-activation-rules";
import { saveClinicActivationDraft } from "@/lib/commercial/clinic-activation-draft";
import { ClinicProvisioningError, completeClinicActivation } from "@/lib/commercial/clinic-provisioning";
import { OnboardingError } from "@/lib/repositories/onboarding-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

function activationError(status: number) {
  if (status === 401) return "Authentication required.";
  if (status === 403) return "Access denied.";
  if (status === 404) return "This activation link is no longer available.";
  if (status === 409) return "This activation has already changed. Refresh or sign in and try again.";
  if (status === 410) return "This activation link has expired. Ask Klinikos to issue a new one.";
  if (status >= 500) return "Clinic activation is temporarily unavailable.";
  return "The activation information is invalid or unavailable.";
}

export async function PATCH(request: Request) {
  // Infrastructure topology/configuration is not a public diagnostic surface.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Clinic activation is temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }
  const parsed = clinicActivationDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Onboarding progress is invalid." }, { status: 400, headers: NO_STORE });
  }

  try {
    const { token, ...draft } = parsed.data;
    const result = await saveClinicActivationDraft(token, draft);
    return NextResponse.json({ ok: true, savedAt: result.savedAt }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ClinicProvisioningError) {
      return NextResponse.json({ error: activationError(error.status) }, { status: error.status, headers: NO_STORE });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Onboarding progress is invalid." }, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Onboarding progress could not be saved." }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Clinic activation is temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }
  const parsed = clinicActivationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Activation details are invalid." }, { status: 400, headers: NO_STORE });
  }

  try {
    const metadata = requestMetadata(request);
    const workspace = await completeClinicActivation(parsed.data, metadata);
    const { token } = await createClinicSession(workspace.identity, metadata);
    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard?onboarding=complete" }, { headers: NO_STORE });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof ClinicProvisioningError || error instanceof OnboardingError) {
      return NextResponse.json({ error: activationError(error.status) }, { status: error.status, headers: NO_STORE });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Activation details are invalid." }, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Clinic activation is temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }
}
