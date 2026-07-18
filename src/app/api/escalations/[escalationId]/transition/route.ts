import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionEscalation } from "@/lib/repositories/care-coordination-repository";

export async function POST(request: Request, { params }: { params: Promise<{ escalationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { escalationId } = await params;
  const denied = await enforceApiPermission(session, "escalations", "update", { request, resourceId: escalationId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionEscalation(session, escalationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
