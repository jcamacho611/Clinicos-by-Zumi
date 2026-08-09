import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listFoundingProgramForOwner } from "@/lib/repositories/sales-demo-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "read", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listFoundingProgramForOwner(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
