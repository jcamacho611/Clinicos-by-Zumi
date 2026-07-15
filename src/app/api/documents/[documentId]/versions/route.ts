import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { parseDocumentVersionRequest } from "@/lib/document-http";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createDocumentVersion } from "@/lib/repositories/document-repository";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "documents", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { documentId } = await params;
    const { metadata, file } = await parseDocumentVersionRequest(request);
    return NextResponse.json({ data: await createDocumentVersion(session, documentId, metadata, file) }, { status: 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
