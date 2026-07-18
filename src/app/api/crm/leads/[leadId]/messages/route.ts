import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createLeadMessage } from "@/lib/repositories/crm-repository";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { leadId } = await params;
  const denied = await enforceApiPermission(session, "crm", "create", { request, resourceId: leadId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await createLeadMessage(session, leadId, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
