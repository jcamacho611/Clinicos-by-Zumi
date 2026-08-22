import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  tenantVariableSpendFundingReady,
  variableCostRailPolicy,
} from "@/lib/commercial/variable-cost-rail-registry";

function source(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("patient SMS economic execution gate", () => {
  it("keeps patient SMS economically blocked until the durable micro repository exists", () => {
    const policy = variableCostRailPolicy("patient_sms");
    expect(policy?.economicReadiness).toBe("requires_micro_persistence");
    expect(policy && tenantVariableSpendFundingReady(policy)).toBe(false);
  });

  it("checks economic readiness before any outbound provider call", () => {
    const service = source("src/lib/communications/patient-sms-service.ts");
    const fundingGuard = service.indexOf('variableCostRailPolicy("patient_sms")');
    const outboundCall = service.indexOf("deliverOutbound({");

    expect(fundingGuard).toBeGreaterThan(-1);
    expect(outboundCall).toBeGreaterThan(-1);
    expect(fundingGuard).toBeLessThan(outboundCall);
    expect(service).toContain('reason: "commercial_funding_not_ready"');
  });
});
