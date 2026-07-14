import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { canReviewRecordRequests } from "@/lib/network-access-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewRecordRequest } from "@/lib/repositories/network-access-repository";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canReviewRecordRequests(session.role)) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { requestId } = await params;
    const result = await reviewRecordRequest(session, requestId, await request.json());
    return NextResponse.json({ data: result });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
