import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionGridPayout } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { payoutId } = await params;
  const denied = await enforceApiPermission(session, "grid", "manage", { request, resourceId: payoutId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await transitionGridPayout(session, payoutId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
