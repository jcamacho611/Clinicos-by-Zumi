import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createKnowledgeItem, listKnowledgeWorkspace } from "@/lib/repositories/knowledge-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json({ data: await listKnowledgeWorkspace(session, query) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await createKnowledgeItem(session, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
