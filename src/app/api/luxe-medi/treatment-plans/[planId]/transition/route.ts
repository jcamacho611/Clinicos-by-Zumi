import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionLuxeTreatmentPlan } from "@/lib/repositories/luxe-medi-repository";

export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { planId } = await params;
  const denied = await enforceApiPermission(session, "luxe_medi", "update", { request, resourceId: planId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await transitionLuxeTreatmentPlan(session, planId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
