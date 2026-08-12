import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    if (session.role !== "contractor") {
      const denied = await enforceApiPermission(session, "grid", "create", { request });
      if (denied) return denied;
    }
    const { offerId } = await params;
    return NextResponse.json({ data: await createReservationFromAcceptedOffer(session, offerId) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
