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
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\.mobileDock[\s\S]*?position:\s*fixed;/);
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\.shell[\s\S]*?padding-bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\);/);
    expect(responsiveCss).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\[data-living-universe-stage="true"\][\s\S]*?padding-bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\);/);
  });

  it("adds a little more orb-to-disclosure clearance on narrow phones", () => {
    expect(responsiveCss).toMatch(/@media \(max-width: 520px\)[\s\S]*?#public-conversation-disclosure[\s\S]*?margin-top:\s*104px;/);
  });

  it("moves the control dock above content in the short viewport produced by real browser zoom", () => {
    expect(css).toMatch(
      /@media \(min-width: 521px\) and \(max-width: 768px\) and \(max-height: 600px\)[\s\S]*?\.mobileDock[\s\S]*?top:\s*90px;[\s\S]*?bottom:\s*auto;/,
    );
    expect(css).toMatch(
      /@media \(min-width: 521px\) and \(max-width: 768px\) and \(max-height: 600px\)[\s\S]*?\.stage[\s\S]*?padding-top:\s*122px;/,
    );
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

  it("gives every plane control an existing visible-surface Inspector target", () => {
    const markup = renderToStaticMarkup(createElement(PublicLivingGateway, { signupEnabled: false }));
    const controls = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);

    expect(new Set(controls)).toEqual(new Set([
      "public-plane-readout-desktop",
      "public-plane-readout-mobile",
    ]));
    for (const id of new Set(controls)) {
      expect(markup.match(new RegExp(`id="${id}"`, "g")) ?? []).toHaveLength(1);
    }
    expect(markup).toContain("Planes · Before, now &amp; next");
    expect(markup.match(/aria-label="Inspector"/g) ?? []).toHaveLength(2);
  });

  it("keeps the canonical desktop workspace bounded so the operational row enters the first fold", () => {
    expect(css).toMatch(/\.contextRail\s*\{[\s\S]*?max-height:\s*650px;[\s\S]*?overflow-y:\s*auto;/);
  });

  it("keeps only one mobile control drawer open at a time", () => {
    const source = readFileSync("src/components/marketing/public-living-gateway.tsx", "utf8");

    expect(source).toContain("openMobileDrawer");
    expect(source).toContain("setOpenMobileDrawer");
    expect(source).toContain("onToggle");
  });
});
