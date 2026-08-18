import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Two system-wide interface rules, enforced rather than remembered.
 *
 * 1. TYPE HAS A FLOOR. The interface carried 1,433 utilities at 8–10px — 73 at 8px,
 *    478 at 9px, 882 at 10px — and used tiny uppercase text as the primary way to
 *    establish hierarchy. Below roughly 11px, text stops being readable for a large
 *    number of people without zooming, and decorative microcopy is not a reason to
 *    make it unreadable. Hierarchy comes from weight, spacing and colour instead.
 *
 * 2. INTERNAL VOCABULARY STAYS INTERNAL. Klinikos really does have entitlements,
 *    reconciliation, payment rails and bounded overage. A buyer should never have to
 *    learn any of those words to purchase software. The concepts remain in the code
 *    and the architecture docs; the customer reads plain language.
 */

function sourceFiles(dir: string) {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
    }
  };
  walk(path.join(process.cwd(), dir));
  return out;
}

describe("interface legibility", () => {
  it("keeps interface text at or above the readable floor", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles("src")) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/text-\[(\d+)px\]/g)) {
        if (Number(match[1]) < 11) {
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(`${path.relative(process.cwd(), file)}:${line} uses ${match[0]}`);
        }
      }
    }
    expect(offenders.slice(0, 20)).toEqual([]);
  });

  it("keeps stylesheet font sizes at or above the readable floor", () => {
    // The Tailwind sweep cannot see a raw `font-size` in a stylesheet. The global
    // appearance control sat at 10px on every page in the product, which is how a
    // single shared widget quietly became the smallest text a visitor ever reads.
    const offenders: string[] = [];
    const cssDir = path.join(process.cwd(), "src/app");
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (full.endsWith(".css")) {
          const css = fs.readFileSync(full, "utf8");
          for (const match of css.matchAll(/font-size:\s*(\d+)px/g)) {
            if (Number(match[1]) < 11) offenders.push(`${path.relative(process.cwd(), full)} sets ${match[0]}`);
          }
        }
      }
    };
    walk(cssDir);
    expect(offenders).toEqual([]);
  });

  it("keeps internal vocabulary out of buyer-facing surfaces", () => {
    // Public marketing and commercial surfaces only. The authenticated workspace and
    // the architecture docs may name these concepts precisely, because there the
    // reader is an operator, not someone deciding whether to buy.
    const buyerFacing = [
      "src/app/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/how-it-works/page.tsx",
      "src/app/founding-clinic/page.tsx",
      "src/app/grid/pricing/page.tsx",
      "src/app/about/page.tsx",
      "src/app/start/page.tsx",
    ].filter((relative) => fs.existsSync(path.join(process.cwd(), relative)));
    expect(buyerFacing.length).toBeGreaterThan(0);

    const jargon = [
      "payment rail",
      "bounded overage",
      "commercial access",
      "operating depth",
      "payment evidence",
      "server-owned checkout intent",
      "signed processor evidence",
      "resource-class fee policy",
      "cost ledger",
      "runtime evidence",
      "connector state",
    ];

    const offenders: string[] = [];
    for (const relative of buyerFacing) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), "utf8").toLowerCase();
      for (const term of jargon) if (source.includes(term)) offenders.push(`${relative} says "${term}"`);
    }
    expect(offenders).toEqual([]);
  });
});
