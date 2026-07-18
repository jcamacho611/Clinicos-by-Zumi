import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { correctKnowledgeItem } from "@/lib/repositories/knowledge-repository";

export async function POST(request: Request, { params }: { params: Promise<{ knowledgeId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { knowledgeId } = await params;
  const denied = await enforceApiPermission(session, "knowledge", "update", { request, resourceId: knowledgeId });
  if (denied) return denied;
  try { return NextResponse.json({ data: await correctKnowledgeItem(session, knowledgeId, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
