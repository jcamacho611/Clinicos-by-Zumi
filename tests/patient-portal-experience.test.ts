import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("patient portal experience", () => {
  it("presents a patient-first next-step experience without clinic-workspace leakage", () => {
    const dashboard = read("src/components/portal/portal-dashboard.tsx");

    expect(dashboard).toContain("Next for you");
    expect(dashboard).toContain("Everything important is handled");
    expect(dashboard).toContain("Your appointments, assigned forms, and account balances are tied to your patient account.");
    expect(dashboard).toContain("Records, results, instructions, and clinic-to-patient messages appear only when the clinic has made them patient-visible or approved them for release.");
    expect(dashboard).toContain("Private patient session");
    expect(dashboard).toContain("Records and messages");
    expect(dashboard).toContain("Your portal stays separate from clinic staff access.");
    expect(dashboard).toContain("access to this portal is recorded.");
    expect(dashboard).toContain("const releasedRecords = data.records;");
    expect(dashboard).toContain("const portalMessages = data.messages;");
    expect(dashboard).toContain('form.completionMode === "patient"');
    expect(dashboard).toContain('["not_started", "in_progress"].includes(form.status)');
    expect(dashboard).not.toContain("data.records.slice(0, 6)");
    expect(dashboard).not.toContain("data.messages.slice(0, 5)");

    expect(dashboard).not.toContain("next portal workflow slice");
    expect(dashboard).not.toContain("generic calendar");
    expect(dashboard).not.toContain("MRN ");
    expect(dashboard).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("uses the Klinikos patient identity boundary and design tokens on sign-in", () => {
    const page = read("src/app/portal/login/page.tsx");
    const form = read("src/components/portal/portal-login-form.tsx");

    expect(page).toContain("Your care, without the maze.");
    expect(page).toContain("A separate patient identity boundary");
    expect(page).toContain("Your patient session cannot become a clinic staff session.");
    expect(page).toContain("<DsSurface>");
    expect(form).toContain("Open my portal");
    expect(form).toContain("var(--accent-signal)");

    expect(page).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(form).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
