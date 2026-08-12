import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { enforceGridMarketplaceAccess } from "@/lib/commerce/grid-access-guard";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createGridAvailability } from "@/lib/repositories/grid-repository";

/**
 * Publish provider availability to the marketplace.
 *
 * Two gates, in order, and both are required. The permission gate asks whether this
 * role may touch GRID at all; the marketplace gate asks whether this account has paid
 * entry. Availability was previously behind only the first — the single ordinary
 * marketplace write that could reach the repository without a pass — so a contractor
 * with a revoked or absent pass could still offer capacity to the network.
 *
 * The `network` bypass that used to sit here is gone with it. A clinical-network
 * permission is not a marketplace permission; conflating them is what let each of these
 * paths disagree with the other about who is allowed in.
 */
export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const denied = await enforceApiPermission(session, "grid", "update", { request });
  if (denied) return denied;

  const gated = await enforceGridMarketplaceAccess(session, "publish_availability");
  if (gated) return gated;

  try {
    return NextResponse.json({ data: await createGridAvailability(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
