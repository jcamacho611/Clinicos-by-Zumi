import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { listGridFinancialObligations } from "@/lib/grid/financial-obligation-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listGridFinancialObligations(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
