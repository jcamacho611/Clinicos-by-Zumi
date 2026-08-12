import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";
import { createGridAvailability } from "@/lib/repositories/grid-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = can(session.role, "network", "create")
    ? null
    : await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;
  try {
    const created = await createGridAvailability(session, await request.json());
    await recordTrustedPathDomainEvent(session, {
      eventType: "grid.availability.updated",
      sourceType: "grid_availability",
      sourceId: created.id,
      metadata: { providerId: created.providerId, status: created.status },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
