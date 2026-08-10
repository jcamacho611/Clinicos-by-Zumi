import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { patientCreateSchema } from "@/lib/patient-intake-rules";
import { createPatientForOrganization, listPatientsForOrganization } from "@/lib/repositories/patient-repository";

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

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "patients", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const parsed = patientCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Review the patient information." }, { status: 400 });
  }

  try {
    const patient = await createPatientForOrganization(session, parsed.data);
    const response = NextResponse.json({ ok: true, patientId: patient.id, mrn: patient.mrn }, { status: 201 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("POTENTIAL_DUPLICATE:")) {
      return NextResponse.json({ error: "A patient with the same name and date of birth already exists. Review the existing chart before creating another record." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create the patient record." }, { status: 503 });
  }
}
