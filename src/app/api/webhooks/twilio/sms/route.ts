import { NextResponse } from "next/server";
import { processInboundPatientSms } from "@/lib/communications/inbound-sms-service";
import { resolveInboundTwilioOrganization } from "@/lib/communications/twilio-integration";
import { validateTwilioWebhookSignature } from "@/lib/communications/twilio-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicWebhookUrl(request: Request) {
  const incoming = new URL(request.url);
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredBase) return incoming.toString();

  try {
    const base = new URL(configuredBase);
    base.pathname = incoming.pathname;
    base.search = incoming.search;
    base.hash = "";
    return base.toString();
  } catch {
    return incoming.toString();
  }
}

function emptyTwiml() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) {
    return NextResponse.json({ error: "Twilio inbound verification is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const signature = request.headers.get("x-twilio-signature");
  const requestUrl = publicWebhookUrl(request);

  if (!validateTwilioWebhookSignature({ publicUrl: requestUrl, params, signature, authToken })) {
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 403 });
  }

  const messageSid = params.get("MessageSid")?.trim() || "";
  const from = params.get("From")?.trim() || "";
  const to = params.get("To")?.trim() || "";
  const body = params.get("Body") ?? "";
  const messagingServiceSid = params.get("MessagingServiceSid")?.trim() || null;
  const optOutType = params.get("OptOutType")?.trim() || null;

  if (!messageSid || !from || !to) {
    return NextResponse.json({ error: "Incomplete Twilio inbound message." }, { status: 400 });
  }

  const tenant = await resolveInboundTwilioOrganization({ to, messagingServiceSid });
  if (!tenant.ok) {
    // The request is genuinely signed by Twilio but no single Klinikos tenant owns the
    // destination. Never guess and never touch patient state. Return empty TwiML so a
    // legitimate provider callback is acknowledged without creating a reply message.
    console.warn("[twilio] signed inbound SMS had no unique tenant routing", {
      reason: tenant.reason,
      messageSid,
      hasMessagingServiceSid: Boolean(messagingServiceSid),
    });
    return emptyTwiml();
  }

  await processInboundPatientSms({
    organizationId: tenant.organizationId,
    integrationId: tenant.integrationId,
    from,
    messageSid,
    body,
    optOutType,
  });

  // Twilio Advanced Opt-Out has already sent its own STOP/START/HELP confirmation.
  // Klinikos only mirrors the signed state and must not create a second reply here.
  return emptyTwiml();
}
