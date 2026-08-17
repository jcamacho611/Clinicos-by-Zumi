import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { lookupNppesByNpi } from "@/lib/connectors/nppes";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request, { params }: { params: Promise<{ npi: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "credentialing", "read", { request });
  if (denied) return denied;

  try {
    const { npi } = await params;
    const data = await lookupNppesByNpi(npi);
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "credentialing.nppes_lookup",
        resourceType: "public_npi_evidence",
        resourceId: data?.npi ?? npi.replace(/\D/g, "").slice(0, 10),
        metadata: {
          source: "CMS NPPES",
          found: Boolean(data),
          credentialAuthority: false,
        },
      },
    });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}