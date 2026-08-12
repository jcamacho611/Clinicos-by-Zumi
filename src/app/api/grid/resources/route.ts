import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createGridResource, listOwnGridResources } from "@/lib/grid/resource-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await listOwnGridResources(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "create", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await createGridResource(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
