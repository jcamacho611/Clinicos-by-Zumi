import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createCareTeamRoom, listCareTeamWorkspace } from "@/lib/repositories/care-team-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await listCareTeamWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await createCareTeamRoom(session, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
