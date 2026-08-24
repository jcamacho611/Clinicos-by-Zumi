import { describe, expect, it } from "vitest";

import {
  SCWDB_WORKFORCE_CONFIGURATION,
  getWorkforcePathwayKeys,
} from "./workforce-configuration";

describe("SCWDB Workforce configuration", () => {
  it("is an EDU Workforce configuration, not a forked product", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.product).toBe("edu");
    expect(SCWDB_WORKFORCE_CONFIGURATION.configuration).toBe("workforce");
  });

  it("derives the exact merged Industry Accelerator pathways", () => {
    expect(getWorkforcePathwayKeys()).toEqual([
      "manufacturing",
      "construction",
      "logistics",
      "healthcare",
      "business_operations",
    ]);
  });

  it("keeps Career Readiness separate from Industry Accelerator pathways", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceFamilies).toEqual([
      "industry_accelerator",
      "career_readiness",
    ]);
    expect(getWorkforcePathwayKeys()).not.toContain("career_readiness");
  });

  it("locks human completion authority and SCWDB reporting SLAs", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.completion).toBe("human");
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.aiMayApproveCompletion).toBe(false);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.attendanceCompletionBusinessDays).toBe(2);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.surveyBusinessDays).toBe(5);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.launchCalendarDays).toBe(30);
  });
});
