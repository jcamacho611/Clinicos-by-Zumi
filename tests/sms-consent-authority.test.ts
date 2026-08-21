import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

function source(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("staff SMS consent authority", () => {
  it("does not expose clinical permission as a staff-editable class", () => {
    const route = source("src/app/api/patients/[patientId]/sms-preferences/route.ts");
    expect(route).toContain('z.enum(["transactional", "operational", "marketing"])');
    expect(route).not.toContain('"marketing", "clinical"');
  });

  it("does not allow a staff workflow to manufacture a marketing grant", () => {
    const route = source("src/app/api/patients/[patientId]/sms-preferences/route.ts");
    const service = source("src/lib/communications/patient-sms-service.ts");
    expect(route).toContain('value.messageClass === "marketing" && value.status === "granted"');
    expect(service).toContain('input.messageClass === "marketing" && input.status === "granted"');
    expect(service).toContain('reason: "invalid_evidence"');
  });

  it("requires same-origin evidence before the cookie-authenticated mutation", () => {
    const route = source("src/app/api/patients/[patientId]/sms-preferences/route.ts");
    expect(route).toContain("evaluateSameOriginMutation(request)");
    expect(route.indexOf("evaluateSameOriginMutation(request)")).toBeLessThan(route.indexOf("recordPatientSmsPermission({"));
  });
});

describe("same-origin mutation guard", () => {
  it("accepts a matching canonical origin", () => {
    const request = new Request("https://klinikos.io/api/example", {
      headers: { origin: "https://klinikos.io", "sec-fetch-site": "same-origin" },
    });
    expect(evaluateSameOriginMutation(request)).toEqual({ allowed: true });
  });

  it("rejects cross-site and missing-origin browser mutations", () => {
    const crossSite = new Request("https://klinikos.io/api/example", {
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    });
    expect(evaluateSameOriginMutation(crossSite)).toEqual({ allowed: false, reason: "cross_site" });

    const missing = new Request("https://klinikos.io/api/example");
    expect(evaluateSameOriginMutation(missing)).toEqual({ allowed: false, reason: "origin_missing" });
  });
});
