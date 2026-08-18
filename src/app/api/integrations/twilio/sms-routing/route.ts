import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { configureTwilioSmsRouting, getTwilioSmsRoutingConfig } from "@/lib/communications/twilio-integration";

const updateSchema = z.object({
  senderPhone: z.string().trim().min(8).max(32),
  messagingServiceSid: z.string().trim().max(80).optional().nullable(),
  inboundEnabled: z.boolean(),
});

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "integrations", "read", { request, resourceId: "twilio:sms-routing" });
  if (denied) return denied;

  const current = await getTwilioSmsRoutingConfig(session.organizationId);
  return NextResponse.json({
    data: {
      current,
      webhookPath: "/api/webhooks/twilio/sms",
      requiredServerSecret: "TWILIO_AUTH_TOKEN",
      note: "Routing metadata does not authorize SMS and does not store Twilio credentials. Consent and PHI gates remain separate.",
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "integrations", "manage", { request, resourceId: "twilio:sms-routing" });
  if (denied) return denied;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Twilio SMS routing configuration." }, { status: 400 });

  const result = await configureTwilioSmsRouting({
    organizationId: session.organizationId,
    actorId: session.userId,
    senderPhone: parsed.data.senderPhone,
    messagingServiceSid: parsed.data.messagingServiceSid,
    inboundEnabled: parsed.data.inboundEnabled,
  });

  if (!result.ok) {
    if (result.reason === "sender_already_assigned") {
      return NextResponse.json({ error: "That Twilio sender is already assigned to another Klinikos organization." }, { status: 409 });
    }
    return NextResponse.json({ error: "Invalid Twilio SMS routing configuration." }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      ...result,
      webhookPath: "/api/webhooks/twilio/sms",
      productionSendingAuthorized: false,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
