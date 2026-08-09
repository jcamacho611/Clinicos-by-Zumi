import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionNetworkHandoff } from "@/lib/repositories/network-handoff-repository";

export async function POST(request: Request, { params }: { params: Promise<{ handoffId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { handoffId } = await params;
  const denied = await enforceApiPermission(session, "network", "update", { request, resourceId: handoffId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await transitionNetworkHandoff(session, handoffId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
