import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionEscalation } from "@/lib/repositories/care-coordination-repository";

export async function POST(request: Request, { params }: { params: Promise<{ escalationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await transitionEscalation(session, (await params).escalationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
