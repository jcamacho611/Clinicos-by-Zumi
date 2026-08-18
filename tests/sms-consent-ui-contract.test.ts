import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const patientPage = read("src/app/(platform)/patients/[patientId]/page.tsx");
const patientPanel = read("src/components/clinic/patient-sms-preferences-panel.tsx");
const workspacePage = read("src/app/(platform)/[workspace]/page.tsx");
const routingPanel = read("src/components/clinic/twilio-routing-panel.tsx");

describe("SMS consent UI contract", () => {
  it("mounts patient communication permissions behind the existing consents RBAC", () => {
    expect(patientPage).toContain("PatientSmsPreferencesPanel");
    expect(patientPage).toContain('can(session.role, "consents", "read")');
    expect(patientPage).toContain('can(session.role, "consents", "update")');
    expect(patientPanel).toContain("/sms-preferences");
  });

  it("keeps message classes separate and recipient suppression authoritative", () => {
    expect(patientPanel).toContain('transactional: { label: "Transactional"');
    expect(patientPanel).toContain('operational: { label: "Operational"');
    expect(patientPanel).toContain('marketing: { label: "Marketing"');
    expect(patientPanel).toContain("requires written authorization");
    expect(patientPanel).toContain("Staff cannot clear suppression from this chart");
    expect(patientPanel).toContain("Phone verification proves possession only; it never creates consent");
    expect(patientPanel).toContain("Clinical SMS locked");
    expect(patientPanel).toContain("Staff documentation can record denial or revocation, but it cannot create permission");
  });

  it("announces asynchronous status and gives repeated permission buttons contextual names", () => {
    expect(patientPanel).toContain('role="alert"');
    expect(patientPanel).toContain('role="status"');
    expect(patientPanel).toContain('aria-label={`Grant ${meta.label} SMS permission`}');
    expect(patientPanel).toContain("focus-visible:ring-2");
    expect(patientPanel).not.toContain("text-[8px]");
    expect(patientPanel).not.toContain("text-[9px]");
  });

  it("mounts platform-managed Twilio routing without accepting provider secrets", () => {
    expect(workspacePage).toContain('workspace === "integrations"');
    expect(workspacePage).toContain('can(session.role, "integrations", "manage")');
    expect(routingPanel).toContain("/api/integrations/twilio/sms-routing");
    expect(routingPanel).toContain("platform-managed Twilio account");
    expect(routingPanel).toContain("Bring-your-own Twilio accounts are not a current production capability");
    expect(routingPanel).not.toContain("TWILIO_API_KEY_SECRET");
    expect(routingPanel).not.toContain('name="TWILIO_AUTH_TOKEN"');
    expect(routingPanel).toContain("Production SMS is not authorized by this panel");
    expect(routingPanel).toContain("America/New_York");
    expect(routingPanel).toContain("focus-visible:ring-2");
  });

  it("never calls Twilio transport directly from either UI", () => {
    expect(patientPanel).not.toContain("sendTwilioSms");
    expect(routingPanel).not.toContain("sendTwilioSms");
    expect(patientPanel).not.toContain("api.twilio.com");
    expect(routingPanel).not.toContain("api.twilio.com");
  });
});
