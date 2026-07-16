import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionLuxeTreatmentPlan } from "@/lib/repositories/luxe-medi-repository";

export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const { planId } = await params;
    return NextResponse.json({ data: await transitionLuxeTreatmentPlan(session, planId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
