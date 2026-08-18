import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { patientCreateSchema } from "@/lib/patient-intake-rules";
import { createPatientForOrganization } from "@/lib/repositories/patient-repository";
import { listPatientViewsForSession } from "@/lib/repositories/patient-list-presentation-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "patients", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });

  try {
    const patients = await listPatientViewsForSession(session);
    return NextResponse.json({ data: patients, count: patients.length }, { headers: NO_STORE });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "patients", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });

  const parsed = patientCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Review the patient information and try again." }, { status: 400, headers: NO_STORE });
  }

  try {
    const patient = await createPatientForOrganization(session, parsed.data);
    // The create form needs only the new resource identifier for navigation. MRN and
    // the complete patient record remain available through their governed surfaces.
    return NextResponse.json({ ok: true, patientId: patient.id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("POTENTIAL_DUPLICATE:")) {
      return NextResponse.json(
        { error: "A patient with the same name and date of birth already exists. Review the existing chart before creating another record." },
        { status: 409, headers: NO_STORE },
      );
    }
    return NextResponse.json({ error: "Unable to create the patient record." }, { status: 503, headers: NO_STORE });
  }
}
