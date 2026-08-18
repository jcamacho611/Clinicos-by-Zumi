import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { recordInsuranceVerificationSchema } from "@/lib/insurance-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordManualInsuranceVerification } from "@/lib/repositories/insurance-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "insurance", "create", { request });
  if (denied) return denied;

  const parsed = recordInsuranceVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter valid insurance verification evidence, source, and benefit values." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const data = await recordManualInsuranceVerification(session, parsed.data);
    return NextResponse.json(
      { data, electronicVerification: false },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
