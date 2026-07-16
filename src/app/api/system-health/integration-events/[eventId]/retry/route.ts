import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { retryIntegrationEvent } from "@/lib/repositories/system-health-repository";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { eventId } = await params; return NextResponse.json({ data: await retryIntegrationEvent(session, eventId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
