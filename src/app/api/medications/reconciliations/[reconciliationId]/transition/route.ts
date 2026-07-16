import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionMedicationReconciliation } from "@/lib/repositories/medication-repository";

export async function POST(request: Request, { params }: { params: Promise<{ reconciliationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "medications", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { reconciliationId } = await params;
    return NextResponse.json({ data: await transitionMedicationReconciliation(session, reconciliationId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
