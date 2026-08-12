import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { transitionGridOfferWithUniversalResources } from "@/lib/grid/universal-offer-transition";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "update", { request });
  if (denied) return denied;

  try {
    const { offerId } = await params;
    return NextResponse.json({ data: await transitionGridOfferWithUniversalResources(session, offerId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
