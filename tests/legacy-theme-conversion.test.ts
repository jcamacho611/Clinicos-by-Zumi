import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Obsidian compatibility layer converts backgrounds and text together, or not at all.
 *
 * This layer darkens legacy light surfaces and lightens the dark text written for them.
 * Its one real failure mode is applying half of that pair. Both halves were broken in
 * the product when this was written:
 *
 *   Background darkened, text not lifted — a tinted panel kept dark hue text on a now
 *   dark panel. The billing surface rendered "Stored claim status is not clearinghouse
 *   evidence." at 1.09:1. Invisible, and it is the sentence that keeps the product
 *   honest about what a stored claim state does and does not mean.
 *
 *   Text lifted, background not darkened — the mirror image, and how "Available now"
 *   ended up pale green on pale green at 1.55:1 on the Grid browse cards.
 *
 * Measured across nineteen authenticated surfaces, the conversion took the product from
 * 268 low-contrast text nodes to 125 with no surface regressing. What is guarded here is
 * the invariant that made the difference, because a future family added to one list and
 * forgotten in the other reproduces the exact defect either way.
 */

const css = fs.readFileSync(path.join(process.cwd(), "src/app/cinematic-global.css"), "utf8");

/** Everything the marble scope re-declares; those rules are the light-surface exception. */
const marbleRules = css
  .split("\n")
  .filter((line) => line.includes(".grid-marble-surface"))
  .join("\n");

const obsidianRules = css
  .split("\n")
  .filter((line) => line.includes(".klinikos-cinematic-root") && !line.includes(".grid-marble-surface"))
  .join("\n");

function families(source: string, kind: "bg" | "text") {
  const found = new Set<string>();
  for (const match of source.matchAll(new RegExp(`\\[class[~*]="${kind}-([a-z]+)-\\d+`, "g"))) {
    found.add(match[1]);
  }
  return found;
}

const HUES = ["amber", "emerald", "rose", "sky", "teal", "cyan", "indigo", "violet", "yellow", "orange", "green", "red", "blue", "pink"];

describe("the legacy theme conversion moves backgrounds and text together", () => {
  const darkenedBackgrounds = families(obsidianRules, "bg");
  const liftedText = families(obsidianRules, "text");

  it.each(HUES.filter((hue) => families(obsidianRules, "bg").has(hue)))(
    "lifts %s text wherever it darkens a %s background",
    (hue) => {
      expect(
        liftedText.has(hue),
        `bg-${hue}-* is darkened but text-${hue}-* is never lifted, so dark ${hue} text will sit on a dark ${hue} panel`,
      ).toBe(true);
    },
  );

  it.each(HUES.filter((hue) => families(obsidianRules, "text").has(hue)))(
    "restores %s inside the marble scope",
    (hue) => {
      // Marble is a deliberately light surface. Any family the Obsidian layer touches
      // has to be handed back, or marble keeps a light panel under pale text.
      expect(
        marbleRules.includes(`text-${hue}-`),
        `text-${hue}-* is lifted for the dark theme but never restored for .grid-marble-surface`,
      ).toBe(true);
    },
  );

  it("darkens hover backgrounds as well as resting ones", () => {
    // Hover is a lift away from the surface, not a return to the light theme. Without
    // this the row a person points at is the one they cannot read: pointing at a patient
    // row painted a near-white 70% wash under light text at 1.08:1.
    expect(obsidianRules).toMatch(/hover:bg-white[^"]*"\]:hover/);
    expect(obsidianRules).toMatch(/hover:bg-slate-50[^"]*"\]:hover/);
    expect(marbleRules).toMatch(/hover:bg-white[^"]*"\]:hover/);
  });

  it("covers slash-opacity variants, which an exact-word selector cannot match", () => {
    // `bg-slate-50/60` is a different class token from `bg-slate-50`, so [class~=] misses
    // it entirely — that is how a mid-grey wash survived on referrals and imaging.
    expect(obsidianRules).toContain('[class*="bg-slate-50/"]');
    expect(obsidianRules).toContain('[class*="bg-rose-50/"]');
  });

  it("is actually reading the stylesheet", () => {
    // A check that can pass without exercising its target is not evidence.
    expect(darkenedBackgrounds.size).toBeGreaterThan(5);
    expect(liftedText.size).toBeGreaterThan(5);
    expect(marbleRules.length).toBeGreaterThan(500);
  });
});
