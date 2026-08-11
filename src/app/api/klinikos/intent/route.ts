import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth/session";
import { resolveIdentityContextForSession } from "@/lib/identity/context";
import { resolveIntent } from "@/lib/intelligence/intent-router";

export async function POST(request: NextRequest) {
  const session = await requireClinicSession();
  const context = await resolveIdentityContextForSession(session);
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "A routing message is required." }, { status: 400 });
  }

  const resolution = resolveIntent({ message, roles: context.activeRoles });

  return NextResponse.json({
    ...resolution,
    identityId: context.identityId,
    activeMembershipId: context.activeMembershipId ?? null,
    activeOrganizationId: context.activeOrganizationId ?? null,
  });
}
