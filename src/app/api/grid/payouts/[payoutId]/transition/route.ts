import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { validateGridPayoutSettlement } from "@/lib/grid/transaction-service";
import { transitionGridPayout } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { payoutId } = await params;
  const denied = await enforceApiPermission(session, "grid", "manage", { request, resourceId: payoutId });
  if (denied) return denied;

  try {
    const body = await request.json();

    if (body?.targetStatus === "paid") {
      await validateGridPayoutSettlement({
        payoutId,
        externalReference: body.externalReference ?? null,
      });
    }

    return NextResponse.json({ data: await transitionGridPayout(session, payoutId, body) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
