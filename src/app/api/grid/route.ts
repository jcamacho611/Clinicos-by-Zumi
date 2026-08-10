import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { gridAccessContext } from "@/lib/commerce/grid-access-guard";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listGridWorkspace } from "@/lib/repositories/grid-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = can(session.role, "network", "read") || can(session.role, "credentialing", "read")
    ? null
    : await enforceApiPermission(session, "grid", "read");
  if (denied) return denied;
  try {
    // Reading the workspace stays open to authorized roles; the access summary tells
    // the interface which marketplace actions the API would currently accept, so it
    // never offers an action that the guard would reject.
    const [data, access] = await Promise.all([listGridWorkspace(session), gridAccessContext(session)]);
    return NextResponse.json(
      {
        data,
        marketplaceAccess: {
          tierKey: access.tierKey,
          credentialReviewComplete: access.providerReady,
          ...access.summary,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
