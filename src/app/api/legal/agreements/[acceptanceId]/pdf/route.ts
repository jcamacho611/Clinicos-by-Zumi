import { NextResponse } from "next/server";
import { getAuthenticationSession } from "@/lib/auth/session";
import { getUserLegalAcceptance, recordLegalEvidenceEvent } from "@/lib/legal/legal-access";
import { renderSignedAgreementPdf } from "@/lib/legal/agreement-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ acceptanceId: string }> },
) {
  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  const { acceptanceId } = await params;
  const record = await getUserLegalAcceptance(session, acceptanceId).catch(() => null);
  if (!record) {
    return NextResponse.json({ error: "Signed agreement not found." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const bytes = await renderSignedAgreementPdf(record);
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

    if (record.documentSha256) {
      await recordLegalEvidenceEvent({
        session,
        eventType: "legal.agreement.copy_downloaded",
        documentKey: record.documentKey,
        documentVersion: record.documentVersion,
        documentSha256: record.documentSha256,
        acceptanceId: record.id,
        metadata: { artifact: "signed_pdf" },
      }).catch(() => undefined);
    }

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="klinikos-agreement-${record.documentVersion}-${record.id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Signed agreement copy is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
