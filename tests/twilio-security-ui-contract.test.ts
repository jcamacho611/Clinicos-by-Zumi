import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const operatorPage = read("src/app/(platform)/integrations/twilio/page.tsx");
const routingPanel = read("src/components/clinic/twilio-routing-panel.tsx");
const portalPage = read("src/app/portal/page.tsx");
const verificationPage = read("src/app/portal/verify-phone/page.tsx");
const verificationPanel = read("src/components/portal/portal-phone-verification.tsx");

describe("governed Twilio security UI", () => {
  it("permission-gates the operator routing page and never makes provider proof equal production authorization", () => {
    expect(operatorPage).toContain("requireClinicSession()");
    expect(operatorPage).toContain('can(session.role, "integrations", "read")');
    expect(operatorPage).toContain('can(session.role, "integrations", "manage")');
    expect(operatorPage).toContain("<TwilioRoutingPanel");
    expect(routingPanel).toContain("/api/integrations/twilio/sms-routing");
    expect(routingPanel).toContain("/api/integrations/twilio/sms-routing/verify");
    expect(routingPanel).toContain("Production patient SMS remains separately gated");
    expect(routingPanel).toContain("messagingServiceConfigured");
    expect(routingPanel).not.toContain("providerPhoneNumberSid");
    expect(routingPanel).not.toContain("providerMessagingServiceSid");
  });

  it("does not require the raw existing Messaging Service SID to be returned to the browser", () => {
    expect(routingPanel).toContain("messagingServiceSid: messagingServiceSid.trim() || undefined");
    expect(routingPanel).toContain("Leave blank to keep the currently configured service");
    expect(routingPanel).toContain("Messaging Service configured");
  });

  it("gives authenticated patients a visible route to the patient-controlled verification ceremony", () => {
    expect(portalPage).toContain('href="/portal/verify-phone"');
    expect(portalPage).toContain("Verify phone");
    expect(verificationPage).toContain("requirePortalSession()");
    expect(verificationPage).toContain("<PortalPhoneVerification");
    expect(verificationPanel).toContain("/api/portal/phone-verification");
  });

  it("keeps phone possession distinct from SMS permission and surfaces funding unavailability honestly", () => {
    expect(verificationPanel).toContain("does not grant SMS permission");
    expect(verificationPanel).toContain("Phone verification is not available until its funding policy is activated");
    expect(verificationPanel).toContain("Verification code sent");
    expect(verificationPanel).toContain("Phone possession verified");
  });
});
