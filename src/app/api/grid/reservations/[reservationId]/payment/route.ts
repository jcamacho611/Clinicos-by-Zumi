import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { recordManualGridReservationPayment } from "@/lib/grid/reservation-payment-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ reservationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;

  try {
    const { reservationId } = await params;
    return NextResponse.json({ data: await recordManualGridReservationPayment(session, reservationId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
