import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { listEncountersForOrganization } from "@/lib/repositories/encounter-repository";

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
