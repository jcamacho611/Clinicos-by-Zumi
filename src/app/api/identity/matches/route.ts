import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listIdentityWorkspace, scanForPatientMatches } from "@/lib/repositories/patient-identity-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "identity", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const workspace = await listIdentityWorkspace(session.organizationId);
    const response = NextResponse.json({ data: workspace.matches, count: workspace.matches.length });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "identity", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    return NextResponse.json({ data: await scanForPatientMatches(session) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
