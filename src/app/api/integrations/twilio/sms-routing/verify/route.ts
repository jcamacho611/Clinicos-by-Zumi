import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { verifyAndRecordTwilioSmsRouting } from "@/lib/communications/twilio-integration";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "integrations", "manage", { request, resourceId: "twilio:sms-routing:verify" });
  if (denied) return denied;

  const originDecision = evaluateSameOriginMutation(request);
  if (!originDecision.allowed) {
    return NextResponse.json({ error: "Cross-origin mutation blocked." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }

  const result = await verifyAndRecordTwilioSmsRouting({ organizationId: session.organizationId, actorId: session.userId });
  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : result.reason === "provider_error" ? 502 : 400;
    return NextResponse.json({ error: result.detail, reason: result.reason }, { status, headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json({
    data: {
      routing: result.routing,
      providerRoutingVerified: true,
      productionSendingAuthorized: false,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
