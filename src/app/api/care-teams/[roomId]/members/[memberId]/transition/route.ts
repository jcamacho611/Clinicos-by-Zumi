import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionCareTeamMember } from "@/lib/repositories/care-team-repository";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string; memberId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { roomId, memberId } = await params; return NextResponse.json({ data: await transitionCareTeamMember(session, roomId, memberId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
