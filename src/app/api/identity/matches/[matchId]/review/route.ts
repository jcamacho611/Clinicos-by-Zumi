import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewPatientMatch } from "@/lib/repositories/patient-identity-repository";

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "identity", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { matchId } = await params;
    return NextResponse.json({ data: await reviewPatientMatch(session, matchId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
