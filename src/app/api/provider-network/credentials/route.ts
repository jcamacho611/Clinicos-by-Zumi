import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createFacilityPrivilege, createProviderCredential, listCredentialingWorkspace } from "@/lib/repositories/credentialing-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await listCredentialingWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json();
    const data = body.kind === "facility_privilege" ? await createFacilityPrivilege(session, body) : await createProviderCredential(session, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
