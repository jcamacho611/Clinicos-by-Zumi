import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const service = read("src/lib/communications/patient-sms-service.ts");
const route = read("src/app/api/patients/[patientId]/sms-preferences/route.ts");
const templates = read("src/lib/communications/sms-templates.ts");

describe("patient SMS service architecture", () => {
  it("requires patient + organization scope before reading or changing communications state", () => {
    expect(service).toContain("where: { id: patientId, organizationId }");
    expect(service).toContain("evaluateSmsPermission");
    expect(service).toContain("communications.sms.send.blocked");
    expect(service).toContain("communications.sms.send.accepted");
    expect(service).toContain("communications.sms.permission.changed");
  });

  it("allows only server-owned fixed non-PHI templates on the canonical patient send path", () => {
    expect(service).toContain("sendAuthorizedPatientSmsTemplate");
    expect(service).toContain("patientSmsTemplate(input.templateId)");
    expect(service).not.toContain("export async function sendAuthorizedPatientSms(input");
    expect(service).not.toContain("body: input.body");
    expect(service).not.toContain("containsPhi?: boolean");
    expect(templates).toContain('patientSmsTemplateIds = ["secure_account_update", "transaction_receipt_ready"]');
    expect(templates).not.toContain('messageClass: "marketing"');
    expect(templates).not.toContain('messageClass: "clinical"');
  });

  it("requires an explicit production gate, tenant sender, inbound STOP routing and timezone", () => {
    expect(service).toContain("KLINIKOS_SMS_PRODUCTION_ENABLED");
    expect(service).toContain("getTwilioSmsRoutingConfig(input.organizationId)");
    expect(service).toContain("!routing?.senderPhone || !routing.inboundEnabled || !routing.timeZone");
    expect(service).toContain("evaluateSmsQuietHours");
    expect(service).toContain("sender: routing.senderPhone");
  });

  it("keeps Twilio transport behind the governed service rather than the preference API", () => {
    expect(service).toContain("deliverOutbound");
    expect(route).not.toContain("sendTwilioSms");
    expect(route).not.toContain("deliverOutbound");
    expect(route).toContain('enforceApiPermission(session, "consents", "update"');
    expect(route).toContain("session.organizationId");
  });

  it("keeps clinical grant and weak marketing evidence out of the staff mutation route", () => {
    expect(route).not.toContain('z.enum(["transactional", "operational", "marketing", "clinical"])');
    expect(route).toContain('z.enum(["transactional", "operational", "marketing"])');
    expect(route).toContain("Marketing SMS permission requires patient-written authorization");
    expect(route).toContain("Staff documentation cannot create SMS permission");
    expect(route).toContain("opaque internal references");
  });
});
