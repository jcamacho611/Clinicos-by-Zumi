import { describe, expect, it } from "vitest";
import { evaluateSmsQuietHours, isIanaTimeZone, patientSmsTemplate } from "@/lib/communications/sms-templates";

describe("patient SMS template policy", () => {
  it("exposes only reviewed generic non-PHI templates", () => {
    expect(patientSmsTemplate("secure_account_update")).toMatchObject({ messageClass: "operational", phiApproved: false });
    expect(patientSmsTemplate("transaction_receipt_ready")).toMatchObject({ messageClass: "transactional", phiApproved: false });
    expect(patientSmsTemplate("marketing_campaign")).toBeNull();
    expect(patientSmsTemplate("clinical_result")).toBeNull();
  });

  it("requires a valid IANA timezone", () => {
    expect(isIanaTimeZone("America/New_York")).toBe(true);
    expect(isIanaTimeZone("Not/A_Timezone")).toBe(false);
  });

  it("allows ordinary SMS only during the conservative 09:00-20:00 local window", () => {
    expect(evaluateSmsQuietHours({ timeZone: "America/New_York", now: new Date("2026-08-18T13:00:00Z") })).toMatchObject({ allowed: true, localHour: 9 });
    expect(evaluateSmsQuietHours({ timeZone: "America/New_York", now: new Date("2026-08-19T00:30:00Z") })).toMatchObject({ allowed: false, reason: "quiet_hours", localHour: 20 });
    expect(evaluateSmsQuietHours({ timeZone: "Not/A_Timezone", now: new Date("2026-08-18T13:00:00Z") })).toEqual({ allowed: false, reason: "invalid_timezone" });
  });
});
