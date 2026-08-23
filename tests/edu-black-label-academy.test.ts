import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = fs.readFileSync(path.join(process.cwd(), "src/app/edu/(lab)/layout.tsx"), "utf8");
const shell = fs.readFileSync(path.join(process.cwd(), "src/components/edu/edu-shell.tsx"), "utf8");
const dashboard = fs.readFileSync(path.join(process.cwd(), "src/app/edu/(lab)/dashboard/page.tsx"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/components/edu/edu-black-label.module.css"), "utf8");

describe("Klinikos EDU Black Label academy", () => {
  it("preserves resolved EDU identity and institution context", () => {
    expect(layout).toContain("resolveEduIdentity()");
    expect(layout).toContain("educationInstitution.findUnique");
    expect(layout).toContain("<EduShell");
  });

  it("keeps synthetic-data classification visible in the shared shell", () => {
    expect(shell).toContain("SYNTHETIC_DATA_LABELS");
    expect(shell).toContain('aria-label="Data classification"');
    expect(shell).toContain("Virtual Clinic Lab");
  });

  it("uses one shared academy shell instead of a separate learner or instructor application", () => {
    expect(shell).toContain("eduNavigationForRole(role)");
    expect(shell).toContain('data-edu-role={role}');
    expect(shell).not.toContain("InstructorShell");
    expect(shell).not.toContain("StudentShell");
  });

  it("makes mobile navigation a deliberate disclosure instead of a full stacked sidebar", () => {
    expect(shell).toContain('className={styles.mobileNav}');
    expect(shell).toContain("<details");
    expect(shell).toContain("Browse EDU");
  });

  it("turns the dashboard into active-work-first progression rather than a generic KPI card row", () => {
    expect(dashboard).toContain('data-edu-active-work');
    expect(dashboard).toContain("What needs attention");
    expect(dashboard).not.toContain("xl:grid-cols-4");
    expect(dashboard).not.toContain("StatCard");
  });

  it("uses Black Label academy materials with an Obsidian rail and editorial work surface", () => {
    expect(style).toContain("--edu-canvas: var(--k-work-bg");
    expect(style).toContain("--edu-text: var(--k-text");
    expect(style).toContain("--edu-accent: var(--k-accent");
    expect(style).toContain(".rail");
    expect(style).toContain("#070304");
    expect(style).toContain(".workspace");
  });

  it("keeps touched EDU labels above the Black Label micro-text floor", () => {
    expect(shell).not.toContain('text-[11px]');
    expect(shell).not.toContain('text-[10px]');
    expect(dashboard).not.toContain('text-[11px]');
    expect(dashboard).not.toContain('text-[10px]');
  });
});
