import { NextResponse } from "next/server";
import { encounterAddendumSchema } from "@/lib/encounter-authoring-rules";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { createEncounterAddendumForOrganization } from "@/lib/repositories/encounter-repository";

export async function POST(request: Request, { params }: { params: Promise<{ encounterId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "encounters", "sign")) return NextResponse.json({ error: "Provider signing permission is required." }, { status: 403 });
  const parsed = encounterAddendumSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "The addendum is invalid." }, { status: 400 });
  const { encounterId } = await params;
  try {
    const result = await createEncounterAddendumForOrganization({ encounterId, organizationId: session.organizationId, fields: parsed.data, actor: { userId: session.userId, name: session.name, ...requestMetadata(request) } });
    if (result.kind === "not_found") return NextResponse.json({ error: "Encounter not found." }, { status: 404 });
    if (result.kind === "not_locked") return NextResponse.json({ error: "Addenda are available only after the original note is signed and locked." }, { status: 409 });
    return NextResponse.json({ ok: true, encounter: result.encounter }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The addendum could not be signed." }, { status: 503 });
  }
}
