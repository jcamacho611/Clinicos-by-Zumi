import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getDocumentContent } from "@/lib/repositories/document-repository";
import { getLockedFormDocumentId } from "@/lib/repositories/form-repository";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "read") || !can(session.role, "documents", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const intent = new URL(request.url).searchParams.get("intent") === "download" ? "download" : "preview";
    if (intent === "download" && !can(session.role, "documents", "manage")) return NextResponse.json({ error: "Download permission is required." }, { status: 403 });
    const documentId = await getLockedFormDocumentId(session, (await params).submissionId);
    const result = await getDocumentContent(session, documentId, intent);
    return new NextResponse(new Uint8Array(result.content), { headers: { "Cache-Control": "private, no-store", "Content-Type": "application/pdf", "Content-Disposition": `${intent === "download" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(result.fileName)}`, "X-Content-Type-Options": "nosniff", "X-ClinicOS-Checksum-SHA256": result.checksumSha256 ?? "verified" } });
  } catch (error) { return networkAccessErrorResponse(error); }
}
