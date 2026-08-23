import { describe, expect, it } from "vitest";

import { canAccessEduRoute, eduNavigationForRole } from "@/lib/edu/edu-navigation";
import { kentuckyAiWorkforceProgram, kentuckyIndustryPathways } from "@/lib/edu/kentucky-ai-workforce";

describe("Kentucky program UI contract", () => {
  it("shows Programs to instructional roles and reviewers but not students", () => {
    const instructorItems = eduNavigationForRole("edu_instructor").flatMap((group) => group.items.map((item) => item.href));
    const observerItems = eduNavigationForRole("edu_observer").flatMap((group) => group.items.map((item) => item.href));
    const studentItems = eduNavigationForRole("edu_student").flatMap((group) => group.items.map((item) => item.href));

    expect(instructorItems).toContain("/edu/programs");
    expect(observerItems).toContain("/edu/programs");
    expect(studentItems).not.toContain("/edu/programs");
  });

  it("server route access preserves the same Programs boundary", () => {
    expect(canAccessEduRoute("edu_admin", "/edu/programs")).toBe(true);
    expect(canAccessEduRoute("edu_instructor", "/edu/programs/healthcare")).toBe(true);
    expect(canAccessEduRoute("edu_observer", "/edu/programs/logistics")).toBe(true);
    expect(canAccessEduRoute("edu_student", "/edu/programs")).toBe(false);
  });

  it("exposes every required pathway plus Career Readiness from one program", () => {
    expect(kentuckyIndustryPathways).toHaveLength(5);
    expect(kentuckyAiWorkforceProgram.services).toEqual(expect.arrayContaining(["industry_accelerator", "career_readiness"]));
  });
});