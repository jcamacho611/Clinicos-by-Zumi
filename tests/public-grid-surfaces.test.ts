import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

/**
 * Public Grid must remain visually coherent with the active Marble / Obsidian design
 * system and must preserve safe structured context when Public Zumi sends somebody
 * into Grid. Raw conversation text is never recovered from URL state.
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

  it("declares the shared marketplace page shell a light surface", () => {
    // /grid/browse and the listing detail page both render through this token.
    expect(read("src/lib/design/marketplace-system.ts")).toContain("grid-marble-surface");
  });

  it.each([...LIGHT_SURFACES, "src/lib/design/marketplace-system.ts"])(
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

  it("keeps the public Grid exchange field inside Obsidian/Living Edge instead of legacy generic SaaS blue", () => {
    const source = read("src/components/grid/grid-exchange-field.tsx");
    expect(source).toContain("#12090b");
    expect(source).toContain("#e6817b");
    expect(source).not.toContain("#174ea6");
    expect(source).not.toContain("bg-white");
    expect(source).toContain("min-h-11");
    expect(source).toContain("min-h-12");
  });

  it("resumes safe Public Zumi context in Grid instead of forcing a generic restart", () => {
    const page = read("src/app/grid/page.tsx");
    const entry = read("src/lib/grid/public-entry.ts");

    expect(page).toContain("gridPublicEntryContext");
    expect(page).toContain("searchParams: Promise<");
    expect(page).toContain("const entryContext = gridPublicEntryContext(from, intent)");
    expect(page).toContain("entryContext?.title");
    expect(page).toContain("entryContext?.body");
    expect(page).toContain('initialIntent={entryContext?.intent ?? "all"}');
    expect(page).toContain('initialQuery={entryContext?.initialQuery ?? ""}');

    expect(entry).toContain('sourceValue !== "public-zumi"');
    expect(entry).toContain('intent: "provider"');
    expect(entry).toContain('initialQuery: "I need a healthcare professional"');
    expect(entry).not.toContain("rawPrompt");
  });

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
