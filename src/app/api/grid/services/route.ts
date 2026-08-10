import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { enforceGridMarketplaceAccess } from "@/lib/commerce/grid-access-guard";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createGridServiceListing } from "@/lib/repositories/grid-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "create", { request });
  if (denied) return denied;
  const marketplaceDenied = await enforceGridMarketplaceAccess(session, "publish_listing");
  if (marketplaceDenied) return marketplaceDenied;
  try {
    return NextResponse.json({ data: await createGridServiceListing(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
