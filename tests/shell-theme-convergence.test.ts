import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

const shell = read("src/components/clinic/app-shell.tsx");
const tokens = read("src/app/design-tokens.css");

/**
 * One shell, both materials.
 *
 * Klinikos is one product with two first-class materials: Obsidian for
 * cinematic and intelligence contexts, Marble for sustained operational work.
 * That is only true if the authenticated shell reads its colour from the theme
 * rather than naming it. The shell previously carried 82 literal Obsidian
 * values, which made Marble structurally impossible inside the application no
 * matter what the token file said — a clinician working an eight-hour day had
 * no light mode available.
 *
 * These guards keep the shell honest. They are deliberately about the shell
 * itself: other surfaces converge on their own schedule, and a guard that
 * claimed more than it checked would be worse than none.
 */
describe("app shell theme convergence", () => {
  it("names no colour of its own", () => {
    // Hex literals in the shell are the exact defect: they survive a theme
    // change, so Marble inherits Obsidian and the light material never appears.
    const literals = shell.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(literals, `shell hardcodes ${literals.length} colour(s): ${[...new Set(literals)].join(", ")}`).toEqual([]);
  });

  it("carries no raw rgb()/rgba() either", () => {
    // A literal rgba() defeats theming exactly as a hex does; alpha belongs in
    // the token (e.g. --k-shell-hover), not at the call site.
    const rgb = shell.match(/\brgba?\(\s*\d+\s*,/g) ?? [];
    expect(rgb, `shell hardcodes ${rgb.length} rgb/rgba value(s)`).toEqual([]);
  });

  it("draws its surfaces, text and lines from semantic tokens", () => {
    for (const token of [
      "var(--k-shell)",
      "var(--k-shell-raised)",
      "var(--k-shell-panel)",
      "var(--k-text)",
      "var(--k-muted)",
      "var(--k-line)",
      "var(--k-accent)",
      "var(--k-scrim)",
    ]) {
      expect(shell, `shell no longer uses ${token}`).toContain(token);
    }
  });

  it("defines every shell token in both Obsidian and Marble", () => {
    // A token declared only in the dark block silently falls back to whatever
    // the light block inherited, which is how a dark wash ends up painted onto
    // a light ground. Each must be declared exactly twice — once per mode.
    for (const token of [
      "--k-shell-raised",
      "--k-shell-panel",
      "--k-shell-hover",
      "--k-shell-active",
      "--k-accent-line",
      "--k-text-strong",
      "--k-muted-2",
      "--k-scrim",
      "--k-shell-ambient",
    ]) {
      const declarations = tokens.match(new RegExp(`^\\s*${token}\\s*:`, "gm")) ?? [];
      expect(declarations.length, `${token} is declared ${declarations.length} time(s); expected one per mode`).toBe(2);
    }
  });

  it("keeps the ambient wash theme-owned rather than painting a dark radial over Marble", () => {
    expect(shell).toContain("var(--k-shell-ambient)");
    expect(shell).not.toContain("rgba(150,41,48");
  });
});
