import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Living Home customer language", () => {
  it("keeps orchestration vocabulary in the backend while presenting an operating briefing", () => {
    // Home is one surface across two files: the composer/rails shell and the standing
    // operating picture it switches to when it is not working on a request. The guard
    // reads both so moving a section between them cannot quietly drop the check.
    const home = read("src/components/clinic/living-home.tsx") + read("src/components/clinic/living-home-operations.tsx");

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
    expect(home).toContain("Show me the next step");
    expect(home).toContain("Needs you");
    expect(home).toContain("Already handled");
    expect(home).toContain("Continue");
    expect(home).toContain("Coming up");
    expect(home).toContain("Opportunity");
    expect(home).toContain(">Why<");
    expect(home).toContain("Evidence · direct record");
    expect(home).not.toContain("{activeGuidance?.state}");
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
    expect(launchpad).toContain("Keep the whole product available without putting it all in your face.");
    expect(launchpad).toContain("These deeper areas stay collapsed until you need something specific.");
    expect(launchpad).toContain("<details");
  });
});
