import { NextResponse } from "next/server";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getPortalSession } from "@/lib/auth/portal-session";
import { getPortalDashboardForPatient, recordPortalAccess } from "@/lib/repositories/portal-repository";

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Patient portal authentication required." }, { status: 401 });
  try {
    await recordPortalAccess({ accountId: session.accountId, patientId: session.patientId, organizationId: session.organizationId, ...requestMetadata(request) }, "portal.api_viewed");
    const data = await getPortalDashboardForPatient(session.organizationId, session.patientId);
    if (!data) return NextResponse.json({ error: "Portal access is unavailable." }, { status: 403 });
    const response = NextResponse.json({ data, organizationId: session.organizationId, patientId: session.patientId });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Portal data is temporarily unavailable." }, { status: 503 });
  }
}
