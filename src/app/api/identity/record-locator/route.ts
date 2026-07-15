import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { locateMasterPatientRecords } from "@/lib/repositories/patient-identity-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "identity", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const masterPatientId = new URL(request.url).searchParams.get("masterPatientId")?.trim();
  if (!masterPatientId) return NextResponse.json({ error: "masterPatientId is required." }, { status: 400 });

  try {
    const data = await locateMasterPatientRecords(session, masterPatientId);
    const response = NextResponse.json({ data, count: data.length });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
