import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionProviderConsultation } from "@/lib/repositories/provider-consultation-repository";

export async function POST(request: Request, { params }: { params: Promise<{ consultationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { consultationId } = await params; return NextResponse.json({ data: await transitionProviderConsultation(session, consultationId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
