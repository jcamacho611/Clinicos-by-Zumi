import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewRemoteObservation } from "@/lib/repositories/remote-monitoring-repository";

export async function POST(request: Request, { params }: { params: Promise<{ observationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { observationId } = await params;
  const denied = await enforceApiPermission(session, "remote_monitoring", "update", { request, resourceId: observationId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await reviewRemoteObservation(session, observationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
