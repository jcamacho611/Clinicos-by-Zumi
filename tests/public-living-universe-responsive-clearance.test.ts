import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/components/marketing/public-living-universe-shell.module.css", "utf8");

describe("public Living Universe responsive clearance", () => {
  it("reserves the Zumi orb footprint before the public safety disclosure", () => {
    expect(css).toMatch(/\.composerDock\s*\{[\s\S]*?padding-bottom:\s*20px;/);
    expect(css).toMatch(/\.disclosure\s*\{[\s\S]*?margin:\s*96px auto 0;/);
  });

  it("gives the fixed tablet/mobile action dock safe content clearance", () => {
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\.shell\s*\{\s*padding-bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\);\s*\}/);
    expect(css).toMatch(/\.mobileDock\s*\{[\s\S]*?bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom\)\);/);
  });

  it("adds a little more orb-to-disclosure clearance on narrow phones", () => {
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*?\.disclosure\s*\{\s*margin-top:\s*104px;\s*\}/);
  });
});
