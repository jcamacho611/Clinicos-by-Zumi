import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createLuxeWorkspaceAction, listLuxeMediWorkspace } from "@/lib/repositories/luxe-medi-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ data: await listLuxeMediWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ data: await createLuxeWorkspaceAction(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
