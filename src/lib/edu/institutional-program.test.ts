import { describe, expect, it } from "vitest";
import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import { assertInstitutionalProgramTemplate } from "@/lib/edu/institutional-program";
import { kentuckyHealthcareAiWorkforceTemplate } from "@/lib/edu/kentucky-ai-workforce";

describe("institutional EDU workforce templates", () => {
  it("keeps the Kentucky pathway explicitly proposed rather than approved", () => {
    expect(kentuckyHealthcareAiWorkforceTemplate.templateStatus).toBe("proposed_demo_template");
    expect(kentuckyHealthcareAiWorkforceTemplate.deliveryModes).toEqual(expect.arrayContaining(["in_person", "live_remote"]));
    expect(kentuckyHealthcareAiWorkforceTemplate.completionRule.requireInstructorReview).toBe(true);
  });

  it("requires certificate language that does not manufacture licensure or certification", () => {
    expect(kentuckyHealthcareAiWorkforceTemplate.certificate.disclaimer.toLowerCase()).toContain("does not");
    expect(kentuckyHealthcareAiWorkforceTemplate.certificate.disclaimer.toLowerCase()).toContain("license");
  });

  it("rejects institutional templates that remove instructor completion authority", () => {
    expect(() => assertInstitutionalProgramTemplate({
      ...kentuckyHealthcareAiWorkforceTemplate,
      key: "unsafe",
      completionRule: { ...kentuckyHealthcareAiWorkforceTemplate.completionRule, requireInstructorReview: false },
    })).toThrow(/instructor authority/i);
  });

  it("keeps career readiness grounded in truthful learner qualifications", () => {
    expect(aiCareerReadinessModule.authorityRule.toLowerCase()).toContain("factual accuracy");
    const prohibited = aiCareerReadinessModule.activities.flatMap((activity) => activity.prohibited);
    expect(prohibited).toEqual(expect.arrayContaining(["inventing credentials", "inventing employment"]));
  });
});
