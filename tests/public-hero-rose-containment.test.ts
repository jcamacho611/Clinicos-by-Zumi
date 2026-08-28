import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function ruleBody(css: string, selector: string) {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  expect(start, `missing CSS rule: ${selector}`).toBeGreaterThanOrEqual(0);
  const bodyStart = css.indexOf("{", start) + 1;
  const bodyEnd = css.indexOf("}", bodyStart);
  expect(bodyEnd, `unterminated CSS rule: ${selector}`).toBeGreaterThan(bodyStart);
  return css.slice(bodyStart, bodyEnd);
}

const gateway = read("src/components/marketing/public-living-gateway.tsx");
const cinematicCss = read("src/app/cinematic-home-overrides.css");
const productEvidence = read("src/components/marketing/product-evidence-section.tsx");
const ecosystem = read("src/components/marketing/ecosystem-hierarchy.tsx");
const footer = read("src/components/marketing/public-trust-footer.tsx");

describe("public hero rose containment", () => {
  it("bounds the public hero to one viewport-owned stacking context", () => {
    const hero = ruleBody(cinematicCss, ".rose-home");
    expect(hero).toContain("position: relative;");
    expect(hero).toContain("height: 100vh;");
    expect(hero).toContain("overflow: hidden;");
    expect(hero).not.toContain("min-height: 100vh;");
  });

  it("keeps the rose and vignette inside the hero instead of fixing them to the viewport", () => {
    expect(gateway).toContain('rose-vignette pointer-events-none absolute inset-0 z-0');
    expect(gateway).toContain('rose-atmosphere pointer-events-none absolute inset-0 z-0');
    expect(gateway).not.toContain('rose-vignette pointer-events-none fixed');
    expect(gateway).not.toContain('rose-atmosphere pointer-events-none fixed');
  });

  it("puts hero content above the atmospheric layer with one explicit content plane", () => {
    const atmosphere = ruleBody(cinematicCss, ".rose-home .rose-vignette,\n.rose-home .rose-atmosphere");
    const content = ruleBody(cinematicCss, ".rose-home > header,\n.rose-home > main");
    expect(atmosphere).toContain("z-index: 0 !important;");
    expect(content).toContain("position: relative;");
    expect(content).toContain("z-index: 1;");
    expect(content).not.toContain("z-index: 10;");
  });

  it("gives every homepage surface below the hero its own opaque obsidian ground", () => {
    expect(productEvidence).toContain('bg-[#050303]');
    expect(ecosystem).toContain('backgroundColor: "#070304"');
    expect(footer).toContain('bg-[#050303]');
  });
});
