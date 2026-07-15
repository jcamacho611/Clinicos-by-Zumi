import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createReferral, listReferralWorkspace } from "@/lib/repositories/referral-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "referrals", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const data = await listReferralWorkspace(session.organizationId, session.userId);
    const response = NextResponse.json({ data });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "referrals", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    return NextResponse.json({ data: await createReferral(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
