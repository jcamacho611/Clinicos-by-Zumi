import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionCareTeamRoom } from "@/lib/repositories/care-team-repository";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { roomId } = await params;
  const denied = await enforceApiPermission(session, "care_teams", "manage", { request, resourceId: roomId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionCareTeamRoom(session, roomId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
