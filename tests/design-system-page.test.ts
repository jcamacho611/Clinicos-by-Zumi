import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { badgeTones, buttonSizes, buttonVariants, zumiStates } from "@/components/ds";

const page = readFileSync(
  join(process.cwd(), "src/app/(platform)/design-system/page.tsx"),
  "utf8",
);

/**
 * A reference page that lists the design system by hand is wrong the first time somebody
 * adds a tone, and wrong in the most misleading way: confidently. These assert it is
 * generated from the exports instead.
 */
describe("design system reference", () => {
  it("iterates what the design system exports rather than repeating it", () => {
    for (const source of ["zumiStates", "badgeTones", "buttonVariants", "buttonSizes"]) {
      expect(page, source).toContain(`${source}.map(`);
    }
  });

  it("keeps no private copy of any exported list", () => {
    // A literal array of tones or variants would be the start of the drift.
    const literalToneList = new RegExp(`\\[\\s*"${badgeTones[1]}"\\s*,`);
    const literalVariantList = new RegExp(`\\[\\s*"${buttonVariants[0]}"\\s*,`);

    expect(page).not.toMatch(literalToneList);
    expect(page).not.toMatch(literalVariantList);
  });

  it("explains every state and variant it renders, with nothing left unlabelled", () => {
    // The meanings are knowledge rather than derivable, so they are the one part that
    // can fall behind. Requiring a key per exported value makes that a type error.
    for (const state of zumiStates) expect(page, state).toContain(`${state}:`);
    for (const variant of buttonVariants) expect(page, variant).toContain(`${variant}:`);
  });

  it("renders colour from live tokens, never a copied value", () => {
    // A hex or rgb literal here would show a stale colour after a token change rather
    // than following it.
    expect(page).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(page).not.toMatch(/\brgb\(/);
    expect(page).toContain("var(--status-");
  });

  it("requires a session and stays out of search results", () => {
    // Internal vocabulary: of no use to a search engine, of some use to someone probing
    // the product's surface.
    expect(page).toContain("requireClinicSession");
    expect(page).toContain("index: false");
  });

  it("does not claim to document surfaces it does not show", () => {
    expect(page).toContain("not every surface");
  });

  it("covers every exported size so a spacing regression is visible here first", () => {
    expect(buttonSizes.length).toBeGreaterThan(0);
    expect(page).toContain("buttonSizes.map(");
  });
});
