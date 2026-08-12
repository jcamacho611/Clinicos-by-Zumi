import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createUniversalReservationFromAcceptedOffer } from "@/lib/grid/universal-reservation-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "create", { request });
  if (denied) return denied;

  try {
    const { offerId } = await params;
    return NextResponse.json({ data: await createUniversalReservationFromAcceptedOffer(session, offerId) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
