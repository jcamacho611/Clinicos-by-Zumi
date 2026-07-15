import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getDocumentContent } from "@/lib/repositories/document-repository";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const intentValue = new URL(request.url).searchParams.get("intent") ?? "preview";
  if (!(["preview", "download", "print"] as const).includes(intentValue as "preview" | "download" | "print")) return NextResponse.json({ error: "Invalid content access intent." }, { status: 400 });
  const intent = intentValue as "preview" | "download" | "print";
  const requiredAction = intent === "download" ? "manage" : intent === "print" ? "update" : "read";
  if (!can(session.role, "documents", requiredAction)) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { documentId } = await params;
    const result = await getDocumentContent(session, documentId, intent);
    const inline = intent === "download" ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(result.content), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": result.mimeType,
        "Content-Disposition": `${inline}; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "X-ClinicOS-Checksum-SHA256": result.checksumSha256 ?? "verified",
        "X-ClinicOS-Document-Intent": intent,
      },
    });
  } catch (error) { return networkAccessErrorResponse(error); }
}
