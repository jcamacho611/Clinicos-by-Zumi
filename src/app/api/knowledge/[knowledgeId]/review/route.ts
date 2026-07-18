import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewKnowledgeItem } from "@/lib/repositories/knowledge-repository";

export async function POST(request: Request, { params }: { params: Promise<{ knowledgeId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { knowledgeId } = await params;
  const denied = await enforceApiPermission(session, "knowledge", "manage", { request, resourceId: knowledgeId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await reviewKnowledgeItem(session, knowledgeId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
