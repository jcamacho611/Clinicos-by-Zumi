import { NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth/session";
import { resolveIdentityContextForSession } from "@/lib/identity/context";
import { workspaceChoices } from "@/lib/identity/workspace-routing";

export async function GET() {
  const session = await requireClinicSession();
  const context = await resolveIdentityContextForSession(session);

  return NextResponse.json({
    identity: {
      identityId: context.identityId,
      email: context.email,
      activeMembershipId: context.activeMembershipId ?? null,
      activeOrganizationId: context.activeOrganizationId ?? null,
      activeRoles: context.activeRoles,
    },
    memberships: context.memberships,
    workspaces: workspaceChoices(context.activeRoles),
  });
}
