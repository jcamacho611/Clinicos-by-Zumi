import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { claimLuxeLead } from "@/lib/repositories/luxe-lead-ownership-repository";

export async function POST(_request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const crmDenied = await enforceApiPermission(session, "crm", "update");
  if (crmDenied) return crmDenied;
  const luxeDenied = await enforceApiPermission(session, "luxe_medi", "update");
  if (luxeDenied) return luxeDenied;

  const { leadId } = await params;
  try {
    return NextResponse.json({ data: await claimLuxeLead(session, leadId) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
