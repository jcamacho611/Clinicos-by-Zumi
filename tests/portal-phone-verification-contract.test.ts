import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const route = read("src/app/api/portal/phone-verification/route.ts");
const service = read("src/lib/communications/patient-sms-service.ts");

describe("patient-controlled Twilio Verify ceremony", () => {
  it("binds organization, patient, account, and destination to the authenticated portal session", () => {
    expect(route).toContain("getPortalSession()");
    expect(route).toContain("session.organizationId");
    expect(route).toContain("session.patientId");
    expect(route).toContain("session.accountId");
    expect(route).not.toContain("patientId: parsed.data");
    expect(route).not.toContain("organizationId: parsed.data");
    expect(route).not.toContain("to: parsed.data");
    expect(route).toContain("smsState.normalizedPhone");
  });

  it("requires same-origin mutations and serializes rate-limit reservations", () => {
    expect(route).toContain("evaluateSameOriginMutation(request)");
    expect(route).toContain("pg_advisory_xact_lock");
    expect(route).toContain("hashtextextended");
    expect(route).toContain("START_LIMIT = 5");
    expect(route).toContain("CHECK_LIMIT = 8");
    expect(route).toContain('Retry-After": "3600"');
    expect(route).toContain('Retry-After": "900"');
  });

  it("never persists verification codes and records possession only after Twilio approves", () => {
    expect(route).toContain('result.status !== "approved"');
    expect(route).toContain("codeStored: false");
    expect(route).not.toMatch(/metadata:\s*\{[^}]*code:\s*parsed\.data\.code/);
    expect(route.indexOf('result.status !== "approved"')).toBeLessThan(route.indexOf("recordPatientPhoneVerification({"));
    expect(service).toContain('source: "twilio_verify"');
    expect(service).toContain("providerReference");
    expect(service).toContain("consentGranted: false");
  });

  it("keeps possession evidence tied to the current normalized chart phone", () => {
    expect(service).toContain("normalizedPhone");
    expect(service).toContain("verificationSource: input.source");
    expect(service).toContain("verificationProviderReference");
    expect(route).toContain("phoneLast4");
  });
});
