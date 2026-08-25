import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SELF_HARM_VISIBLE_ROLES, hidesSelfHarmFrom } from "@/lib/safety/self-harm-visibility";

describe("who may see a self-harm signal", () => {
  it("names the roles that can act on staff welfare", () => {
    expect([...SELF_HARM_VISIBLE_ROLES]).toEqual(["clinic_owner", "administrator", "provider"]);
  });

  it("hides it from roles that hold escalations:read without a basis to act", () => {
    for (const role of ["biller", "quality", "viewer", "front_desk", "registered_nurse", "case_manager", "clinical_staff"]) {
      expect(hidesSelfHarmFrom(role), role).toBe(true);
    }
  });

  it("shows it to the roles that can", () => {
    for (const role of SELF_HARM_VISIBLE_ROLES) {
      expect(hidesSelfHarmFrom(role), role).toBe(false);
    }
  });

  it("fails closed on an absent role", () => {
    expect(hidesSelfHarmFrom(undefined)).toBe(true);
    expect(hidesSelfHarmFrom(null)).toBe(true);
    expect(hidesSelfHarmFrom("")).toBe(true);
  });

  /**
   * The reason this rule lives in one module.
   *
   * Two places need the answer: the queue that hides these rows, and the check that
   * tells the person whether anyone will see their escalation. If those disagreed,
   * Klinikos would either hide a row while promising someone will read it, or warn that
   * nobody can see a row that is plainly visible. Both are worse than either rule alone.
   */
  it("is consulted by both the queue filter and the eligible-viewer check", () => {
    const queue = readFileSync(
      join(process.cwd(), "src/lib/repositories/care-coordination-repository.ts"),
      "utf8",
    );
    const escalation = readFileSync(
      join(process.cwd(), "src/lib/safety/urgent-escalation-repository.ts"),
      "utf8",
    );

    expect(queue).toContain('from "@/lib/safety/self-harm-visibility"');
    expect(escalation).toContain('from "@/lib/safety/self-harm-visibility"');

    // Neither may keep a private copy of the role list.
    for (const [name, source] of [["queue", queue], ["escalation", escalation]] as const) {
      expect(source, name).not.toMatch(/\[\s*"clinic_owner",\s*"administrator",\s*"provider"\s*\]/);
    }
  });
});
