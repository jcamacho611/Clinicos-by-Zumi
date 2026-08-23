import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const integration = read("src/lib/communications/twilio-integration.ts");
const configRoute = read("src/app/api/integrations/twilio/sms-routing/route.ts");
const verifyRoute = read("src/app/api/integrations/twilio/sms-routing/verify/route.ts");

describe("Twilio tenant routing provider verification", () => {
  it("stores timezone and provider proof separately from typed routing configuration", () => {
    expect(integration).toContain("timeZone");
    expect(integration).toContain("providerVerifiedAt");
    expect(integration).toContain("providerPhoneNumberSid");
    expect(integration).toContain("providerMessagingServiceSid");
    expect(integration).toContain("providerVerificationReset: true");
    expect(integration).toContain("providerVerifiedAt: null");
    expect(integration).toContain("providerPhoneNumberSid: null");
    expect(integration).toContain("providerMessagingServiceSid: null");
  });

  it("serializes sender assignment before checking for another tenant", () => {
    expect(integration.indexOf("pg_advisory_xact_lock")).toBeLessThan(integration.indexOf("sender_already_assigned"));
    expect(integration).toContain("hashtextextended(${senderPhone}, 0)");
  });

  it("requires same-origin admin mutation and a valid tenant timezone", () => {
    expect(configRoute).toContain("evaluateSameOriginMutation(request)");
    expect(configRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
    expect(configRoute).toContain("timeZone");
    expect(integration).toContain("invalid_timezone");
  });

  it("preserves an existing Messaging Service and timezone when the operator omits unchanged provider fields", () => {
    expect(integration).toContain("requestedMessagingServiceSid === undefined");
    expect(integration).toContain("currentRouting?.messagingServiceSid ?? null");
    expect(integration).toContain("requestedTimeZone === undefined");
    expect(integration).toContain("currentRouting?.timeZone ?? null");
    expect(configRoute).toContain("messagingServiceSid: parsed.data.messagingServiceSid");
    expect(configRoute).toContain("timeZone: parsed.data.timeZone");
  });

  it("proves provider routing through a separate same-origin action without authorizing production sending", () => {
    expect(verifyRoute).toContain("verifyAndRecordTwilioSmsRouting");
    expect(verifyRoute).toContain("evaluateSameOriginMutation(request)");
    expect(verifyRoute).toContain('enforceApiPermission(session, "integrations", "manage"');
    expect(verifyRoute).toContain("providerRoutingVerified: true");
    expect(verifyRoute).toContain("productionSendingAuthorized: false");
  });

  it("refuses to persist stale provider proof if routing changed during verification", () => {
    expect(integration).toContain("verifyTwilioSmsRouting");
    expect(integration).toContain('reason: "routing_changed"');
    expect(integration).toContain("lockedRouting.senderPhone !== routing.senderPhone");
    expect(integration).toContain("lockedRouting.messagingServiceSid !== routing.messagingServiceSid");
    expect(integration).toContain("communications.twilio.sms_routing.provider_verified");
    expect(integration).toContain("productionSendingAuthorized: false");
  });
});
