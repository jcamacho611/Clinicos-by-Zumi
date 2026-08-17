import { NextResponse } from "next/server";
import { createAppointmentSchema } from "@/lib/appointment-create-rules";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { createAppointmentForOrganization } from "@/lib/repositories/appointment-creation-repository";
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

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "appointments", "create", { request });
  if (denied) return denied;

  const parsed = createAppointmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a patient and valid appointment date and time." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const result = await createAppointmentForOrganization({
      organizationId: session.organizationId,
      fields: parsed.data,
      actor: { userId: session.userId, name: session.name, ...requestMetadata(request) },
    });

    if (result.kind === "patient_not_found") return NextResponse.json({ error: "That patient is no longer available in this organization." }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    if (result.kind === "provider_not_found") return NextResponse.json({ error: "That provider is no longer available in this organization." }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    if (result.kind === "location_not_found") return NextResponse.json({ error: "That location is no longer available in this organization." }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    if (result.kind === "appointment_type_not_found") return NextResponse.json({ error: "That appointment type is no longer available in this organization." }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    if (result.kind === "invalid_time" || result.kind === "invalid_duration") return NextResponse.json({ error: "The appointment time or configured duration is invalid." }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    if (result.kind === "schedule_conflict") {
      const reason = result.reason === "patient"
        ? "This patient already has an overlapping appointment."
        : result.reason === "provider"
          ? "This provider already has an overlapping appointment."
          : result.reason === "patient_and_provider"
            ? "This patient and provider already have an overlapping appointment."
            : "The schedule changed while this appointment was being created. Review the calendar and try again.";
      return NextResponse.json({ error: reason }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json(
      { ok: true, appointment: result.appointment },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The appointment could not be created." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
