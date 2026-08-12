import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { listOperationalActions, runFollowUpSweep } from "@/lib/operations/followup-service";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "tasks", "read", { request });
  if (denied) return denied;

  const actions = await listOperationalActions(session.organizationId);
  return NextResponse.json({ data: { actions } }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "tasks", "create", { request });
  if (denied) return denied;

  const result = await runFollowUpSweep(session.organizationId);
  return NextResponse.json({ data: result }, { headers: NO_STORE });
}
