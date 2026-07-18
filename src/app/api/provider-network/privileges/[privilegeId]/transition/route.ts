import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionFacilityPrivilege } from "@/lib/repositories/credentialing-repository";

export async function POST(request: Request, { params }: { params: Promise<{ privilegeId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { privilegeId } = await params;
  const denied = await enforceApiPermission(session, "credentialing", "update", { request, resourceId: privilegeId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await transitionFacilityPrivilege(session, privilegeId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
