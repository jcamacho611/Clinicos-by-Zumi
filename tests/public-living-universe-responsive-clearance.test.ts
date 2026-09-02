import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";

const css = readFileSync("src/components/marketing/public-living-universe-shell.module.css", "utf8");
const responsiveCss = readFileSync(
  "src/components/marketing/public-living-universe-responsive.module.css",
  "utf8",
);
const page = readFileSync("src/app/page.tsx", "utf8");

describe("public Living Universe responsive clearance", () => {
  it("scopes the responsive fix around the public Living Universe only", () => {
    expect(page).toContain("public-living-universe-responsive.module.css");
    expect(page).toContain("responsiveStyles.releaseSurface");
    expect(responsiveCss).toContain(".releaseSurface :global([data-public-action-dock])");
  });

  it("reserves the Zumi orb footprint before the public safety disclosure", () => {
    expect(page).toContain("responsiveStyles.releaseSurface");
    expect(responsiveCss).toMatch(/\[data-public-action-dock\][\s\S]*?padding-bottom:\s*20px !important;/);
    expect(responsiveCss).toMatch(/#public-conversation-disclosure[\s\S]*?margin-top:\s*96px;/);
  });

  it("gives the fixed tablet/mobile action dock safe content clearance", () => {
    expect(responsiveCss).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\[data-living-universe-stage="true"\][\s\S]*?padding-bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\);/);
    expect(responsiveCss).toMatch(/nav\[aria-label="Living Universe mobile controls"\][\s\S]*?bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom\)\);/);
  });

  it("adds a little more orb-to-disclosure clearance on narrow phones", () => {
    expect(responsiveCss).toMatch(/@media \(max-width: 520px\)[\s\S]*?#public-conversation-disclosure[\s\S]*?margin-top:\s*104px;/);
  });

  it("lets every right-rail plane label wrap instead of clipping its meaning", () => {
    const summaryRules = Array.from(css.matchAll(/\.planeButton small\s*\{([\s\S]*?)\}/g))
      .map((match) => match[1])
      .join("\n");

    expect(summaryRules).toContain("overflow-wrap: anywhere");
    expect(summaryRules).toContain("white-space: normal");
    expect(summaryRules).not.toContain("text-overflow: ellipsis");
  });

  it("introduces the universal healthcare network without narrowing entry to clinic operators", () => {
    const markup = renderToStaticMarkup(createElement(PublicLivingGateway, { signupEnabled: false }));

    expect(markup).toContain("One intelligent operating network for healthcare.");
    expect(markup).not.toContain("Run your clinic from one intelligent operating system.");
  });
});
