import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createSavedGridDemand, listSavedGridDemands } from "@/lib/grid/demand-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "read", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await listSavedGridDemands(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "create", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await createSavedGridDemand(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
