import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { getPatientsForOrganization } from "@/lib/clinic-data";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "patients", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const patients = getPatientsForOrganization(session.organizationId);
  return NextResponse.json({
    data: patients,
    organizationId: session.organizationId,
    mode: "organization-scoped-demo-data",
    count: patients.length,
  });
}
