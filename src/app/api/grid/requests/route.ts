import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { assertGridEligibilityForNewRequest } from "@/lib/grid/eligibility-enforcement";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createGridRequest } from "@/lib/repositories/grid-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "network", "create", { request });
  if (denied) return denied;
  try {
    const body = await request.json();
    await assertGridEligibilityForNewRequest(session, body);
    return NextResponse.json({ data: await createGridRequest(session, body) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
