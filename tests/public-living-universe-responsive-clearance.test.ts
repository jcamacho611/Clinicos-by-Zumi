import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/components/marketing/public-living-universe-responsive.module.css", "utf8");
const page = readFileSync("src/app/page.tsx", "utf8");

describe("public Living Universe responsive clearance", () => {
  it("scopes the responsive fix around the public Living Universe only", () => {
    expect(page).toContain("public-living-universe-responsive.module.css");
    expect(page).toContain("responsiveStyles.releaseSurface");
    expect(css).toContain(".releaseSurface :global([data-public-action-dock])");
  });

  it("reserves the Zumi orb footprint before the public safety disclosure", () => {
    expect(css).toMatch(/\[data-public-action-dock\][\s\S]*?padding-bottom:\s*20px !important;/);
    expect(css).toMatch(/#public-conversation-disclosure\)[\s\S]*?margin-top:\s*96px;/);
  });

  it("gives the fixed tablet/mobile action dock safe content clearance", () => {
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\[data-living-universe-stage="true"\][\s\S]*?padding-bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\);/);
    expect(css).toMatch(/nav\[aria-label="Living Universe mobile controls"\][\s\S]*?bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom\)\);/);
  });

  it("adds a little more orb-to-disclosure clearance on narrow phones", () => {
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*?#public-conversation-disclosure\)[\s\S]*?margin-top:\s*104px;/);
  });
});
