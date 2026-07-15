import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { parseDocumentUploadRequest } from "@/lib/document-http";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createDocument, listDocumentWorkspace } from "@/lib/repositories/document-repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "documents", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const response = NextResponse.json({ data: await listDocumentWorkspace(session.organizationId) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "documents", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { metadata, file } = await parseDocumentUploadRequest(request);
    return NextResponse.json({ data: await createDocument(session, metadata, file) }, { status: 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
