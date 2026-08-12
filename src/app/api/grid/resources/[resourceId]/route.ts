import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionOwnGridResource } from "@/lib/grid/resource-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;

  try {
    const { resourceId } = await params;
    return NextResponse.json({ data: await transitionOwnGridResource(session, resourceId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
