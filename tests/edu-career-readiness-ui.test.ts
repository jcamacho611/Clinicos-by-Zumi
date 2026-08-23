import { describe, expect, it } from "vitest";

import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import { kentuckyCareerReadinessWorkshop } from "@/lib/edu/kentucky-ai-workforce";

describe("AI-Powered Career Readiness evaluator contract", () => {
  it("is a two-to-three-hour live workshop", () => {
    expect(kentuckyCareerReadinessWorkshop.durationHours).toEqual({ minimum: 2, maximum: 3 });
    expect(kentuckyCareerReadinessWorkshop.deliveryModes).toEqual(expect.arrayContaining(["in_person", "live_remote"]));
  });

  it("covers resume, job search, applications, communication, interviews, and after-hire AI use", () => {
    const keys = aiCareerReadinessModule.activities.map((activity) => activity.key);
    expect(keys).toEqual(expect.arrayContaining([
      "resume_truth_check",
      "job_search_strategy",
      "application_alignment",
      "professional_communication",
      "interview_practice",
      "after_hire_ai_use",
    ]));
  });

  it("forbids credential and employment fabrication", () => {
    const prohibited = aiCareerReadinessModule.activities.flatMap((activity) => activity.prohibited);
    expect(prohibited).toEqual(expect.arrayContaining(["inventing credentials", "inventing employment"]));
  });
});