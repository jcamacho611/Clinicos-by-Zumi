import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { buildCasePacketPdf } from "@/lib/case-packet-pdf";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordCasePacketExport } from "@/lib/repositories/case-repository";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ caseType: string; caseId: string; packetId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { caseType, caseId, packetId } = await params;
  const denied = await enforceApiPermission(session, "cases", "update", { request, resourceId: caseId });
  if (denied) return denied;
  try {
    const { room, packet } = await recordCasePacketExport(session, caseType, caseId, packetId);
    const content = await buildCasePacketPdf({ organizationName: session.organizationName, room, packet });
    const checksum = createHash("sha256").update(content).digest("hex");
    const fileName = `${caseType}-${room.case.claimNumber}-${packet.type}-manual.pdf`.replace(/[^a-zA-Z0-9._-]/g, "-");
    return new NextResponse(new Uint8Array(content), { headers: { "Cache-Control": "private, no-store", "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`, "X-Content-Type-Options": "nosniff", "X-ClinicOS-Checksum-SHA256": checksum, "X-ClinicOS-Transmission-Status": "manual-fallback-not-transmitted" } });
  } catch (error) { return networkAccessErrorResponse(error); }
}
