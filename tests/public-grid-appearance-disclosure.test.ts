import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("Grid public appearance and truth", () => {
  const browse = read("src/app/grid/browse/page.tsx");
  const materials = read("src/lib/design/marketplace-system.ts");
  const map = read("src/components/grid/grid-live-map.tsx");

  it("does not force the legacy Marble compatibility class over a Dark preference", () => {
    expect(browse).toContain("marketplaceSurfaces.browsePage");
    expect(materials).toMatch(/browsePage:\s*"[^"]*bg-\[var\(--k-work-bg\)\]/);
    expect(materials).not.toMatch(/browsePage:\s*"[^"]*grid-marble-surface/);
    expect(materials).toMatch(/page:\s*"[^"]*grid-marble-surface/);
    expect(map).not.toContain('className="grid-marble-surface');
    expect(materials).toContain("var(--k-work-bg)");
    expect(map).toContain("var(--k-work-bg)");
    expect(materials).toContain('filterBar: "sticky top-[72px]');
  });

  it("puts the synthetic inventory boundary before discovery results as a prominent note", () => {
    expect(browse).toContain('data-grid-synthetic-disclosure="true"');
    expect(browse).toContain('role="note"');
    expect(browse).toContain("Reference environment — not live supply");
    expect(browse.indexOf("data-grid-synthetic-disclosure")).toBeLessThan(browse.indexOf("<GridLiveMap"));
    expect(browse).toContain("MARKETPLACE_SYNTHETIC_NOTICE");
    expect(browse).toContain("LISTING_NOT_VERIFICATION_NOTICE");
  });

  it("labels the how-it-works product view as illustrative before the example", () => {
    const how = read("src/app/how-it-works/page.tsx");
    expect(how).toContain('data-public-example-disclosure="true"');
    expect(how).toContain("Illustrative reference environment");
    expect(how.indexOf("data-public-example-disclosure")).toBeLessThan(how.indexOf("<ProductEvidenceFigure"));
  });
});
