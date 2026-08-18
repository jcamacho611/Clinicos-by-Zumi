import { describe, expect, it } from "vitest";
import {
  evaluateSmsPermission,
  normalizeSmsPhone,
  readSmsPreferences,
  setSmsPermission,
  suppressSms,
  writeSmsPreferences,
} from "@/lib/communications/sms-policy";

describe("SMS communications permission policy", () => {
  it("normalizes a US phone conservatively and preserves explicit E.164", () => {
    expect(normalizeSmsPhone("(212) 555-0123")).toBe("+12125550123");
    expect(normalizeSmsPhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizeSmsPhone("020 7946 0958")).toBeNull();
  });

  it("blocks product SMS when no exact message-class permission exists", () => {
    expect(evaluateSmsPermission({
      communicationPrefs: null,
      phone: "+12125550123",
      messageClass: "operational",
    })).toMatchObject({ allowed: false, reason: "permission_missing" });
  });

  it("does not infer marketing consent from an operational grant", () => {
    const prefs = setSmsPermission({
      communicationPrefs: null,
      messageClass: "operational",
      status: "granted",
      source: "patient_portal",
      capturedAt: "2026-08-18T10:00:00.000Z",
    });

    expect(evaluateSmsPermission({ communicationPrefs: prefs, phone: "+12125550123", messageClass: "operational" }))
      .toMatchObject({ allowed: true, normalizedPhone: "+12125550123" });
    expect(evaluateSmsPermission({ communicationPrefs: prefs, phone: "+12125550123", messageClass: "marketing" }))
      .toMatchObject({ allowed: false, reason: "permission_missing" });
  });

  it("keeps phone verification separate from permission to message", () => {
    const prefs = writeSmsPreferences(null, {
      version: 1,
      endpoint: {
        normalizedPhone: "+12125550123",
        verifiedAt: "2026-08-18T10:00:00.000Z",
        verificationSource: "twilio_verify",
      },
      permissions: {},
    });

    expect(evaluateSmsPermission({ communicationPrefs: prefs, phone: "+12125550123", messageClass: "operational" }))
      .toMatchObject({ allowed: false, reason: "permission_missing" });
  });

  it("suppresses ordinary product SMS after opt-out even when prior permission was granted", () => {
    const granted = setSmsPermission({
      communicationPrefs: null,
      messageClass: "transactional",
      status: "granted",
      source: "written_consent",
      capturedAt: "2026-08-18T10:00:00.000Z",
    });
    const optedOut = suppressSms({
      communicationPrefs: granted,
      reason: "recipient_opt_out",
      eventId: "SM_stop_1",
      at: "2026-08-18T10:05:00.000Z",
    });

    expect(evaluateSmsPermission({ communicationPrefs: optedOut, phone: "+12125550123", messageClass: "transactional" }))
      .toMatchObject({ allowed: false, reason: "suppressed" });
    expect(readSmsPreferences(optedOut).recentInboundEventIds).toContain("SM_stop_1");
  });

  it("keeps clinical or PHI-bearing SMS fail-closed even if a permission value exists", () => {
    const prefs = setSmsPermission({
      communicationPrefs: null,
      messageClass: "clinical",
      status: "granted",
      source: "test_only",
    });

    expect(evaluateSmsPermission({ communicationPrefs: prefs, phone: "+12125550123", messageClass: "clinical" }))
      .toMatchObject({ allowed: false, reason: "clinical_sms_blocked" });
    expect(evaluateSmsPermission({ communicationPrefs: prefs, phone: "+12125550123", messageClass: "operational", containsPhi: true }))
      .toMatchObject({ allowed: false, reason: "clinical_sms_blocked" });
  });

  it("preserves unrelated legacy communication preference keys", () => {
    const prefs = setSmsPermission({
      communicationPrefs: { preferredChannel: "email" },
      messageClass: "operational",
      status: "denied",
      source: "staff_capture",
    });
    expect(prefs.preferredChannel).toBe("email");
  });
});
