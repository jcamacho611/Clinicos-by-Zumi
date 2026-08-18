import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getLuxeAcquisitionOperations } from "@/lib/repositories/luxe-acquisition-analytics-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "crm", "read");
  if (denied) return denied;
  try {
    return NextResponse.json(
      { data: await getLuxeAcquisitionOperations(session) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
