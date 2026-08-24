import { describe, expect, it } from "vitest";

import { canAccessEduRoute, eduNavigationForRole } from "@/lib/edu/edu-navigation";

describe("workforce reports UI contract", () => {
  it("shows reports to administrators, instructors, and reviewers but not students", () => {
    const adminItems = eduNavigationForRole("edu_admin").flatMap((group) => group.items.map((item) => item.href));
    const instructorItems = eduNavigationForRole("edu_instructor").flatMap((group) => group.items.map((item) => item.href));
    const observerItems = eduNavigationForRole("edu_observer").flatMap((group) => group.items.map((item) => item.href));
    const studentItems = eduNavigationForRole("edu_student").flatMap((group) => group.items.map((item) => item.href));

    expect(adminItems).toContain("/edu/reports");
    expect(instructorItems).toContain("/edu/reports");
    expect(observerItems).toContain("/edu/reports");
    expect(studentItems).not.toContain("/edu/reports");
  });

  it("enforces the same report boundary at route-access level", () => {
    expect(canAccessEduRoute("edu_admin", "/edu/reports")).toBe(true);
    expect(canAccessEduRoute("edu_instructor", "/edu/reports")).toBe(true);
    expect(canAccessEduRoute("edu_observer", "/edu/reports")).toBe(true);
    expect(canAccessEduRoute("edu_assistant", "/edu/reports")).toBe(false);
    expect(canAccessEduRoute("edu_student", "/edu/reports")).toBe(false);
  });
});