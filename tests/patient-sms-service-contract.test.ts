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

  it("keeps Twilio transport behind the governed service rather than the preference API", () => {
    expect(service).toContain("deliverOutbound");
    expect(route).not.toContain("sendTwilioSms");
    expect(route).not.toContain("deliverOutbound");
    expect(route).toContain('enforceApiPermission(session, "consents", "update"');
    expect(route).toContain("session.organizationId");
  });
});
