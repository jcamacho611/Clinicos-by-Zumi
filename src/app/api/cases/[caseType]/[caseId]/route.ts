import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getCaseRoom, updateCase } from "@/lib/repositories/case-repository";

type Context = { params: Promise<{ caseType: string; caseId: string }> };

export async function GET(request: Request, { params }: Context) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { caseType, caseId } = await params;
  const denied = await enforceApiPermission(session, "cases", "read", { request, resourceId: caseId });
  if (denied) return denied;
  try {
    const response = NextResponse.json({ data: await getCaseRoom(session, caseType, caseId) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) { return networkAccessErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { caseType, caseId } = await params;
  const denied = await enforceApiPermission(session, "cases", "update", { request, resourceId: caseId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await updateCase(session, caseType, caseId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
