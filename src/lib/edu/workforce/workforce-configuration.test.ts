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
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.implementationPlanBusinessDays).toBe(15);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.attendanceCompletionBusinessDays).toBe(2);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.surveyBusinessDays).toBe(5);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.launchCalendarDays).toBe(30);
  });

  it("captures class-size, access, language, and delivery assumptions without turning them into eligibility gates", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.classSize.careerReadiness).toEqual({
      dedicatedPlanningMinimum: 6,
      recommended: 18,
      leadInstructorMaximum: 24,
      maximumWithSecondFacilitator: 40,
    });
    expect(SCWDB_WORKFORCE_CONFIGURATION.classSize.industryAccelerator).toEqual({
      dedicatedPlanningMinimum: 6,
      recommended: 15,
      leadInstructorMaximum: 20,
      maximumWithSecondFacilitator: 30,
    });
    expect(SCWDB_WORKFORCE_CONFIGURATION.classSize.inPersonRecommended).toEqual({ min: 12, max: 20 });
    expect(SCWDB_WORKFORCE_CONFIGURATION.participantAccess.personalPaidAiSubscriptionRequired).toBe(false);
    expect(SCWDB_WORKFORCE_CONFIGURATION.participantAccess.languageAccess).toBe("scwdb_approved_human_reviewed");
    expect(SCWDB_WORKFORCE_CONFIGURATION.delivery.routineLiveRemote).toBe(true);
    expect(SCWDB_WORKFORCE_CONFIGURATION.delivery.strategicInPerson).toBe(true);
  });

  it("prevents training or certificates from becoming professional or employment authority", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.certificateConveysLicensure).toBe(false);
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.trainingEstablishesEmploymentEligibility).toBe(false);
    expect(SCWDB_WORKFORCE_CONFIGURATION.technology.approvedToolDisclosureRequired).toBe(true);
    expect(SCWDB_WORKFORCE_CONFIGURATION.technology.publicUnapprovedAiMayReceiveRestrictedData).toBe(false);
  });
});
