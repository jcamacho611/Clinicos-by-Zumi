import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createClinicSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { clinicActivationDraftSchema, clinicActivationSchema } from "@/lib/commercial/clinic-activation-rules";
import { saveClinicActivationDraft } from "@/lib/commercial/clinic-activation-draft";
import { ClinicProvisioningError, completeClinicActivation } from "@/lib/commercial/clinic-provisioning";
import { OnboardingError } from "@/lib/repositories/onboarding-repository";

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Clinic activation requires PostgreSQL." }, { status: 503 });
  const parsed = clinicActivationDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Onboarding progress is invalid." }, { status: 400 });

  try {
    const { token, ...draft } = parsed.data;
    const result = await saveClinicActivationDraft(token, draft);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ClinicProvisioningError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Onboarding progress is invalid." }, { status: 400 });
    return NextResponse.json({ error: "Onboarding progress could not be saved." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Clinic activation requires PostgreSQL." }, { status: 503 });
  const parsed = clinicActivationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Activation details are invalid." }, { status: 400 });

  try {
    const metadata = requestMetadata(request);
    const workspace = await completeClinicActivation(parsed.data, metadata);
    const { token } = await createClinicSession(workspace.identity, metadata);
    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard?onboarding=complete", mode: "paid-workspace", productionPhiApproved: false });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof ClinicProvisioningError || error instanceof OnboardingError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Activation details are invalid." }, { status: 400 });
    return NextResponse.json({ error: "Clinic activation is temporarily unavailable." }, { status: 503 });
  }
}
