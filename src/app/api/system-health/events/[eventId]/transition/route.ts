import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionReliabilityEvent } from "@/lib/repositories/system-health-repository";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { eventId } = await params;
  const denied = await enforceApiPermission(session, "reliability", "update", { request, resourceId: eventId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionReliabilityEvent(session, eventId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
