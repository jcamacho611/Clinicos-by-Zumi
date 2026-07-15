import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionReferral } from "@/lib/repositories/referral-repository";

export async function POST(request: Request, { params }: { params: Promise<{ referralId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "referrals", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { referralId } = await params;
    return NextResponse.json({ data: await transitionReferral(session, referralId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
