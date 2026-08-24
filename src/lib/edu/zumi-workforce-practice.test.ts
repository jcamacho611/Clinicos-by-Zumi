import { describe, expect, it } from "vitest";

import { getEduZumiPracticeMode, mayUseEduZumiPracticeMode } from "@/lib/edu/zumi-workforce-practice";

describe("Klinikos EDU Zumi practice modes", () => {
  it("maps learner coaching to the governed guided-practice capability", () => {
    expect(getEduZumiPracticeMode("guided_practice")?.capability).toBe("edu_guided_practice");
  });

  it("lets students critique AI output but not use instructor assistance", () => {
    expect(mayUseEduZumiPracticeMode("edu_student", "output_critique")).toBe(true);
    expect(mayUseEduZumiPracticeMode("edu_student", "instructor_assist")).toBe(false);
  });

  it("allows instructors to use instructor assistance without transferring authority", () => {
    const mode = getEduZumiPracticeMode("instructor_assist");
    expect(mayUseEduZumiPracticeMode("edu_instructor", "instructor_assist")).toBe(true);
    expect(mode?.authorityBoundary).toContain("instructor");
  });
});
