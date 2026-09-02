import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Professional Experience Matrix names one objective tracking metric: the count of
 * hardcoded colour literals in presentation code. A literal cannot respond to a theme,
 * which is why Marble is unreachable on surfaces that paint themselves Obsidian directly.
 *
 * This is a ratchet, not a target. It fails when the count RISES, so convergence cannot
 * be undone by the next feature; when a wave lands, the ceiling drops to the new count.
 * See docs/superpowers/specs/2026-09-02-klinikos-professional-experience-matrix.md §1.1.
 */

// Measured on main@16f0824d: 2206 literals across 130 files.
// PR #505 (AppShell) accounts for 89 of them and is guarded separately by
// tests/shell-theme-convergence.test.ts; when it merges this ceiling drops to 2117.
const LITERAL_CEILING = 2206;
const FILE_CEILING = 130;

const HEX = /#[0-9a-fA-F]{6}\b/g;
const ROOTS = ["src/app", "src/components"];

function tsxFiles(dir: string): string[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? tsxFiles(path.join(dir, entry.name))
        : entry.name.endsWith(".tsx")
          ? [path.join(dir, entry.name)]
          : [],
    );
}

function measure() {
  let literals = 0;
  const files: string[] = [];
  for (const file of ROOTS.flatMap(tsxFiles)) {
    const found = fs.readFileSync(path.join(process.cwd(), file), "utf8").match(HEX);
    if (found?.length) {
      literals += found.length;
      files.push(file);
    }
  }
  return { literals, files };
}

describe("Klinikos theme literal ratchet", () => {
  it("does not add colour literals that Marble cannot reach", () => {
    const { literals, files } = measure();
    expect(literals).toBeLessThanOrEqual(LITERAL_CEILING);
    expect(files.length).toBeLessThanOrEqual(FILE_CEILING);
  });

  it("measures something real, so a passing ratchet is evidence", () => {
    // A ratchet that cannot see any literal would pass forever and prove nothing.
    // Current main genuinely carries this debt; when it reaches zero this guard is
    // replaced by an exact `toBe(0)` assertion rather than deleted.
    const { literals, files } = measure();
    expect(literals).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(0);
    expect(/#[0-9a-fA-F]{6}\b/.test("#0d0608")).toBe(true);
  });

});
