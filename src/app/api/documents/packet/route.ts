import { NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { getDocumentPacketContents } from "@/lib/repositories/document-repository";

export const runtime = "nodejs";

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "documents", "manage", { request });
  if (denied) return denied;
  try {
    const packet = await getDocumentPacketContents(session, await request.json());
    const manifest = {
      generatedAt: new Date().toISOString(), organizationId: session.organizationId, generatedBy: session.userId,
      purpose: packet.purpose, documentCount: packet.files.length,
      documents: packet.files.map(({ document }) => ({ id: document.id, name: document.name, version: document.version, checksumSha256: document.checksumSha256, mimeType: document.mimeType })),
    };
    const archive = zipSync(Object.fromEntries([
      ["ClinicOS-document-packet-manifest.json", strToU8(JSON.stringify(manifest, null, 2))],
      ...packet.files.map(({ document, content }, index) => [`${String(index + 1).padStart(2, "0")}-${safeFileName(document.originalFileName)}`, new Uint8Array(content)] as const),
    ]), { level: 6 });
    return new NextResponse(archive, { headers: { "Cache-Control": "private, no-store", "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="ClinicOS-document-packet-${new Date().toISOString().slice(0, 10)}.zip"`, "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return networkAccessErrorResponse(error); }
}
