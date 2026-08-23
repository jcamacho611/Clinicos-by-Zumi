import { describe, expect, it } from "vitest";

import {
  getKentuckyIndustryPathway,
  kentuckyAiWorkforceProgram,
  kentuckyCareerReadinessWorkshop,
  kentuckyIndustryPathways,
} from "@/lib/edu/kentucky-ai-workforce";

describe("Kentucky AI Workforce Readiness program catalog", () => {
  it("covers both required services and all five industry pathways", () => {
    expect(kentuckyAiWorkforceProgram.services).toEqual(["industry_accelerator", "career_readiness"]);
    expect(kentuckyIndustryPathways.map((pathway) => pathway.key)).toEqual([
      "manufacturing",
      "construction",
      "logistics",
      "healthcare",
      "business_operations",
    ]);
  });

  it("matches RFP duration and live delivery constraints", () => {
    for (const pathway of kentuckyIndustryPathways) {
      expect(pathway.durationHours.minimum).toBe(6);
      expect(pathway.durationHours.maximum).toBe(8);
      expect(pathway.deliveryModes).toEqual(expect.arrayContaining(["in_person", "live_remote"]));
    }
    expect(kentuckyCareerReadinessWorkshop.durationHours).toEqual({ minimum: 2, maximum: 3 });
    expect(kentuckyCareerReadinessWorkshop.deliveryModes).toEqual(expect.arrayContaining(["in_person", "live_remote"]));
  });

  it("keeps every Kentucky configuration visibly proposed until approved", () => {
    expect(kentuckyAiWorkforceProgram.templateStatus).toBe("proposed_demo_template");
    expect(kentuckyIndustryPathways.every((pathway) => pathway.templateStatus === "proposed_demo_template")).toBe(true);
  });

  it("gives every pathway hands-on evidence and a human authority boundary", () => {
    for (const pathway of kentuckyIndustryPathways) {
      expect(pathway.sampleExercise.title.length).toBeGreaterThan(0);
      expect(pathway.sampleExercise.participantTasks.length).toBeGreaterThanOrEqual(4);
      expect(pathway.sampleExercise.evidence.length).toBeGreaterThanOrEqual(2);
      expect(pathway.humanAuthorityBoundary.toLowerCase()).toContain("ai");
    }
  });

  it("keeps healthcare operational and nonclinical", () => {
    const healthcare = getKentuckyIndustryPathway("healthcare");
    const content = [
      ...(healthcare?.learningObjectives ?? []),
      ...(healthcare?.sampleExercise.participantTasks ?? []),
    ].join(" ").toLowerCase();

    expect(content).toContain("scheduling");
    expect(content).toContain("documentation");
    expect(healthcare?.humanAuthorityBoundary.toLowerCase()).toContain("diagnose");
    expect(healthcare?.humanAuthorityBoundary.toLowerCase()).toContain("prescribe");
  });

  it("requires participant resources and completion evidence", () => {
    expect(kentuckyAiWorkforceProgram.requiredProgramElements).toEqual(expect.arrayContaining([
      "participant_takeaway_resource",
      "certificate_of_completion",
      "assessment_evidence",
      "instructor_review",
    ]));
  });
});