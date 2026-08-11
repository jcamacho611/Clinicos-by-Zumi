import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { applyOnboarding } from "@/lib/onboarding/onboarding-service";
import { onboardingAnswersSchema } from "@/lib/onboarding/onboarding-rules";

/**
 * Apply clinic setup.
 *
 * Configuring the tenant is an owner/administrator act, so it is gated on
 * `settings:update` rather than mere membership. The organization comes from the
 * session; the body cannot name one.
 */

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "settings", "update")) {
    return NextResponse.json({ error: "Only an owner or administrator can configure the clinic." }, { status: 403, headers: NO_STORE });
  }

  const parsed = onboardingAnswersSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Some answers were not recognised." }, { status: 400, headers: NO_STORE });

  try {
    await applyOnboarding(session.organizationId, parsed.data);
  } catch {
    return NextResponse.json({ error: "Setup could not be saved." }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ data: { configured: true } }, { headers: NO_STORE });
}
