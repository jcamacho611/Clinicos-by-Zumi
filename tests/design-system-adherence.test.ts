import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { badgeTones, buttonSizes, buttonVariants, zumiStates } from "@/components/ds";

/**
 * Design-system adherence.
 *
 * The export ships an oxlint config declaring the exact prop contracts and two
 * hard rules — no raw hex colours, no raw px values. oxlint is not in this repo's
 * toolchain, so these assertions carry the same rules in vitest instead of the
 * config sitting unenforced next to code that quietly drifts from it.
 */

const DS_SOURCE = join(process.cwd(), "src/components/ds/index.tsx");
const TOKENS = join(process.cwd(), "src/app/design-tokens.css");

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("component contracts", () => {
  it("declares the six Zumi operating states", () => {
    expect(zumiStates).toEqual(["dormant", "observing", "mapping", "analyzing", "signal", "resolved"]);
  });

  it("gives Badge the neutral tone plus the five active states", () => {
    // Dormant is an orb state only — a badge reading "dormant" would be noise.
    expect(badgeTones).toEqual(["neutral", "observing", "mapping", "analyzing", "signal", "resolved"]);
  });

  it("declares the exact Button variants and sizes the adherence config allows", () => {
    expect(buttonVariants).toEqual(["primary", "dark", "outline", "ghost", "gold"]);
    expect(buttonSizes).toEqual(["sm", "md", "lg"]);
  });
});

describe("token discipline", () => {
  const source = read(DS_SOURCE);

  it("uses no raw hex colours", () => {
    const hex = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hex).toEqual([]);
  });

  it("uses spacing and radius tokens rather than raw px", () => {
    // Geometry the orb computes from its own size prop is arithmetic, not spacing,
    // so only string literals carrying px are checked.
    //
    // Three literals are allowed, each for a reason a token cannot serve:
    //  - 44px  the accessible minimum target size, a WCAG floor rather than a
    //          spacing-scale step, and it must not move when the scale is retuned
    //  - 12px  the orb node's glow radius, part of the signature geometry
    //  - 1px solid currentColor  the outline variant, which inherits its colour
    //          from context; --border-hair-* bind a fixed line colour and so cannot
    //          express it
    const permitted = ["44px", "12px", "1px solid currentColor"];
    const rawPx = source.match(/"[^"]*\b\d+px\b[^"]*"/g) ?? [];
    const violations = rawPx.filter((entry) => !permitted.some((allowed) => entry.includes(allowed)));
    expect(violations).toEqual([]);
  });

  it("routes every colour through a token", () => {
    for (const token of ["--accent-signal", "--accent-intelligence", "--accent-premium", "--surface-paper", "--line-dark"]) {
      expect(source).toContain(token);
    }
  });
});

describe("visual law the export is explicit about", () => {
  const source = read(DS_SOURCE);

  it("never rounds a button into a pill", () => {
    // radius-full exists in the token set for other uses; buttons must not reach it.
    const buttonBlock = source.slice(source.indexOf("export function Button"), source.indexOf("export function Card"));
    expect(buttonBlock).toContain("var(--radius-sm)");
    expect(buttonBlock).not.toContain("--radius-full");
  });

  it("hovers by dropping opacity rather than popping a shadow", () => {
    const buttonBlock = source.slice(source.indexOf("export function Button"), source.indexOf("export function Card"));
    expect(buttonBlock).toContain("opacity var(--duration-fast)");
    expect(buttonBlock).not.toContain("boxShadow");
  });

  it("lets a hairline border carry the card rather than a shadow", () => {
    const cardBlock = source.slice(source.indexOf("export function Card"), source.indexOf("export function Input"));
    expect(cardBlock).toContain("--border-hair");
    expect(cardBlock).not.toContain("--shadow-card");
  });

  it("keeps the input underlined rather than boxed", () => {
    const inputBlock = source.slice(source.indexOf("export function Input"), source.indexOf("type OrbConfig"));
    expect(inputBlock).toContain("borderBottom");
    expect(inputBlock).toContain('border: "none"');
  });

  it("hides the orb from assistive technology, since it is decorative", () => {
    const orbBlock = source.slice(source.indexOf("export function ZumiOrb"));
    expect(orbBlock).toContain('aria-hidden="true"');
  });

  it("gives every interactive control a 44px minimum target", () => {
    expect(source.match(/minHeight: "44px"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("token scoping", () => {
  const tokens = read(TOKENS);
  const globals = read(join(process.cwd(), "src/app/globals.css"));

  it("scopes the system rather than publishing it on :root", () => {
    // globals.css defines --ink as dark text for light surfaces; this system defines
    // it as light text for dark surfaces. Both on :root would invert text colour on
    // every page not yet migrated.
    expect(tokens).toContain("[data-klinikos-ds]");
    expect(tokens).not.toMatch(/^:root\s*\{/m);
    expect(globals).toContain('@import "./design-tokens.css"');
  });

  it("carries the six status tokens the orb and badge share", () => {
    for (const state of ["observing", "mapping", "analyzing", "signal", "resolved"]) {
      expect(tokens).toContain(`--status-${state}`);
    }
  });

  it("respects reduced motion, since none of the motion is decorative", () => {
    expect(tokens).toContain("prefers-reduced-motion");
  });

  it("keeps the container at the width the system specifies", () => {
    expect(tokens).toContain("--container-max: 1320px");
  });
});
