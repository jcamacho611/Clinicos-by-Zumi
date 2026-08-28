import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const gateway = read("src/components/marketing/public-living-gateway.tsx");
const cinematicCss = read("src/app/cinematic-home-overrides.css");
const productEvidence = read("src/components/marketing/product-evidence-section.tsx");
const ecosystem = read("src/components/marketing/ecosystem-hierarchy.tsx");
const footer = read("src/components/marketing/public-trust-footer.tsx");

describe("public hero rose containment", () => {
  it("bounds the public hero to one viewport-owned stacking context", () => {
    expect(cinematicCss).toMatch(/\.rose-home\s*\{[^}]*position:\s*relative;[^}]*height:\s*100vh;[^}]*overflow:\s*hidden;/s);
    expect(cinematicCss).not.toMatch(/\.rose-home\s*\{[^}]*min-height:\s*100vh;/s);
  });

  it("keeps the rose and vignette inside the hero instead of fixing them to the viewport", () => {
    expect(gateway).toContain('rose-vignette pointer-events-none absolute inset-0 z-0');
    expect(gateway).toContain('rose-atmosphere pointer-events-none absolute inset-0 z-0');
    expect(gateway).not.toContain('rose-vignette pointer-events-none fixed');
    expect(gateway).not.toContain('rose-atmosphere pointer-events-none fixed');
  });

  it("puts hero content above the atmospheric layer with one explicit content plane", () => {
    expect(cinematicCss).toMatch(/\.rose-home > header,\s*\.rose-home > main\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
    expect(cinematicCss).toMatch(/\.rose-home \.rose-vignette,\s*\.rose-home \.rose-atmosphere\s*\{[^}]*z-index:\s*0\s*!important;/s);
  });

  it("gives every homepage surface below the hero its own opaque obsidian ground", () => {
    expect(productEvidence).toContain('bg-[#050303]');
    expect(ecosystem).toContain('backgroundColor: "#070304"');
    expect(footer).toContain('bg-[#050303]');
  });
});
