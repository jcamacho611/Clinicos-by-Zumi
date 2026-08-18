import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordManualLuxePaymentEvidence } from "@/lib/repositories/luxe-payment-evidence-repository";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const crmDenied = await enforceApiPermission(session, "crm", "update");
  if (crmDenied) return crmDenied;
  const luxeDenied = await enforceApiPermission(session, "luxe_medi", "manage");
  if (luxeDenied) return luxeDenied;

  const { leadId } = await params;
  try {
    const result = await recordManualLuxePaymentEvidence(session, leadId, await request.json());
    return NextResponse.json({ data: result }, { status: result.inserted ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Payment evidence is invalid.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });
    }
    return networkAccessErrorResponse(error);
  }
}
