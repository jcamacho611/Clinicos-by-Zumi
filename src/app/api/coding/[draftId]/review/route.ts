import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewCodingDraft } from "@/lib/repositories/coding-revenue-repository";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { draftId } = await params;
  const denied = await enforceApiPermission(session, "coding", "update", { request, resourceId: draftId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await reviewCodingDraft(session, draftId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
