import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const integration = read("src/lib/communications/twilio-integration.ts");
const webhook = read("src/app/api/webhooks/twilio/sms/route.ts");
const inbound = read("src/lib/communications/inbound-sms-service.ts");
const configRoute = read("src/app/api/integrations/twilio/sms-routing/route.ts");

describe("Twilio inbound tenant routing contract", () => {
  it("stores only non-secret routing and serializes sender assignment", () => {
    expect(integration).toContain('type: "communications"');
    expect(integration).toContain('vendor: "Twilio"');
    expect(integration).toContain("senderPhone");
    expect(integration).toContain("messagingServiceSid");
    expect(integration).toContain("timeZone");
    expect(integration).toContain("sender_already_assigned");
    expect(integration).toContain("pg_advisory_xact_lock");
    expect(integration).toContain("LIMIT 2");
    expect(integration).not.toContain("TWILIO_API_KEY_SECRET");
    expect(configRoute).not.toContain("process.env.TWILIO_AUTH_TOKEN");
    expect(configRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
    expect(configRoute).toContain("evaluateSameOriginMutation(request)");
  });

  it("hardens the public boundary before tenant resolution or mutation", () => {
    expect(webhook.indexOf("content-type")).toBeLessThan(webhook.indexOf("request.text()"));
    expect(webhook.indexOf("MAX_TWILIO_FORM_BYTES")).toBeLessThan(webhook.indexOf("request.text()"));
    expect(webhook.indexOf("hasDuplicateFormKeys(params)")).toBeLessThan(webhook.indexOf("validateTwilioWebhookSignature"));
    expect(webhook.indexOf("validateTwilioWebhookSignature")).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization"));
    expect(webhook.indexOf("accountSid !== configuredAccountSid")).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization"));
    expect(webhook.indexOf("resolveInboundTwilioOrganization({")).toBeLessThan(webhook.indexOf("processInboundPatientSms({"));
    expect(webhook).toContain("Ambiguous Twilio webhook form fields");
    expect(webhook).toContain('request.headers.get("x-twilio-signature")');
    expect(webhook).toContain("TWILIO_AUTH_TOKEN");
    expect(webhook).toContain("TWILIO_ACCOUNT_SID");
    expect(webhook).toContain("Canonical Twilio webhook URL is not configured");
    expect(webhook).toContain("<Response></Response>");
    expect(webhook).toContain('"Content-Type": "application/xml; charset=utf-8"');
  });

  it("treats STOP/START as endpoint-level state but ordinary text as patient-specific", () => {
    expect(inbound).toContain("STOP and START are endpoint-level suppression events");
    expect(inbound).toContain("for (const patient of patients)");
    expect(inbound).toContain("affectedPatientCount: patients.length");
    expect(inbound).toContain("endpointScoped: true");
    expect(inbound).toContain('reason: "ambiguous_patient"');
    expect(inbound).toContain("patients.length !== 1");
    expect(inbound).toContain("FOR UPDATE");
  });

  it("serializes provider replay before state mutation and never persists inbound content", () => {
    expect(inbound).toContain("hashtextextended(${input.messageSid}, 0)");
    expect(inbound).toContain("tx.integrationEvent.findFirst");
    expect(inbound).toContain("tx.integrationEvent.create");
    expect(inbound).toContain('resourceType: "twilio_message"');
    expect(inbound).toContain('state: "duplicate"');
    expect(inbound).toContain("consentGranted: false");
    expect(inbound).toContain("bodyStored: false");
    expect(inbound).not.toContain("body: input.body");
    expect(webhook).toContain("deliberately emits empty TwiML");
  });
});
