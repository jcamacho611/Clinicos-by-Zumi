import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "escalations", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { const data = await listCareCoordinationWorkspace(session.organizationId, session.userId); return NextResponse.json({ data: { escalations: data.escalations, notifications: data.notifications } }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
