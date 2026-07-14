import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { transitionAppointmentForOrganization } from "@/lib/repositories/appointment-repository";

const requestSchema = z.object({
  status: z.enum([
    "REQUESTED", "PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN", "IN_ROOM",
    "WITH_PROVIDER", "CHECKOUT", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "appointments", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select a valid appointment status." }, { status: 400 });
  const { appointmentId } = await params;

  try {
    const result = await transitionAppointmentForOrganization({
      appointmentId,
      organizationId: session.organizationId,
      targetStatus: parsed.data.status,
      actor: { userId: session.userId, name: session.name, ...requestMetadata(request) },
    });

    if (result.kind === "not_found") return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    if (result.kind === "invalid_transition") {
      return NextResponse.json({ error: `That change is not allowed from ${result.currentStatus}.` }, { status: 409 });
    }
    if (result.kind === "conflict") return NextResponse.json({ error: "The appointment changed. Refresh and try again." }, { status: 409 });

    return NextResponse.json({ ok: true, appointment: result.appointment });
  } catch {
    return NextResponse.json({ error: "The appointment could not be updated." }, { status: 503 });
  }
}
