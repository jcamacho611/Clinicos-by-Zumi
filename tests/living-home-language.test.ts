import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Living Home customer language", () => {
  it("keeps orchestration vocabulary in the backend while presenting plain next-step language", () => {
    const source = read("src/components/clinic/living-home.tsx");
    // Import specifiers are backend module paths, not copy a user ever reads. Checking
    // them would flag `@/lib/orchestration/intent-engine` — the engine Living Home is
    // meant to call — as a customer-facing jargon leak.
    const home = source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];$/gm, "");

    for (const leakedPhrase of [
      "Path started",
      "Open Path",
      "create a Path",
      "live Path state",
      "resolved the next governed action",
      // The briefing composer translates these before they reach the component, so
      // none of them should ever appear in Living Home markup.
      "orchestration",
      "capability registry",
      "entitlement",
      "state machine",
      "riskKind",
      "actionKind",
      "awaiting_connection",
    ]) {
      expect(home).not.toContain(leakedPhrase);
    }

    // A person can still state an outcome instead of hunting for the right screen.
    expect(home).toContain("What needs to happen?");
    expect(home).toContain("Here's the safest next step.");
    // Work already in motion is offered as "Continue", not as an engine concept.
    expect(home).toMatch(/>Continue</);
    // The verdict is allowed to say nothing is wrong.
    expect(home).toContain("Everything important is handled.");
    // Evidence is shown in clinic language rather than as a provenance dump.
    expect(home).toContain("Why you are seeing this");
    expect(home).toContain("What this is based on");
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
