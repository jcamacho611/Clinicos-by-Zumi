import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal-session";
import {
  buildPatientPortalSnapshot,
  patientPortalSnapshotFilename,
} from "@/lib/portal/patient-portal-snapshot";
import {
  getPortalDashboardForPatient,
  recordPortalAccess,
} from "@/lib/repositories/portal-repository";

export const dynamic = "force-dynamic";

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || undefined;
}

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    const response = NextResponse.json({ error: "Patient portal authentication required." }, { status: 401 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const data = await getPortalDashboardForPatient(session.organizationId, session.patientId);
  if (!data) {
    const response = NextResponse.json({ error: "Patient portal record not found." }, { status: 404 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const exportedAt = new Date();
  const snapshot = buildPatientPortalSnapshot(data, {
    organizationName: session.organizationName,
    exportedAt,
  });

  await recordPortalAccess({
    accountId: session.accountId,
    patientId: session.patientId,
    organizationId: session.organizationId,
    ipAddress: clientAddress(request),
    userAgent: request.headers.get("user-agent") || undefined,
  }, "portal.records_snapshot_exported");

  return new Response(`${JSON.stringify(snapshot, null, 2)}\n`, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${patientPortalSnapshotFilename({ displayName: data.patient.displayName, exportedAt })}"`,
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
