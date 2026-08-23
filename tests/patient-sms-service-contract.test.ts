import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const service = read("src/lib/communications/patient-sms-service.ts");
const route = read("src/app/api/patients/[patientId]/sms-preferences/route.ts");

describe("patient SMS service architecture", () => {
  it("requires patient + organization scope before reading or changing communications state", () => {
    expect(service).toContain("where: { id: patientId, organizationId }");
    expect(service).toContain("evaluateSmsPermission");
    expect(service).toContain("communications.sms.send.blocked");
    expect(service).toContain("communications.sms.send.accepted");
    expect(service).toContain("communications.sms.permission.changed");
  });

  it("removes the arbitrary-body patient send contract and accepts only a server-owned template id", () => {
    expect(service).toContain("sendAuthorizedPatientSmsTemplate");
    expect(service).toContain("templateId: PatientSmsTemplateId");
    expect(service).toContain("patientSmsTemplate(input.templateId)");
    expect(service).not.toContain("export async function sendAuthorizedPatientSms(");
    expect(service).not.toContain("containsPhi?: boolean");
  });

  it("gates patient SMS in the required authority order", () => {
    const template = service.indexOf("patientSmsTemplate(input.templateId)");
    const patient = service.indexOf("patientForSms(input.organizationId, input.patientId)", template);
    const permission = service.indexOf("evaluateSmsPermission({", patient);
    const possession = service.indexOf("phone_not_verified", permission);
    const production = service.indexOf("KLINIKOS_SMS_PRODUCTION_ENABLED", possession);
    const routing = service.indexOf("getTwilioSmsRoutingConfig(input.organizationId)", production);
    const providerProof = service.indexOf("routing_not_provider_verified", routing);
    const quietHours = service.indexOf("evaluateSmsQuietHours({", providerProof);
    const funding = service.indexOf('variableCostRailPolicy("patient_sms")', quietHours);
    const transport = service.indexOf("deliverOutbound({", funding);

    for (const position of [template, patient, permission, possession, production, routing, providerProof, quietHours, funding, transport]) {
      expect(position).toBeGreaterThan(-1);
    }
    expect(template).toBeLessThan(patient);
    expect(patient).toBeLessThan(permission);
    expect(permission).toBeLessThan(possession);
    expect(possession).toBeLessThan(production);
    expect(production).toBeLessThan(routing);
    expect(routing).toBeLessThan(providerProof);
    expect(providerProof).toBeLessThan(quietHours);
    expect(quietHours).toBeLessThan(funding);
    expect(funding).toBeLessThan(transport);
  });

  it("requires current phone-possession evidence to match the current chart phone", () => {
    expect(service).toContain("smsState.endpoint");
    expect(service).toContain("verification.normalizedPhone !== decision.normalizedPhone");
    expect(service).toContain('verification.verificationSource !== "twilio_verify"');
    expect(service).toContain("verificationProviderReference");
    expect(service).toContain("/^VE[0-9a-fA-F]{32}$/");
  });

  it("requires configured and provider-verified tenant routing before transport", () => {
    expect(service).toContain("routing.senderPhone");
    expect(service).toContain("routing.messagingServiceSid");
    expect(service).toContain("routing.inboundEnabled");
    expect(service).toContain("routing.timeZone");
    expect(service).toContain("routing.providerVerifiedAt");
    expect(service).toContain("routing.providerPhoneNumberSid");
    expect(service).toContain("routing.providerMessagingServiceSid !== routing.messagingServiceSid");
    expect(service).toContain("sender: routing.senderPhone");
    expect(service).toContain("messagingServiceSid: routing.messagingServiceSid");
  });

  it("preserves the current commercial funding authority instead of making provider configuration spend authority", () => {
    expect(service).toContain('variableCostRailPolicy("patient_sms")');
    expect(service).toContain("tenantVariableSpendFundingReady(economicPolicy)");
    expect(service).toContain("commercial_funding_not_ready");
  });

  it("keeps Twilio transport behind the governed service rather than the staff preference API", () => {
    expect(service).toContain("deliverOutbound");
    expect(route).not.toContain("sendTwilioSms");
    expect(route).not.toContain("deliverOutbound");
    expect(route).toContain('enforceApiPermission(session, "consents", "update"');
    expect(route).toContain("session.organizationId");
  });
});
