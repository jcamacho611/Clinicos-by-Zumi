import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionGridFulfillment } from "@/lib/grid/fulfillment-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";

export async function PATCH(request: Request, { params }: { params: Promise<{ reservationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "update", { request });
  if (denied) return denied;

  try {
    const { reservationId } = await params;
    const body = await request.json() as { targetStatus?: string };
    const updated = await transitionGridFulfillment(session, reservationId, body);
    if (body.targetStatus === "fulfilled") {
      await recordTrustedPathDomainEvent(session, {
        eventType: "grid.fulfillment.fulfilled",
        sourceType: "grid_reservation",
        sourceId: reservationId,
        metadata: { reservationStatus: updated.reservationStatus, fulfillmentStatus: updated.fulfillmentStatus },
      });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
