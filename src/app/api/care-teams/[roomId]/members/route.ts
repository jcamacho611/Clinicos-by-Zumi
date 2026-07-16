import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { addCareTeamMember } from "@/lib/repositories/care-team-repository";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { roomId } = await params; return NextResponse.json({ data: await addCareTeamMember(session, roomId, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
