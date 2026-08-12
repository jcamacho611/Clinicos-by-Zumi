import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionGridOffer } from "@/lib/grid/offer-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";

export async function PATCH(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "update", { request });
  if (denied) return denied;

  try {
    const { offerId } = await params;
    const body = await request.json();
    const updated = await transitionGridOffer(session, offerId, body);
    if (body?.targetStatus === "accepted") {
      await recordTrustedPathDomainEvent(session, {
        eventType: "grid.offer.accepted",
        sourceType: "grid_offer",
        sourceId: offerId,
        metadata: { demandId: updated.demandId, status: updated.status },
      });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
