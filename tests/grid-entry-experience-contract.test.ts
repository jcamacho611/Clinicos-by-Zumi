import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/grid/page.tsx", "utf8");

describe("Grid entry experience contract", () => {
  it("opens as the exchange itself instead of a category-card brochure", () => {
    expect(page).toContain("GridExchangeField");
    expect(page).not.toContain("const buyLanes");
    expect(page).not.toContain("const sellLanes");
    expect(page).not.toContain("What do you want access to?");
    expect(page).not.toContain("Put any legitimate healthcare resource on Grid.");
    expect(page).not.toContain("Grid is the exchange layer for healthcare people, work, spaces, products, equipment, services, organizations, education, and capacity. Choose the outcome. Grid sorts the rest.");
  });

  it("makes Need and Have the dominant first-viewport interaction", () => {
    expect(page).toMatch(/WHAT DO YOU NEED\?/i);
    expect(page).toMatch(/WHAT DO YOU HAVE\?/i);
    expect(page).toContain("What are you trying to find or offer?");
  });

  it("keeps public Zumi continuation small and preserves the real deeper Grid workspace", () => {
    expect(page).toContain("gridPublicEntryContext");
    expect(page).toContain("Continue from Zumi");
    expect(page).toContain("/grid/browse");
    expect(page).not.toContain("Browse everything");
  });

  it("does not use fixed page artwork that can cover downstream content while scrolling", () => {
    expect(page).not.toMatch(/pointer-events-none fixed inset-0/);
    expect(page).not.toMatch(/sticky[^\n]*rose|rose[^\n]*sticky/i);
  });
});
