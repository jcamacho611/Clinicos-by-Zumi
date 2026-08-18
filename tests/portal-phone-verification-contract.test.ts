import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const route = read("src/app/api/portal/phone-verification/route.ts");
const component = read("src/components/portal/portal-phone-verification.tsx");
const portalPage = read("src/app/portal/page.tsx");

function index(value: string) {
  return route.indexOf(value);
}

describe("patient-controlled phone verification ceremony", () => {
  it("derives patient and organization identity only from the authenticated portal session", () => {
    expect(route).toContain("getPortalSession()");
    expect(route).toContain("session.organizationId");
    expect(route).toContain("session.patientId");
    expect(route).not.toContain("patientId: parsed.data");
    expect(route).not.toContain("organizationId: parsed.data");
    expect(route).not.toContain("actorId: parsed.data");
  });

  it("requires same-origin browser mutations and bounded attempts", () => {
    expect(route).toContain("evaluateSameOriginMutation(request)");
    expect(route).toContain("START_LIMIT = 5");
    expect(route).toContain("CHECK_LIMIT = 8");
    expect(route).toContain('status: 429');
    expect(route).toContain('"Retry-After"');
  });

  it("uses Twilio Verify and records possession only after provider approval", () => {
    expect(route).toContain("startTwilioPhoneVerification");
    expect(route).toContain("checkTwilioPhoneVerification");
    expect(route).toContain('result.status !== "approved"');
    expect(index('result.status !== "approved"')).toBeLessThan(index("recordPatientPhoneVerification({"));
    expect(route).toContain('source: "twilio_verify"');
    expect(route).toContain("consentGranted: false");
    expect(route).toContain("codeStored: false");
    expect(route).toContain("code: parsed.data.code");
  });

  it("never lets the patient choose a different destination number for verification", () => {
    expect(route).toContain("smsState.normalizedPhone");
    expect(route).not.toContain("to: parsed.data");
    expect(route).not.toContain("phone: parsed.data");
  });

  it("mounts an accessible patient-facing ceremony without a staff verification shortcut", () => {
    expect(portalPage).toContain("PortalPhoneVerification");
    expect(component).toContain('autoComplete="one-time-code"');
    expect(component).toContain('inputMode="numeric"');
    expect(component).toContain('role="alert"');
    expect(component).toContain('role="status"');
    expect(component).toContain("maskedPhone");
    expect(component).toContain("does not create SMS permission by itself");
    expect(component).not.toContain("Mark verified");
    expect(component).not.toContain("staff");
  });
});
