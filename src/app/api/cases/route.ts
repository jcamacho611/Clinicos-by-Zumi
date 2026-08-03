import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createCase, listCaseWorkspace } from "@/lib/repositories/case-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "cases", "read", { request });
  if (denied) return denied;
  try {
    const response = NextResponse.json({ data: await listCaseWorkspace(session) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "cases", "create", { request });
  if (denied) return denied;
  try { return NextResponse.json({ data: await createCase(session, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
