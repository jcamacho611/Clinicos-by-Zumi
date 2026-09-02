import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("Grid public appearance and truth", () => {
  const browse = read("src/app/grid/browse/page.tsx");
  const materials = read("src/lib/design/marketplace-system.ts");
  const publicBrowseComponents = [
    "src/components/grid/grid-exchange-field.tsx",
    "src/components/grid/grid-live-map.tsx",
    "src/components/grid/google-grid-map.tsx",
    "src/components/grid/universal-resource-browser.tsx",
    "src/components/grid/marketplace-browser.tsx",
  ].map((path) => ({ path, source: read(path) }));

  it("uses public appearance materials for browse while preserving listing-detail Marble", () => {
    expect(browse).toContain("marketplaceSurfaces.browsePage");
    expect(materials).toMatch(/browsePage:\s*"[^"]*bg-\[var\(--k-public-bg\)\]/);
    expect(materials).not.toMatch(/browsePage:\s*"[^"]*grid-marble-surface/);
    expect(materials).toMatch(/page:\s*"[^"]*grid-marble-surface/);
    expect(materials).toMatch(/page:\s*"[^"]*bg-\[var\(--k-work-bg\)\]/);
    expect(materials).toContain('filterBar: "sticky top-[72px]');
  });

  it("keeps every public-browse state on shared semantic tokens", () => {
    const bannedLegacySurface = /(?:bg|text|border)-(?:white|blue|emerald|amber)(?:-|\b)|#(?:d9dee5|fbfcfd|174ea6|5b6675|4f5a68|cfd6df|0b1220|7b8490|6f6240|8a641f|17745f|a55a22|8a481b)/i;

    for (const { path, source } of publicBrowseComponents) {
      expect(source, `${path} must not inherit the clinical Marble canvas`).not.toContain("--k-work-bg");
      expect(source, `${path} must not carry a fixed light/status palette`).not.toMatch(bannedLegacySurface);
      expect(source, `${path} must consume the shared public appearance contract`).toContain("--k-");
      expect(source, `${path} must not use the premium accent for essential small-copy contrast`).not.toMatch(
        /<(?:p|span)[^>]*text-\[var\(--k-premium\)\]/,
      );
    }

    expect(materials).toMatch(/statusAttention:\s*"[^"]*text-\[var\(--k-text\)\]/);
  });

  it("puts the synthetic inventory boundary before discovery results as a prominent note", () => {
    expect(browse).toContain('data-grid-synthetic-disclosure="true"');
    expect(browse).toContain('role="note"');
    expect(browse).toContain("Reference environment — not live supply");
    expect(browse).toContain('tracking-[.16em] text-[var(--k-text)]">Reference environment — not live supply');
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
