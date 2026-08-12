import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionGridFinancialObligation } from "@/lib/grid/settlement-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ obligationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "settings", "manage", { request });
  if (denied) return denied;
  try {
    const { obligationId } = await params;
    return NextResponse.json({ data: await transitionGridFinancialObligation(session, obligationId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
