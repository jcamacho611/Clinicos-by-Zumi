import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { listPatientsForOrganization } from "@/lib/repositories/patient-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "patients", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const patients = await listPatientsForOrganization(session.organizationId);
  const response = NextResponse.json({
    data: patients,
    organizationId: session.organizationId,
    mode: "organization-scoped-postgresql",
    count: patients.length,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
