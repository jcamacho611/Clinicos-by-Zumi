import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewCopilotRun } from "@/lib/repositories/copilot-repository";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { runId } = await params;
  const denied = await enforceApiPermission(session, "ai", "update", { request, resourceId: runId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await reviewCopilotRun(session, runId, await request.json()) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
