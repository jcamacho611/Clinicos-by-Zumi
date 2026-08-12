import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createGridOffer, listGridOffers } from "@/lib/grid/offer-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await listGridOffers(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    if (session.role !== "contractor") {
      const denied = await enforceApiPermission(session, "grid", "create", { request });
      if (denied) return denied;
    }
    const created = await createGridOffer(session, await request.json());
    await recordTrustedPathDomainEvent(session, {
      eventType: "grid.offer.sent",
      sourceType: "grid_offer",
      sourceId: created.id,
      metadata: { demandId: created.demandId, status: created.status },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
