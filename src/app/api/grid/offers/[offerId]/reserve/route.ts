import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "create", { request });
  if (denied) return denied;

  try {
    const { offerId } = await params;
    const reservation = await createReservationFromAcceptedOffer(session, offerId);
    await recordTrustedPathDomainEvent(session, {
      eventType: "grid.reservation.created",
      sourceType: "grid_reservation",
      sourceId: reservation.id,
      metadata: { demandId: reservation.demandId, offerId: reservation.offerId, status: reservation.status },
    });
    return NextResponse.json({ data: reservation }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
