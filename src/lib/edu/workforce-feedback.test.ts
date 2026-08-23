import { describe, expect, it } from "vitest";

import { canSubmitWorkforceFeedback, workforceSurveyKindForRole } from "@/lib/edu/workforce-feedback";

describe("workforce feedback authority", () => {
  it("derives participant feedback from student identity", () => {
    expect(workforceSurveyKindForRole("edu_student")).toBe("participant");
  });

  it("derives instructional feedback from teaching staff", () => {
    expect(workforceSurveyKindForRole("edu_instructor")).toBe("instructor");
    expect(workforceSurveyKindForRole("edu_assistant")).toBe("instructor");
    expect(workforceSurveyKindForRole("edu_admin")).toBe("instructor");
  });

  it("does not treat program observers as survey participants", () => {
    expect(canSubmitWorkforceFeedback("edu_observer")).toBe(false);
  });
});
