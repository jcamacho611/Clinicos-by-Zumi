import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { enforceGridMarketplaceAccessAny } from "@/lib/commerce/grid-access-guard";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionGridRequest } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { requestId } = await params;
  const denied = can(session.role, "network", "update")
    ? null
    : await enforceApiPermission(session, "grid", "update", { request, resourceId: requestId });
  if (denied) return denied;
  // Either side of a request drives it: the requesting clinic or the receiving provider.
  const marketplaceDenied = await enforceGridMarketplaceAccessAny(session, ["receive_request", "send_request"]);
  if (marketplaceDenied) return marketplaceDenied;
  try {
    return NextResponse.json({ data: await transitionGridRequest(session, requestId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
