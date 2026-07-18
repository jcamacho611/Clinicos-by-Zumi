import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionLead } from "@/lib/repositories/crm-repository";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { leadId } = await params;
  const denied = await enforceApiPermission(session, "crm", "update", { request, resourceId: leadId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionLead(session, leadId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
