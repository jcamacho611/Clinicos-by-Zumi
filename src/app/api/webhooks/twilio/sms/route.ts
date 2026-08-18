import { NextResponse } from "next/server";
import { processInboundPatientSms } from "@/lib/communications/inbound-sms-service";
import { resolveInboundTwilioOrganization } from "@/lib/communications/twilio-integration";
import { validateTwilioWebhookSignature } from "@/lib/communications/twilio-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TWILIO_FORM_BYTES = 64 * 1024;

function publicWebhookUrl(request: Request) {
  const incoming = new URL(request.url);
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredBase) return process.env.NODE_ENV === "production" ? null : incoming.toString();

  try {
    const base = new URL(configuredBase);
    if (process.env.NODE_ENV === "production" && base.protocol !== "https:") return null;
    base.pathname = incoming.pathname;
    base.search = incoming.search;
    base.hash = "";
    return base.toString();
  } catch {
    return process.env.NODE_ENV === "production" ? null : incoming.toString();
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
  const configuredAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  if (!authToken || !/^AC[0-9a-fA-F]{32}$/.test(configuredAccountSid ?? "")) {
    return NextResponse.json({ error: "Twilio inbound verification is not configured." }, { status: 503 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "Unsupported Twilio webhook content type." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_TWILIO_FORM_BYTES) {
    return NextResponse.json({ error: "Twilio webhook payload is too large." }, { status: 413 });
  }

  const requestUrl = publicWebhookUrl(request);
  if (!requestUrl) {
    return NextResponse.json({ error: "Canonical Twilio webhook URL is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_TWILIO_FORM_BYTES) {
    return NextResponse.json({ error: "Twilio webhook payload is too large." }, { status: 413 });
  }

  const params = new URLSearchParams(rawBody);
  const signature = request.headers.get("x-twilio-signature");
  if (!validateTwilioWebhookSignature({ publicUrl: requestUrl, params, signature, authToken })) {
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 403 });
  }

  const accountSid = params.get("AccountSid")?.trim() || "";
  if (accountSid !== configuredAccountSid) {
    return NextResponse.json({ error: "Twilio account mismatch." }, { status: 403 });
  }

  const messageSid = params.get("MessageSid")?.trim() || "";
  const from = params.get("From")?.trim() || "";
  const to = params.get("To")?.trim() || "";
  const body = params.get("Body") ?? "";
  const messagingServiceSid = params.get("MessagingServiceSid")?.trim() || null;
  const optOutType = params.get("OptOutType")?.trim() || null;

  if (!/^[A-Z]{2}[0-9a-fA-F]{32}$/.test(messageSid) || !from || !to) {
    return NextResponse.json({ error: "Incomplete Twilio inbound message." }, { status: 400 });
  }

  const tenant = await resolveInboundTwilioOrganization({ to, messagingServiceSid });
  if (!tenant.ok) {
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

  // Advanced Opt-Out has already sent its STOP/START/HELP confirmation. Klinikos only
  // mirrors signed provider state and deliberately emits empty TwiML here.
  return emptyTwiml();
}
