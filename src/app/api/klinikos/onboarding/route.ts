import { NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth/session";
import { loadKlinikosOnboardingState } from "@/lib/onboarding/klinikos-onboarding";

export async function GET() {
  const session = await requireClinicSession();
  const state = await loadKlinikosOnboardingState(session);
  return NextResponse.json(state);
}
