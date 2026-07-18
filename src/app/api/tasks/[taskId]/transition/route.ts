import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionTask } from "@/lib/repositories/care-coordination-repository";

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { taskId } = await params;
  const denied = await enforceApiPermission(session, "tasks", "update", { request, resourceId: taskId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionTask(session, taskId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
