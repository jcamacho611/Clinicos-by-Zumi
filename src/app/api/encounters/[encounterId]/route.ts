import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { saveEncounterDraftForOrganization } from "@/lib/repositories/encounter-repository";

const optionalNoteField = z.string().trim().max(20_000).optional();
const draftSchema = z.object({
  chiefComplaint: optionalNoteField,
  hpi: optionalNoteField,
  subjective: optionalNoteField,
  objective: optionalNoteField,
  assessment: optionalNoteField,
  plan: optionalNoteField,
  patientInstructions: optionalNoteField,
  followUp: optionalNoteField,
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "At least one field is required.",
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> },
) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "encounters", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const parsed = draftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The encounter draft is invalid." }, { status: 400 });
  const { encounterId } = await params;

  try {
    const result = await saveEncounterDraftForOrganization({
      encounterId,
      organizationId: session.organizationId,
      fields: parsed.data,
      actor: { userId: session.userId, name: session.name, ...requestMetadata(request) },
    });

    if (result.kind === "not_found") return NextResponse.json({ error: "Encounter not found." }, { status: 404 });
    if (result.kind === "locked") return NextResponse.json({ error: "Signed or reviewed encounters cannot be edited." }, { status: 409 });
    if (result.kind === "conflict") return NextResponse.json({ error: "The encounter changed. Refresh and try again." }, { status: 409 });

    return NextResponse.json({ ok: true, encounter: result.encounter });
  } catch {
    return NextResponse.json({ error: "The encounter could not be saved." }, { status: 503 });
  }
}
