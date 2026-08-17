import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { screenOigLeieByNpi } from "@/lib/connectors/oig-leie";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request, { params }: { params: Promise<{ npi: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "credentialing", "read", { request });
  if (denied) return denied;

  try {
    const { npi } = await params;
    const data = await screenOigLeieByNpi(npi);
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "credentialing.oig_leie_screening",
        resourceType: "public_exclusion_screening",
        resourceId: data.queryNpi,
        metadata: {
          source: data.source,
          possibleMatchCount: data.possibleMatches.length,
          sourceUpdatedAt: data.sourceUpdatedAt,
          finalVerification: false,
          exclusionClearance: false,
          credentialAuthority: false,
        },
      },
    });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
