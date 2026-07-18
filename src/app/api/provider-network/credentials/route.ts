import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createFacilityPrivilege, createProviderCredential, listCredentialingWorkspace } from "@/lib/repositories/credentialing-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "credentialing", "read");
  if (denied) return denied;
  try { return NextResponse.json({ data: await listCredentialingWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "credentialing", "create", { request });
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = body.kind === "facility_privilege" ? await createFacilityPrivilege(session, body) : await createProviderCredential(session, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
