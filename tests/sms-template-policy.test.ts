import { describe, expect, it } from "vitest";
import {
  PATIENT_SMS_TEMPLATES,
  evaluateSmsQuietHours,
  isIanaTimeZone,
  patientSmsTemplate,
} from "@/lib/communications/sms-templates";

describe("patient SMS template policy", () => {
  it("exposes only fixed non-PHI transactional or operational templates", () => {
    expect(PATIENT_SMS_TEMPLATES.length).toBeGreaterThan(0);
    for (const template of PATIENT_SMS_TEMPLATES) {
      expect(template.phiApproved).toBe(false);
      expect(["transactional", "operational"]).toContain(template.messageClass);
      expect(template.body.length).toBeGreaterThan(0);
      expect(template.body.length).toBeLessThanOrEqual(480);
      expect(template.body).toContain("Reply STOP to opt out");
    }
  });

  it("fails closed for an unknown template id", () => {
    expect(patientSmsTemplate("not-a-real-template")).toBeNull();
  });

  it("does not define marketing or clinical patient SMS templates", () => {
    expect(PATIENT_SMS_TEMPLATES.some((template) => template.messageClass === "marketing")).toBe(false);
    expect(PATIENT_SMS_TEMPLATES.some((template) => template.messageClass === "clinical")).toBe(false);
  });
});

describe("patient SMS local send window", () => {
  it("validates IANA time zones and rejects invalid zones", () => {
    expect(isIanaTimeZone("America/New_York")).toBe(true);
    expect(isIanaTimeZone("UTC")).toBe(true);
    expect(isIanaTimeZone("Mars/Olympus_Mons")).toBe(false);
  });

  it("allows ordinary SMS at 09:00 recipient-local time", () => {
    expect(evaluateSmsQuietHours({
      timeZone: "America/New_York",
      now: new Date("2026-08-23T13:00:00.000Z"),
    }).allowed).toBe(true);
  });

  it("allows ordinary SMS immediately before 20:00 recipient-local time", () => {
    expect(evaluateSmsQuietHours({
      timeZone: "America/New_York",
      now: new Date("2026-08-23T23:59:00.000Z"),
    }).allowed).toBe(true);
  });

  it("blocks ordinary SMS at 20:00 recipient-local time", () => {
    expect(evaluateSmsQuietHours({
      timeZone: "America/New_York",
      now: new Date("2026-08-24T00:00:00.000Z"),
    })).toMatchObject({ allowed: false, reason: "quiet_hours" });
  });

  it("fails closed when the configured timezone is invalid", () => {
    expect(evaluateSmsQuietHours({
      timeZone: "Mars/Olympus_Mons",
      now: new Date("2026-08-23T13:00:00.000Z"),
    })).toEqual({ allowed: false, reason: "invalid_timezone" });
  });
});
