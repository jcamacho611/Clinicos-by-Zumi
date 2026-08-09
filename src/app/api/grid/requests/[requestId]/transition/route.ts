import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionGridRequest } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { requestId } = await params;
  const denied = await enforceApiPermission(session, "network", "update", { request, resourceId: requestId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await transitionGridRequest(session, requestId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
