import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { configureTwilioSmsRouting, getTwilioSmsRoutingConfig } from "@/lib/communications/twilio-integration";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

const updateSchema = z.object({
  senderPhone: z.string().trim().min(8).max(32),
  messagingServiceSid: z.string().trim().max(80).optional().nullable(),
  inboundEnabled: z.boolean(),
});

function routingView(current: Awaited<ReturnType<typeof getTwilioSmsRoutingConfig>>) {
  const routing = current?.routing ?? null;
  return {
    configured: Boolean(routing),
    status: current?.integrationStatus ?? "not_configured",
    senderPhone: routing?.senderPhone ?? null,
    inboundEnabled: routing?.inboundEnabled ?? false,
    messagingServiceConfigured: Boolean(routing?.messagingServiceSid),
    webhookPath: "/api/webhooks/twilio/sms",
  };
}

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "integrations", "read", { request, resourceId: "twilio:sms-routing" });
  if (denied) return denied;

  const current = await getTwilioSmsRoutingConfig(session.organizationId);
  // Do not expose credential environment names, integration record IDs, actor IDs,
  // configured timestamps, or full Messaging Service identifiers to the browser.
  return NextResponse.json({ data: routingView(current) }, { headers: NO_STORE });
}

export async function PATCH(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "integrations", "manage", { request, resourceId: "twilio:sms-routing" });
  if (denied) return denied;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid SMS routing configuration." }, { status: 400, headers: NO_STORE });

  const result = await configureTwilioSmsRouting({
    organizationId: session.organizationId,
    actorId: session.userId,
    senderPhone: parsed.data.senderPhone,
    messagingServiceSid: parsed.data.messagingServiceSid,
    inboundEnabled: parsed.data.inboundEnabled,
  });

  if (!result.ok) {
    if (result.reason === "sender_already_assigned") {
      return NextResponse.json({ error: "That sender is already assigned to another Klinikos organization." }, { status: 409, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Invalid SMS routing configuration." }, { status: 400, headers: NO_STORE });
  }

  const current = await getTwilioSmsRoutingConfig(session.organizationId);
  return NextResponse.json({ data: routingView(current) }, { headers: NO_STORE });
}
