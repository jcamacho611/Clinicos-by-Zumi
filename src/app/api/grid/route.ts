import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listGridWorkspace } from "@/lib/repositories/grid-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = can(session.role, "network", "read") || can(session.role, "credentialing", "read")
    ? null
    : await enforceApiPermission(session, "grid", "read");
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listGridWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
