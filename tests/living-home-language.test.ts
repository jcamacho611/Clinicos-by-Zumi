import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Living Home customer language", () => {
  it("keeps orchestration vocabulary in the backend while presenting plain next-step language", () => {
    const home = read("src/components/clinic/living-home.tsx");

    for (const leakedPhrase of [
      "Path started",
      "Open Path",
      "create a Path",
      "live Path state",
      "resolved the next governed action",
    ]) {
      expect(home).not.toContain(leakedPhrase);
    }

    expect(home).toContain("What needs to happen?");
    expect(home).toContain("Here's the safest next step.");
    expect(home).toContain(">Continue <");
  });

  it("keeps the full workspace catalog available without dumping it on Home", () => {
    const launchpad = read("src/components/clinic/workspace-launchpad.tsx");

    for (const leakedPhrase of [
      "Everything you can use",
      "Find any Klinikos pathway from Home.",
      "Grid workspace",
      "Grid tools",
      "Network views",
    ]) {
      expect(launchpad).not.toContain(leakedPhrase);
    }

    expect(launchpad).toContain("More when you need it");
    expect(launchpad).toContain("Home keeps the important work up front.");
    expect(launchpad).toContain("<details");
  });
});
