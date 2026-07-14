import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listPatientAccessHistory } from "@/lib/repositories/network-access-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const patientId = new URL(request.url).searchParams.get("patientId");
    if (!patientId) return NextResponse.json({ error: "patientId is required." }, { status: 400 });
    const history = await listPatientAccessHistory(session.organizationId, patientId);
    const response = NextResponse.json({ data: history, count: history.length });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
