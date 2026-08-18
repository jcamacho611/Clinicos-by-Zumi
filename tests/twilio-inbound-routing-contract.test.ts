import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const integration = read("src/lib/communications/twilio-integration.ts");
const webhook = read("src/app/api/webhooks/twilio/sms/route.ts");
const inbound = read("src/lib/communications/inbound-sms-service.ts");
const configRoute = read("src/app/api/integrations/twilio/sms-routing/route.ts");

describe("Twilio inbound tenant routing contract", () => {
  it("stores only non-secret sender routing in the tenant Integration record", () => {
    expect(integration).toContain('type: "communications"');
    expect(integration).toContain('vendor: "Twilio"');
    expect(integration).toContain("senderPhone");
    expect(integration).toContain("messagingServiceSid");
    expect(integration).toContain("sender_already_assigned");
    expect(integration).toContain("LIMIT 2");
    expect(integration).not.toContain("TWILIO_API_KEY_SECRET");
    expect(configRoute).not.toContain("TWILIO_AUTH_TOKEN");
    expect(configRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
  });

  it("validates the Twilio signature before resolving or mutating a tenant", () => {
    expect(webhook.indexOf("validateTwilioWebhookSignature")).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization"));
    expect(webhook.indexOf("resolveInboundTwilioOrganization({")).toBeLessThan(webhook.indexOf("processInboundPatientSms({"));
    expect(webhook).toContain('request.headers.get("x-twilio-signature")');
    expect(webhook).toContain("TWILIO_AUTH_TOKEN");
    expect(webhook).toContain("<Response></Response>");
    expect(webhook).toContain('"Content-Type": "application/xml; charset=utf-8"');
  });

  it("fails closed on ambiguous patients and persists replay evidence under a row lock", () => {
    expect(inbound).toContain('reason: "ambiguous_patient"');
    expect(inbound).toContain("FOR UPDATE");
    expect(inbound).toContain("hasProcessedInboundSmsEvent");
    expect(inbound).toContain("tx.integrationEvent.findFirst");
    expect(inbound).toContain("tx.integrationEvent.create");
    expect(inbound).toContain('resourceType: "twilio_message"');
    expect(inbound).toContain('state: "duplicate"');
  });

  it("never treats START as new consent and never persists the inbound message body in audit metadata", () => {
    expect(inbound).toContain("START removes the suppression state only");
    expect(inbound).toContain("consentGranted: false");
    expect(inbound).toContain("bodyStored: false");
    expect(inbound).not.toContain("body: input.body");
    expect(webhook).toContain("must not create a second reply here");
  });
});
