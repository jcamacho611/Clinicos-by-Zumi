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
    // The route may name the env var an operator has to set server-side — that is
    // configuration guidance. What it must never do is read the token's value or put
    // it on the wire, which is what actually leaks a credential to the browser.
    expect(configRoute).not.toMatch(/process\.env\.TWILIO_AUTH_TOKEN/);
    // The route was hardened further and no longer echoes the env var name at all, nor
    // the raw messaging service SID — only whether one is configured. Naming the secret
    // was operator convenience rather than a security property, so the rule asserted
    // here is the one that protects the tenant: no token value, no raw provider ids.
    expect(configRoute).not.toMatch(/messagingServiceSid:\s*routing/);
    expect(configRoute).toContain("messagingServiceConfigured");
    expect(configRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
  });

  it("validates the Twilio signature before resolving or mutating a tenant", () => {
    // Compare the call sites, not the identifiers: matching the bare names compares the
    // import statements, which reorder freely and prove nothing about execution order.
    expect(webhook.indexOf("validateTwilioWebhookSignature({")).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization({"));
    // An unsigned request has to leave before any tenant is resolved, not merely be
    // noted on the way past.
    expect(webhook).toMatch(/if \(!validateTwilioWebhookSignature\(\{[\s\S]{0,200}?return NextResponse\.json\([\s\S]{0,120}?status: 403/);
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
    // The body may be read in memory to classify STOP/START/HELP — that is why Twilio
    // sends it. It must never reach a persisted row. Assert the single legitimate
    // reader, so adding `body: input.body` to any metadata or data object fails here.
    const bodyReads = inbound.split("\n").filter((line) => line.includes("input.body"));
    expect(bodyReads).toHaveLength(1);
    expect(bodyReads[0]).toContain("classifySignedTwilioOptOut({");
    expect(webhook).toContain("must not create a second reply here");
  });
});
