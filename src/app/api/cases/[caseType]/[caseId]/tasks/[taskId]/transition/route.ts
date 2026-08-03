import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionCaseTask } from "@/lib/repositories/case-repository";

export async function POST(request: Request, { params }: { params: Promise<{ caseType: string; caseId: string; taskId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { caseType, caseId, taskId } = await params;
  const denied = await enforceApiPermission(session, "cases", "update", { request, resourceId: caseId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionCaseTask(session, caseType, caseId, taskId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
