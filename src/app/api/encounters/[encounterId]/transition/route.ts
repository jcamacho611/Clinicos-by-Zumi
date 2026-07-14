import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { transitionEncounterForOrganization } from "@/lib/repositories/encounter-repository";

const transitionSchema = z.object({ transition: z.enum(["ready_for_review", "sign_and_lock"]) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> },
) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = transitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select a valid encounter action." }, { status: 400 });
  const requiredAction = parsed.data.transition === "sign_and_lock" ? "sign" : "update";
  if (!can(session.role, "encounters", requiredAction)) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const { encounterId } = await params;

  try {
    const result = await transitionEncounterForOrganization({
      encounterId,
      organizationId: session.organizationId,
      transition: parsed.data.transition,
      actor: { userId: session.userId, name: session.name, ...requestMetadata(request) },
    });

    if (result.kind === "not_found") return NextResponse.json({ error: "Encounter not found." }, { status: 404 });
    if (result.kind === "invalid_transition") return NextResponse.json({ error: "That encounter action is not available now." }, { status: 409 });
    if (result.kind === "conflict") return NextResponse.json({ error: "The encounter changed. Refresh and try again." }, { status: 409 });
    if (result.kind === "missing_fields") {
      return NextResponse.json({ error: `Complete: ${result.missingFields.join(", ")}.` }, { status: 422 });
    }

    return NextResponse.json({ ok: true, encounter: result.encounter });
  } catch {
    return NextResponse.json({ error: "The encounter status could not be updated." }, { status: 503 });
  }
}
