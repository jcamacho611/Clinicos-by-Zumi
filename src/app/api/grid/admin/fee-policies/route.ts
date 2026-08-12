import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createGridFeePolicy, listGridFeePolicies } from "@/lib/grid/fee-policy-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "settings", "manage", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listGridFeePolicies(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "settings", "manage", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await createGridFeePolicy(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
