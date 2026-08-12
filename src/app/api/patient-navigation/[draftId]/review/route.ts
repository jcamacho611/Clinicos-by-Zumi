import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";
import { reviewNavigationDraft } from "@/lib/repositories/patient-navigation-repository";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { draftId } = await params;
  const denied = await enforceApiPermission(session, "tasks", "update", { request, resourceId: draftId });
  if (denied) return denied;

  try {
    const body = await request.json() as { decision?: string; notes?: string };
    const updated = await reviewNavigationDraft(session, draftId, body);
    if (body.decision === "approve" && updated.status === "approved_for_handoff") {
      await recordTrustedPathDomainEvent(session, {
        eventType: "patient.navigation.reviewed",
        sourceType: "patient_navigation_draft",
        sourceId: draftId,
        metadata: { status: updated.status },
      });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
