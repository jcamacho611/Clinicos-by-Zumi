import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionCareHandoff } from "@/lib/repositories/care-coordination-repository";

export async function POST(request: Request, { params }: { params: Promise<{ handoffId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "update", { request, resourceId: (await params).handoffId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionCareHandoff(session, (await params).handoffId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
