import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/grid/browse/page.tsx"), "utf8");
const map = fs.readFileSync(path.join(process.cwd(), "src/components/grid/grid-live-map.tsx"), "utf8");
const marketplace = fs.readFileSync(path.join(process.cwd(), "src/components/grid/marketplace-browser.tsx"), "utf8");
const resources = fs.readFileSync(path.join(process.cwd(), "src/components/grid/universal-resource-browser.tsx"), "utf8");
const system = fs.readFileSync(path.join(process.cwd(), "src/lib/design/marketplace-system.ts"), "utf8");

describe("Grid Black Label spatial discovery", () => {
  it("keeps the real map and existing governed data sources", () => {
    expect(page).toContain("<GridLiveMap");
    expect(page).toContain("listMarketplaceListings()");
    expect(page).toContain("listMarketplaceLocations()");
    expect(page).toContain("listPublicGridResources()");
    expect(page).toContain("LISTING_NOT_VERIFICATION_NOTICE");
    expect(page).toContain("MARKETPLACE_SYNTHETIC_NOTICE");
  });

  it("keeps results-first mobile and map-ledger synchronization", () => {
    expect(map).toContain('useState<"map" | "list">("list")');
    expect(map).toContain('setMobileView("map")');
    expect(map).toContain('setMobileView("list")');
    expect(map).toContain("onPointSelect={selectFromMap}");
    expect(map).toContain("grid-map-result-");
    expect(map).toContain("selectedPointId");
  });

  it("preserves location/radius truth and never fabricates unpinned inventory", () => {
    expect(map).toContain("rankGridCoordinatesByDistance");
    expect(map).toContain("unmappedResources");
    expect(map).toContain("exact distance cannot be calculated");
    expect(map).toContain("not pinned because a reviewed map position has not been supplied");
    expect(map).toContain("Grid does not pull unpinned inventory into an exact-radius result");
  });

  it("presents marketplace services as a ledger rather than a three-column card wall", () => {
    expect(marketplace).toContain('data-grid-ledger="services"');
    expect(marketplace).toContain('data-grid-ledger-row="service"');
    expect(marketplace).not.toContain("xl:grid-cols-3");
    expect(marketplace).not.toContain("hover:-translate-y-0.5");
  });

  it("presents reviewed universal capacity as ledger rows", () => {
    expect(resources).toContain('data-grid-ledger="resources"');
    expect(resources).toContain('data-grid-ledger-row="resource"');
    expect(resources).not.toContain("xl:grid-cols-3");
  });

  it("keeps readiness/trust before commercial terms", () => {
    const verification = marketplace.indexOf("presentVerification");
    const terms = marketplace.indexOf("Terms / rate");
    expect(verification).toBeGreaterThan(-1);
    expect(terms).toBeGreaterThan(verification);
    expect(marketplace).not.toContain("AI score");
    expect(marketplace).not.toContain("rating");
  });

  it("uses shared Klinikos material variables and the Black Label text/target floor", () => {
    expect(system).toContain("var(--k-work-bg)");
    expect(system).toContain("var(--k-public-surface)");
    expect(system).toContain("var(--k-text)");
    expect(system).toContain("var(--k-muted)");
    expect(system).toContain("var(--k-line)");
    expect(system).toContain("var(--k-accent)");
    expect(system).toContain('eyebrow: "text-xs');
    expect(system).not.toContain('text-[11px]');
    expect(map).toContain("min-h-11");
  });
});
