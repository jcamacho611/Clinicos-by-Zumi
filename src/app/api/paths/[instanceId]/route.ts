import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getPathSnapshot } from "@/lib/orchestration/path-persistence-repository";

export async function GET(request: Request, { params }: { params: Promise<{ instanceId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "read", { request });
  if (denied) return denied;

  try {
    const { instanceId } = await params;
    const snapshot = await getPathSnapshot(session, instanceId);
    if (!snapshot) return NextResponse.json({ error: "Klinikos Path not found." }, { status: 404 });
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
