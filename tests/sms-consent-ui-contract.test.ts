import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const patientPage = read("src/app/(platform)/patients/[patientId]/page.tsx");
const patientPanel = read("src/components/clinic/patient-sms-preferences-panel.tsx");
const preferenceRoute = read("src/app/api/patients/[patientId]/sms-preferences/route.ts");

describe("staff SMS consent UI contract", () => {
  it("mounts communication permissions behind existing consents RBAC", () => {
    expect(patientPage).toContain("PatientSmsPreferencesPanel");
    expect(patientPage).toContain('can(session.role, "consents", "read")');
    expect(patientPage).toContain('can(session.role, "consents", "update")');
    expect(patientPanel).toContain("/sms-preferences");
  });

  it("projects minimum-necessary phone state instead of the full normalized phone", () => {
    expect(preferenceRoute).toContain("function staffSmsView");
    expect(preferenceRoute).toContain("maskedPhone");
    expect(preferenceRoute).toContain("currentPhoneVerified");
    expect(preferenceRoute).toContain("currentPhoneVerifiedAt");
    expect(preferenceRoute).toContain("currentPhoneVerificationSource");
    expect(patientPanel).toContain("maskedPhone: string | null");
    expect(patientPanel).toContain("currentPhoneVerified: boolean");
    expect(patientPanel).not.toContain("normalizedPhone: string | null");
    expect(patientPanel).not.toContain("verificationProviderReference");
  });

  it("keeps message classes separate and recipient suppression authoritative", () => {
    expect(patientPanel).toContain('transactional: { label: "Transactional"');
    expect(patientPanel).toContain('operational: { label: "Operational"');
    expect(patientPanel).toContain('marketing: { label: "Marketing"');
    expect(patientPanel).toContain("Marketing grant is deliberately unavailable here");
    expect(patientPanel).toContain("Staff cannot clear suppression from this chart");
    expect(patientPanel).toContain("Phone verification proves possession only");
    expect(patientPanel).toContain("Clinical SMS locked");
    expect(patientPanel).toContain("Staff documentation may record denial or revocation, but it cannot create permission");
  });

  it("announces asynchronous status and gives repeated permission buttons contextual names", () => {
    expect(patientPanel).toContain('role="alert"');
    expect(patientPanel).toContain('role="status"');
    expect(patientPanel).toContain('aria-label={`Grant ${meta.label} SMS permission`}');
    expect(patientPanel).toContain("focus-visible:ring-2");
  });

  it("never calls provider transport directly from the staff UI", () => {
    expect(patientPanel).not.toContain("sendTwilioSms");
    expect(patientPanel).not.toContain("api.twilio.com");
    expect(patientPanel).not.toContain("TWILIO_API_KEY_SECRET");
    expect(patientPanel).not.toContain("TWILIO_AUTH_TOKEN");
  });
});
