import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listGridWorkspace, updateGridContractorPreferences } from "@/lib/repositories/grid-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read");
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listGridWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await updateGridContractorPreferences(session, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
