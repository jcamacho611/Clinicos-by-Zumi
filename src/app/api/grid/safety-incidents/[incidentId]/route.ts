import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionGridSafetyIncident } from "@/lib/grid/trust-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "settings", "manage", { request });
  if (denied) return denied;

  try {
    const { incidentId } = await params;
    return NextResponse.json({ data: await transitionGridSafetyIncident(session, incidentId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
