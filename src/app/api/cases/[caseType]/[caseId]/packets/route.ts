import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createCasePacket } from "@/lib/repositories/case-repository";

export async function POST(request: Request, { params }: { params: Promise<{ caseType: string; caseId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { caseType, caseId } = await params;
  const denied = await enforceApiPermission(session, "cases", "update", { request, resourceId: caseId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await createCasePacket(session, caseType, caseId, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
