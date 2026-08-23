import { describe, expect, it } from "vitest";

import { canAccessEduRoute, eduNavigationForRole } from "@/lib/edu/edu-navigation";

describe("EDU evaluator demo kit access", () => {
  it("is available to administrators, instructors, and reviewers only", () => {
    for (const role of ["edu_admin", "edu_instructor", "edu_observer"] as const) {
      expect(canAccessEduRoute(role, "/edu/demo-kit")).toBe(true);
      expect(eduNavigationForRole(role).flatMap((group) => group.items.map((item) => item.href))).toContain("/edu/demo-kit");
    }
    expect(canAccessEduRoute("edu_student", "/edu/demo-kit")).toBe(false);
    expect(canAccessEduRoute("edu_assistant", "/edu/demo-kit")).toBe(false);
  });
});