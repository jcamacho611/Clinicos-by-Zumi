import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewNavigationDraft } from "@/lib/repositories/patient-navigation-repository";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { draftId } = await params; return NextResponse.json({ data: await reviewNavigationDraft(session, draftId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
