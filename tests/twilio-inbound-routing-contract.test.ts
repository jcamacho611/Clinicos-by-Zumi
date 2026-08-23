import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const integration = read("src/lib/communications/twilio-integration.ts");
const webhook = read("src/app/api/webhooks/twilio/sms/route.ts");
const inbound = read("src/lib/communications/inbound-sms-service.ts");
const configRoute = read("src/app/api/integrations/twilio/sms-routing/route.ts");
const phoneLookupMigration = read("prisma/migrations/20260823010000_patient_sms_phone_lookup_index/migration.sql");

describe("Twilio inbound tenant routing contract", () => {
  it("stores only non-secret sender routing in the tenant Integration record", () => {
    expect(integration).toContain('type: "communications"');
    expect(integration).toContain('vendor: "Twilio"');
    expect(integration).toContain("senderPhone");
    expect(integration).toContain("messagingServiceSid");
    expect(integration).toContain("sender_already_assigned");
    expect(integration).toContain("LIMIT 2");
    expect(integration).not.toContain("TWILIO_API_KEY_SECRET");
    expect(configRoute).not.toMatch(/process\.env\.TWILIO_AUTH_TOKEN/);
    expect(configRoute).not.toMatch(/messagingServiceSid:\s*routing/);
    expect(configRoute).toContain("messagingServiceConfigured");
    expect(configRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
  });

  it("validates the Twilio signature before resolving or mutating a tenant", () => {
    expect(webhook.indexOf("validateTwilioWebhookSignature({")).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization({"));
    expect(webhook).toMatch(/if \(!validateTwilioWebhookSignature\(\{[\s\S]{0,200}?return NextResponse\.json\([\s\S]{0,120}?status: 403/);
    expect(webhook.indexOf("resolveInboundTwilioOrganization({")).toBeLessThan(webhook.indexOf("processInboundPatientSms({"));
    expect(webhook).toContain('request.headers.get("x-twilio-signature")');
    expect(webhook).toContain("TWILIO_AUTH_TOKEN");
    expect(webhook).toContain("<Response></Response>");
    expect(webhook).toContain('"Content-Type": "application/xml; charset=utf-8"');
  });

  it("fails closed before signature validation when the provider HTTP envelope is ambiguous or oversized", () => {
    expect(webhook).toContain("MAX_TWILIO_FORM_BYTES = 64 * 1024");
    expect(webhook).toContain('contentType.startsWith("application/x-www-form-urlencoded")');
    expect(webhook).toContain("declaredLength > MAX_TWILIO_FORM_BYTES");
    expect(webhook).toContain('Buffer.byteLength(rawBody, "utf8") > MAX_TWILIO_FORM_BYTES');
    expect(webhook).toContain("hasDuplicateFormKeys(params)");
    expect(webhook).toContain('status: 415');
    expect(webhook).toContain('status: 413');
    expect(webhook).toContain('Ambiguous Twilio webhook form fields.');
  });

  it("requires a canonical HTTPS production webhook URL and the configured Twilio AccountSid", () => {
    expect(webhook).toContain('process.env.NODE_ENV === "production" ? null : incoming.toString()');
    expect(webhook).toContain('process.env.NODE_ENV === "production" && base.protocol !== "https:"');
    expect(webhook).toContain('Canonical Twilio webhook URL is not configured.');
    expect(webhook).toContain('configuredAccountSid');
    expect(webhook).toContain('/^AC[0-9a-fA-F]{32}$/');
    expect(webhook).toContain('params.get("AccountSid")');
    expect(webhook).toContain('accountSid !== configuredAccountSid');
    expect(webhook).toContain('Twilio account mismatch.');
  });

  it("requires a real Twilio SMS/MMS MessageSid before tenant resolution", () => {
    expect(webhook).toContain('/^(SM|MM)[0-9a-fA-F]{32}$/');
    expect(webhook.indexOf('/^(SM|MM)[0-9a-fA-F]{32}$/')).toBeLessThan(webhook.indexOf("resolveInboundTwilioOrganization({"));
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

  it("indexes the exact normalized tenant phone expression used by inbound patient resolution without forcing uniqueness", () => {
    expect(phoneLookupMigration).toContain('CREATE INDEX IF NOT EXISTS "patients_org_sms_phone_normalized_idx"');
    expect(phoneLookupMigration).toContain('ON "patients"');
    expect(phoneLookupMigration).toContain('"organizationId"');
    expect(phoneLookupMigration).toContain(`WHEN LEFT(TRIM("phone"), 1) = '+' THEN`);
    expect(phoneLookupMigration).toContain(`regexp_replace(SUBSTRING(TRIM("phone") FROM 2), '[^0-9]', '', 'g')`);
    expect(phoneLookupMigration).toContain(`WHEN regexp_replace(TRIM("phone"), '[^0-9]', '', 'g') ~ '^[0-9]{10}$' THEN`);
    expect(phoneLookupMigration).toContain(`'+1' || regexp_replace(TRIM("phone"), '[^0-9]', '', 'g')`);
    expect(phoneLookupMigration).toContain('WHERE "phone" IS NOT NULL');
    expect(phoneLookupMigration).not.toContain("CREATE UNIQUE INDEX");
    expect(inbound).toContain("patients_org_sms_phone_normalized_idx");
  });

  it("never treats START as new consent and never persists the inbound message body in audit metadata", () => {
    expect(inbound).toContain("START removes the suppression state only");
    expect(inbound).toContain("consentGranted: false");
    expect(inbound).toContain("bodyStored: false");
    const bodyReads = inbound.split("\n").filter((line) => line.includes("input.body"));
    expect(bodyReads).toHaveLength(1);
    expect(bodyReads[0]).toContain("classifySignedTwilioOptOut({");
    expect(webhook).toContain("must not create a second reply here");
  });
});
