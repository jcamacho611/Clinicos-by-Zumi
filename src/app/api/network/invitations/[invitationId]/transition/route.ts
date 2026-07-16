import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionNetworkInvitation } from "@/lib/repositories/network-growth-repository";

export async function POST(request: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { invitationId } = await params; return NextResponse.json({ data: await transitionNetworkInvitation(session, invitationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
