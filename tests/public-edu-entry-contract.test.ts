import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("public Klinikos EDU entry", () => {
  it("opens as an academy launcher rather than reference tables", () => {
    const page = read("src/app/edu/page.tsx");
    expect(page).toContain("How are you entering Klinikos EDU?");
    expect(page).toContain("learner");
    expect(page).toContain("instructor");
    expect(page).toContain("institution");
    expect(page).not.toContain("Every student runs a real position.");
    expect(page).not.toContain("Curriculum-ready packages");
    expect(page).not.toContain("<table");
  });

  it("keeps direct EDU entry terms-first and the synthetic non-licensure boundary visible", () => {
    const page = read("src/app/edu/page.tsx");
    expect(page).toContain("PublicPlatformShell");
    expect(page).toContain("Synthetic training data only");
    expect(page).toContain("does not grant licensure, clinical authority, or Grid eligibility");
  });

  it("routes each mode into existing product surfaces instead of a dead marketing CTA", () => {
    const page = read("src/app/edu/page.tsx");
    expect(page).toContain('href="/edu/dashboard"');
    expect(page).toContain('href="/edu/lab"');
    expect(page).toContain('href="/sales"');
  });
});
