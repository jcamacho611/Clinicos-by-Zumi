import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { verifyAndRecordTwilioSmsRouting } from "@/lib/communications/twilio-integration";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "integrations", "manage", { request, resourceId: "twilio:sms-routing:verify" });
  if (denied) return denied;

  const originDecision = evaluateSameOriginMutation(request);
  if (!originDecision.allowed) {
    return NextResponse.json({ error: "Cross-origin mutation blocked." }, { status: 403, headers: NO_STORE });
  }

  const result = await verifyAndRecordTwilioSmsRouting({
    organizationId: session.organizationId,
    actorId: session.userId,
  });
  if (!result.ok) {
    const status = result.reason === "not_configured"
      ? 503
      : result.reason === "provider_error"
        ? 502
        : result.reason === "routing_changed"
          ? 409
          : 400;
    return NextResponse.json({ error: result.detail, reason: result.reason }, { status, headers: NO_STORE });
  }

  return NextResponse.json({
    data: {
      providerRoutingVerified: true,
      productionSendingAuthorized: false,
      senderPhone: result.routing?.senderPhone ?? null,
      timeZone: result.routing?.timeZone ?? null,
      inboundEnabled: result.routing?.inboundEnabled ?? false,
      messagingServiceConfigured: Boolean(result.routing?.messagingServiceSid),
    },
  }, { headers: NO_STORE });
}
