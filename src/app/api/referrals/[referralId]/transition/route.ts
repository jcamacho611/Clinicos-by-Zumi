import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";
import { transitionReferral } from "@/lib/repositories/referral-repository";

const pathEventByAction: Partial<Record<string, string>> = {
  mark_ready: "referral.reviewed",
  accept: "network.destination.confirmed",
  close: "referral.closed",
};

export async function POST(request: Request, { params }: { params: Promise<{ referralId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "referrals", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { referralId } = await params;
    const body = await request.json() as { action?: string } & Record<string, unknown>;
    const updated = await transitionReferral(session, referralId, body);
    const eventType = body.action ? pathEventByAction[body.action] : null;
    if (eventType) {
      await recordTrustedPathDomainEvent(session, {
        eventType,
        sourceType: "referral",
        sourceId: referralId,
        metadata: {
          action: body.action,
          status: updated.status,
          destinationType: updated.destinationType,
          assignedTo: updated.assignedTo ?? null,
        },
      });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
