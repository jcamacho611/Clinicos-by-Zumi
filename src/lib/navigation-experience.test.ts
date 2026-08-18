import { describe, expect, it } from "vitest";
import { clinicRoles } from "@/lib/auth/rbac";
import {
  canOpen,
  exploreNavigationForRole,
  klinikosPromptForWorkspace,
  primaryNavigationForRole,
} from "@/lib/navigation-experience";

// Reuse the production predicate rather than restating it. A test that reimplements the
// rule it is checking will eventually disagree with it — the previous local copy read
// `/grid/workspace` as a workspace named "grid/workspace" and reported it unauthorized.
const isReachable = canOpen;

describe("Klinikos progressive navigation", () => {
  it("keeps every role at five or fewer persistent destinations", () => {
    for (const role of clinicRoles) {
      expect(primaryNavigationForRole(role).length).toBeLessThanOrEqual(5);
    }
  });

  it("never puts an unauthorized destination in primary navigation", () => {
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        expect(isReachable(role, item.href)).toBe(true);
      }
    }
  });

  it("keeps deeper authorized capability in Explore without duplicating primary links", () => {
    for (const role of clinicRoles) {
      const primary = primaryNavigationForRole(role);
      const primaryHrefs = new Set(primary.map((item) => item.href));
      const explore = exploreNavigationForRole(role, primaryHrefs);
      for (const group of explore) {
        for (const item of group.items) {
          expect(primaryHrefs.has(item.href)).toBe(false);
          expect(isReachable(role, item.href)).toBe(true);
        }
      }
    }
  });

  it("uses outcome-oriented ambient prompts rather than announcing an AI product", () => {
    expect(klinikosPromptForWorkspace("dashboard")).toBe("What needs to happen?");
    expect(klinikosPromptForWorkspace("grid")).toBe("What do you need or have?");
    expect(klinikosPromptForWorkspace("billing")).toContain("money");
    expect(klinikosPromptForWorkspace("patients")).toContain("patients");
    expect(klinikosPromptForWorkspace("unknown")).toBe("Ask Klinikos about this work…");
  });
});
