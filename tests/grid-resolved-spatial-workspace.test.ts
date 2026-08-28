import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

const entry = read("src/app/grid/page.tsx");
const browse = read("src/app/grid/browse/page.tsx");
const map = read("src/components/grid/grid-live-map.tsx");

describe("Grid resolved spatial workspace", () => {
  it("keeps the first viewport to Need, Have, and the Zumi-style exchange interaction", () => {
    expect(entry).toMatch(/WHAT DO YOU NEED\?/i);
    expect(entry).toMatch(/WHAT DO YOU HAVE\?/i);
    expect(entry).toContain("GridExchangeField");

    for (const firstViewportClutter of [
      "Open Grid map",
      ">Sign in<",
      "Say it naturally.",
      "Real supply only.",
      "Eligibility before ranking.",
      "No fake availability.",
      "Discovery can stay public.",
      "Open map →",
    ]) {
      expect(entry).not.toContain(firstViewportClutter);
    }
  });

  it("turns resolved intent directly into the map + inspector workspace instead of another taxonomy page", () => {
    expect(browse).toContain("<GridLiveMap");
    expect(browse).not.toContain("const lanes");
    expect(browse).not.toContain("const laneCopy");
    expect(browse).not.toContain("Grid discovery lanes");
    expect(browse).not.toContain("<UniversalResourceBrowser");
    expect(browse).not.toContain("<MarketplaceBrowser");
    expect(browse).not.toContain("Start with the map. Narrow the exchange around what you need.");
  });

  it("makes the real map primary, results the inspector, and preserves active intent in a bottom context bar", () => {
    expect(map).toContain('data-grid-spatial-workspace');
    expect(map).toContain('lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.65fr)]');
    expect(map).toContain('aria-label="Grid match inspector"');
    expect(map).toContain('data-grid-context-bar');
    expect(map).toContain("activeContext");
    expect(map).toContain("Discovery");
  });

  it("shows truthful ten-mile emptiness with only real next actions", () => {
    expect(map).toContain("Nothing currently matches within 10 miles.");
    expect(map).toContain("Keep this need active");
    expect(map).toContain("Expand area");
    expect(map).toContain("Adjust time");
    expect(map).toContain("Ask Zumi");
    expect(map).not.toContain("27 providers nearby");
    expect(map).not.toContain("fake pin");
  });
});
