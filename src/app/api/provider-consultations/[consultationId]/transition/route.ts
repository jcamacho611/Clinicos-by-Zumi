import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionProviderConsultation } from "@/lib/repositories/provider-consultation-repository";

export async function POST(request: Request, { params }: { params: Promise<{ consultationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { consultationId } = await params;
  const denied = await enforceApiPermission(session, "tasks", "update", { request, resourceId: consultationId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionProviderConsultation(session, consultationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
