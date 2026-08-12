import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createGridSafetyIncident, listGridIssuesForReservation } from "@/lib/grid/trust-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request, { params }: { params: Promise<{ reservationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;

  try {
    const { reservationId } = await params;
    const issues = await listGridIssuesForReservation(session, reservationId);
    return NextResponse.json({ data: issues.safetyIncidents });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ reservationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;

  try {
    const { reservationId } = await params;
    return NextResponse.json({ data: await createGridSafetyIncident(session, reservationId, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
