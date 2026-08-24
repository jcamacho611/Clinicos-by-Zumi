import { describe, expect, it } from "vitest";

import {
  careerReadinessWorkshop,
  industryAcceleratorPathways,
  workforceAiReadinessProgram,
} from "@/lib/edu/workforce-ai-program";

describe("reusable workforce AI program", () => {
  it("offers both reusable service families and all five occupational pathways", () => {
    expect(workforceAiReadinessProgram.serviceFamilies.map((service) => service.key)).toEqual([
      "industry_accelerator",
      "career_readiness",
    ]);
    expect(industryAcceleratorPathways.map((pathway) => pathway.key)).toEqual([
      "manufacturing",
      "construction",
      "logistics",
      "healthcare",
      "business_operations",
    ]);
  });

  it("keeps durations compatible with institutional live training", () => {
    expect(workforceAiReadinessProgram.industryAccelerator.durationHours).toEqual({ min: 6, max: 8 });
    expect(careerReadinessWorkshop.durationHours).toEqual({ min: 2, max: 3 });
    for (const pathway of industryAcceleratorPathways) {
      const minutes = pathway.lessonSequence.reduce((total, segment) => total + segment.minutes, 0);
      expect(minutes).toBeGreaterThanOrEqual(360);
      expect(minutes).toBeLessThanOrEqual(480);
    }
  });

  it("supports live remote and in-person delivery", () => {
    expect(workforceAiReadinessProgram.deliveryModes).toEqual(
      expect.arrayContaining(["live_remote", "in_person"]),
    );
  });

  it("keeps global product truth buyer-neutral", () => {
    const publicProductTruth = JSON.stringify(workforceAiReadinessProgram).toLowerCase();
    expect(publicProductTruth).not.toContain("kentucky");
    expect(publicProductTruth).not.toContain("scwdb");
    expect(publicProductTruth).not.toContain("south central workforce");
  });

  it("keeps healthcare operational and nonclinical", () => {
    const healthcare = industryAcceleratorPathways.find((pathway) => pathway.key === "healthcare");
    const text = JSON.stringify(healthcare).toLowerCase();
    expect(text).toContain("scheduling");
    expect(text).toContain("documentation support");
    expect(text).toContain("human");
    expect(text).not.toContain("diagnose");
    expect(text).not.toContain("prescribe");
  });

  it("gives every pathway an applied exercise, sample lesson, and explicit human-authority boundary", () => {
    for (const pathway of industryAcceleratorPathways) {
      expect(pathway.appliedExercise.title.length).toBeGreaterThan(0);
      expect(pathway.appliedExercise.participantTasks.length).toBeGreaterThan(1);
      expect(pathway.sampleLessonSegment.scenario.length).toBeGreaterThan(40);
      expect(pathway.sampleLessonSegment.instructorPrompts.length).toBeGreaterThanOrEqual(2);
      expect(pathway.sampleLessonSegment.learnerEvidence.length).toBeGreaterThanOrEqual(2);
      expect(pathway.humanAuthorityBoundary.length).toBeGreaterThan(20);
    }
  });
});
