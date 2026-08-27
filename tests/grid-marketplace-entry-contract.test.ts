import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Grid marketplace entry", () => {
  it("opens the canonical Grid route into the real live spatial marketplace", () => {
    const page = read("src/app/grid/page.tsx");
    expect(page).toContain("PublicPlatformShell");
    expect(page).toContain("GridLiveMap");
    expect(page).toContain("GridExchangeField");
    expect(page).not.toContain("buyLanes.map");
    expect(page).not.toContain("sellLanes.map");
  });

  it("treats the map and result ledger as one workspace rather than a marketing section", () => {
    const map = read("src/components/grid/grid-live-map.tsx");
    expect(map).toContain("data-grid-map-ledger");
    expect(map).not.toContain("One geographic field for real published healthcare capacity");
    expect(map).not.toContain("Spatial Grid");
  });

  it("keeps the old browse route as a narrow compatibility redirect", () => {
    const browse = read("src/app/grid/browse/page.tsx");
    expect(browse).toContain('redirect(');
    expect(browse).toContain('"/grid"');
    expect(browse).not.toContain("GridLiveMap");
    expect(browse).not.toContain("UniversalResourceBrowser");
  });

  it("preserves the no-fake-pin and real-inventory map foundation", () => {
    const provider = read("src/components/grid/google-grid-map.tsx");
    expect(provider).toContain("OpenFreeMap");
    expect(provider).toContain("navigator.geolocation");
    expect(provider).not.toContain("fake");
  });
});
