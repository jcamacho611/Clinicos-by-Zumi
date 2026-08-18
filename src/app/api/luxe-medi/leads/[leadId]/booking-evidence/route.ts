import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordManualLuxeBookingEvidence } from "@/lib/repositories/luxe-booking-evidence-repository";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const crmDenied = await enforceApiPermission(session, "crm", "update");
  if (crmDenied) return crmDenied;
  const luxeDenied = await enforceApiPermission(session, "luxe_medi", "manage");
  if (luxeDenied) return luxeDenied;

  const { leadId } = await params;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Booking evidence must be valid JSON." }, { status: 400 });
    }
    const result = await recordManualLuxeBookingEvidence(session, leadId, body);
    return NextResponse.json(
      { data: result },
      { status: result.inserted ? 201 : 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Booking evidence is invalid.",
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
        { status: 400 },
      );
    }
    return networkAccessErrorResponse(error);
  }
}
