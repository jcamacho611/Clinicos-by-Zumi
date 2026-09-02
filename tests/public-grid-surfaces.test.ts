import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

/**
 * The public Grid pages are light surfaces living inside a dark-themed application, and
 * that is the whole source of their accessibility history.
 *
 * The legacy conversion layer darkens legacy backgrounds and lightens the dark text
 * written for them. A light page that does not declare itself gets half of that
 * treatment: /grid/pricing rendered its headings at 1.08:1 because `bg-[#f7f8fa]` is in
 * the darken list and beat the marble rule, so the surface went dark while the text
 * stayed dark. The fix is not a colour, it is the declaration — `grid-marble-surface`
 * says "this page is light" and the layer leaves it alone.
 *
 * Measured after the fix: all five public Grid routes at 1440px, 768px and 390px report
 * zero low-contrast text nodes, zero horizontal overflow and zero console errors.
 */

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const LIGHT_SURFACES = [
  "src/app/grid/pricing/page.tsx",
  "src/app/grid/resources/browse/page.tsx",
];

describe("public Grid surfaces", () => {
  it.each(LIGHT_SURFACES)("declares %s a light surface", (file) => {
    expect(read(file)).toContain("grid-marble-surface");
  });

  it("lets Grid browse follow the shared appearance instead of forcing Marble", () => {
    const source = read("src/lib/design/marketplace-system.ts");
    expect(source).not.toMatch(/browsePage:\s*"[^"]*grid-marble-surface/);
    expect(source).toContain('browsePage: "min-h-screen bg-[var(--k-work-bg)] text-[var(--k-text)]"');
  });

  it.each(LIGHT_SURFACES)(
    "does not pair %s with a background utility the dark layer will fight over",
    (file) => {
      // `bg-[#f7f8fa]` and `bg-[#f7f3ef]` are both in the conversion layer's darken
      // list. Setting one on the same element that carries `grid-marble-surface` is a
      // specificity fight the light surface loses, and the page turns dark under text
      // that stayed dark.
      const source = read(file);
      const marbleLines = source.split("\n").filter((line) => line.includes("grid-marble-surface"));
      for (const line of marbleLines) {
        expect(line, "a marble element must not also set a legacy light background").not.toMatch(/bg-\[#f7f8fa\]|bg-\[#f7f3ef\]/);
      }
    },
  );

  it("renders every Grid tier from the canonical object rather than a hand-picked list", () => {
    // Grid Pro+ existed in the commercial source and never reached the page, because the
    // page listed tiers by name. Mapping the object means a new tier cannot be forgotten.
    const source = read("src/app/grid/pricing/page.tsx");
    expect(source).toContain("Object.values(GRID_MEMBERSHIP)");
    expect(Object.keys(GRID_MEMBERSHIP).length).toBeGreaterThanOrEqual(5);
  });

  it("does not print a hand-typed price on the public pricing page", () => {
    const source = read("src/app/grid/pricing/page.tsx");
    expect(source).not.toMatch(/\$\d+\/mo/);
  });
});
