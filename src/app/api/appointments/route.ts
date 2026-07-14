import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "appointments", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const appointments = await listAppointmentsForOrganization(session.organizationId);
    const response = NextResponse.json({
      data: appointments,
      organizationId: session.organizationId,
      count: appointments.length,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Scheduling data is temporarily unavailable." }, { status: 503 });
  }
}
