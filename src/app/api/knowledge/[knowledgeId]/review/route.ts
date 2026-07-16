import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewKnowledgeItem } from "@/lib/repositories/knowledge-repository";

export async function POST(request: Request, { params }: { params: Promise<{ knowledgeId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { knowledgeId } = await params; return NextResponse.json({ data: await reviewKnowledgeItem(session, knowledgeId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
