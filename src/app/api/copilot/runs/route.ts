import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createCopilotRun, listCopilotWorkspace } from "@/lib/repositories/copilot-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "ai", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    return NextResponse.json({ data: await listCopilotWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "ai", "create", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await createCopilotRun(session, await request.json()) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
