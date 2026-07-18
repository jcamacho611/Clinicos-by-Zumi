import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getClinicSession } from "@/lib/auth/session";
import { createEncounterSchema } from "@/lib/encounter-authoring-rules";
import { createEncounterForOrganization, listEncountersForOrganization } from "@/lib/repositories/encounter-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "encounters", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const encounters = await listEncountersForOrganization(session.organizationId);
    const response = NextResponse.json({
      data: encounters,
      organizationId: session.organizationId,
      count: encounters.length,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Encounter data is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "encounters", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const parsed = createEncounterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "The encounter is invalid." }, { status: 400 });
  try {
    const result = await createEncounterForOrganization({ organizationId: session.organizationId, fields: parsed.data, actor: { userId: session.userId, name: session.name, ...requestMetadata(request) } });
    if (result.kind === "patient_not_found") return NextResponse.json({ error: "Patient not found in this organization." }, { status: 404 });
    if (result.kind === "provider_not_found") return NextResponse.json({ error: "Provider not found in this organization." }, { status: 404 });
    if (result.kind === "location_not_found") return NextResponse.json({ error: "Location not found in this organization." }, { status: 404 });
    if (result.kind === "appointment_not_found") return NextResponse.json({ error: "Appointment not found for this patient." }, { status: 404 });
    if (result.kind === "appointment_used") return NextResponse.json({ error: "This appointment already has an encounter." }, { status: 409 });
    return NextResponse.json({ ok: true, encounter: result.encounter }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The encounter could not be created." }, { status: 503 });
  }
}
