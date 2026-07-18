import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionLuxeTreatmentSession } from "@/lib/repositories/luxe-medi-repository";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { sessionId } = await params;
  const denied = await enforceApiPermission(session, "luxe_medi", "update", { request, resourceId: sessionId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await transitionLuxeTreatmentSession(session, sessionId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
