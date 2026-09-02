import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routeFiles = [
  "src/app/api/company/opportunities/route.ts",
  "src/app/api/company/opportunities/[opportunityId]/evidence/route.ts",
  "src/app/api/company/opportunities/[opportunityId]/transition/route.ts",
];

describe("company opportunity API source boundary", () => {
  it("keeps every mutation behind the same-origin gate and no-store responses", () => {
    for (const file of routeFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("evaluateSameOriginMutation");
      expect(source, file).toContain("COMPANY_OPPORTUNITY_NO_STORE");
    }
  });

  it("never accepts organization identity, arbitrary metadata, or raw messages in route code", () => {
    for (const file of routeFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/body\.organizationId|body\.tenantId|rawEmailBody/);
      expect(source, file).not.toMatch(/metadata\s*:/);
    }
  });
});
