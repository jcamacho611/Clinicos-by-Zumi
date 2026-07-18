import { NextResponse } from "next/server";
import { encounterCodingSchema } from "@/lib/encounter-authoring-rules";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { replaceEncounterCodingForOrganization } from "@/lib/repositories/encounter-repository";

export async function PUT(request: Request, { params }: { params: Promise<{ encounterId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "encounters", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const parsed = encounterCodingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "The coding entries are invalid." }, { status: 400 });
  const { encounterId } = await params;
  try {
    const result = await replaceEncounterCodingForOrganization({ encounterId, organizationId: session.organizationId, fields: parsed.data, actor: { userId: session.userId, name: session.name, ...requestMetadata(request) } });
    if (result.kind === "not_found") return NextResponse.json({ error: "Encounter not found." }, { status: 404 });
    if (result.kind === "locked") return NextResponse.json({ error: "Coding cannot change after provider review begins." }, { status: 409 });
    return NextResponse.json({ ok: true, encounter: result.encounter });
  } catch {
    return NextResponse.json({ error: "Encounter coding could not be saved." }, { status: 503 });
  }
}
