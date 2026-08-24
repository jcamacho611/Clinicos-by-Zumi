import { describe, expect, it } from "vitest";

import {
  canTransitionCurriculumVersion,
  curriculumVersionRequiresApproval,
  type CurriculumVersionStatus,
} from "@/lib/edu/workforce-curriculum-versioning";

describe("workforce curriculum versioning", () => {
  it("permits the controlled lifecycle used for institutional delivery", () => {
    const path: CurriculumVersionStatus[] = ["draft", "review", "approved", "active", "retired", "archived"];
    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransitionCurriculumVersion(path[index], path[index + 1])).toBe(true);
    }
  });

  it("does not let draft content jump directly to active delivery", () => {
    expect(canTransitionCurriculumVersion("draft", "active")).toBe(false);
  });

  it("requires human approval before approved or active status", () => {
    expect(curriculumVersionRequiresApproval("draft")).toBe(false);
    expect(curriculumVersionRequiresApproval("review")).toBe(false);
    expect(curriculumVersionRequiresApproval("approved")).toBe(true);
    expect(curriculumVersionRequiresApproval("active")).toBe(true);
  });

  it("allows an active version to be retired but not silently edited back into draft", () => {
    expect(canTransitionCurriculumVersion("active", "retired")).toBe(true);
    expect(canTransitionCurriculumVersion("active", "draft")).toBe(false);
  });
});
