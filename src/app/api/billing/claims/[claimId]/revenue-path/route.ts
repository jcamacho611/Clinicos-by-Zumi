import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { readRevenueIntegrityPath } from "@/lib/repositories/revenue-integrity-repository";

/**
 * One claim, read as the revenue integrity path.
 *
 * This is the read behind "why hasn't this been paid?" — the ordered progression and the
 * first unresolved stage, so the answer can be rendered as the path rather than narrated
 * as a paragraph.
 *
 * A claim in another organization returns the same 404 as one that does not exist. The
 * repository scopes by tenant inside the lookup, and this route must not turn that into
 * a distinguishable answer: "no such claim" and "not yours" have to be the same reply,
 * or the endpoint becomes a way to test which claim ids are real.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ claimId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const denied = await enforceApiPermission(session, "billing", "read");
  if (denied) return denied;

  try {
    const { claimId } = await params;
    const path = await readRevenueIntegrityPath(session, claimId);
    if (!path) return NextResponse.json({ error: "Claim not found." }, { status: 404 });

    return NextResponse.json({ data: path }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
