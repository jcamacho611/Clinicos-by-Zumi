import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokens = fs.readFileSync(path.join(process.cwd(), "src/app/design-tokens.css"), "utf8");
const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const convergence = fs.readFileSync(path.join(process.cwd(), "src/app/experience-convergence.css"), "utf8");
const appearance = fs.readFileSync(path.join(process.cwd(), "src/lib/design/atmosphere.ts"), "utf8");
const controller = fs.readFileSync(path.join(process.cwd(), "src/components/design/klinikos-atmosphere.tsx"), "utf8");
const accountPreferences = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/account-preferences.tsx"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const livingHome = fs.readFileSync(path.join(process.cwd(), "src/components/marketing/public-living-gateway.tsx"), "utf8");
const livingHomeMaterials = fs.readFileSync(path.join(process.cwd(), "src/components/marketing/public-living-universe-shell.module.css"), "utf8");

function ruleContaining(selector: string) {
  const selectorIndex = tokens.indexOf(selector);
  if (selectorIndex < 0) return "";
  const braceIndex = tokens.indexOf("{", selectorIndex);
  const endIndex = tokens.indexOf("}", braceIndex);
  if (braceIndex < 0 || endIndex < 0) return "";
  return tokens.slice(braceIndex + 1, endIndex);
}

function hexToken(rule: string, token: string) {
  const value = rule.match(new RegExp(`${token}:(#[0-9a-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`Missing ${token} hexadecimal token.`);
  return value;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
    const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Klinikos Black Label appearance system", () => {
  it("exposes one System / Light / Dark preference authority", () => {
    expect(appearance).toContain('["system", "light", "dark"]');
    expect(controller).toContain('label: "System"');
    expect(controller).toContain('label: "Light"');
    expect(controller).toContain('label: "Dark"');
    expect(controller).not.toContain('label: "Dawn"');
    expect(controller).not.toContain('label: "Golden hour"');
    expect(accountPreferences).not.toContain("Dawn and Golden atmospheres remain available");
  });

  it("migrates legacy stored choices instead of breaking preferences", () => {
    expect(appearance).toContain("normalizeAppearancePreference");
    expect(appearance).toContain('value === "night"');
    expect(appearance).toContain('value === "dawn" || value === "day" || value === "golden"');
    expect(appearance).toContain('value === "auto"');
  });

  it("uses OS color preference for System and keeps the first-visit Living Home Obsidian", () => {
    expect(appearance).toContain('matchMedia("(prefers-color-scheme: dark)")');
    expect(appearance).toContain("prefersDark");
    expect(appearance).toContain("referenceLocked");
    expect(appearance).toContain('location.pathname === "/"');
    expect(controller).toContain("appearancePolicyForPath(pathname)");
    expect(controller).toContain("appearancePolicy.referenceLocked");
    expect(livingHome).toContain("styles.shell");
    expect(livingHomeMaterials).toContain("--lu-obsidian: #080506");
    expect(livingHomeMaterials).toContain("var(--lu-obsidian)");
  });

  it("gives Marble and Obsidian distinct semantic material blocks", () => {
    const marble = ruleContaining('html:root[data-klinikos-atmosphere="day"]');
    const obsidian = ruleContaining('html:root[data-klinikos-atmosphere="night"]');
    expect(marble).not.toBe("");
    expect(obsidian).not.toBe("");
    expect(marble).toContain("--k-theme-mode:light");
    expect(obsidian).toContain("--k-theme-mode:dark");
    expect(marble).toContain("--k-work-bg:#f6f2ed");
    expect(obsidian).toContain("--k-work-bg:#090506");
  });

  it("keeps one material-token authority instead of a second stale palette in globals", () => {
    expect(globals).toContain('@import "./design-tokens.css"');
    expect(globals).not.toContain("--k-public-bg:");
    expect(globals).not.toContain('html[data-klinikos-atmosphere="day"]');
    expect(globals).not.toContain('html[data-klinikos-atmosphere="night"]');
  });

  it("keeps essential semantic text AA-readable on raised Marble and Obsidian surfaces", () => {
    for (const selector of [
      'html:root[data-klinikos-atmosphere="day"]',
      'html:root[data-klinikos-atmosphere="night"]',
    ]) {
      const rule = ruleContaining(selector);
      const raised = hexToken(rule, "--k-public-raised");
      for (const textToken of ["--k-text", "--k-muted", "--k-accent"]) {
        expect(contrastRatio(hexToken(rule, textToken), raised), `${selector} ${textToken}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("connects the design-system semantic surfaces to shared material variables", () => {
    expect(tokens).toContain("--surface-primary:var(--k-public-bg)");
    expect(tokens).toContain("--surface-raised:var(--k-public-raised)");
    expect(tokens).toContain("--text-primary:var(--k-text)");
    expect(tokens).toContain("--text-secondary:var(--k-muted)");
    expect(tokens).toContain("--line-dark:var(--k-line)");
  });

  it("activates the existing page-content theme surface instead of another provider", () => {
    expect(layout).toContain('className="klinikos-theme-surface"');
    expect(appearance).toContain("grid-marble-surface");
    expect(controller).toContain('classList.toggle("grid-marble-surface"');
    expect(controller).not.toContain("ThemeProvider2");
    expect(controller).not.toContain("BlackLabelTheme");
  });

  it("keeps Settings on the same storage and resolver contract", () => {
    expect(accountPreferences).toContain("normalizeAppearancePreference");
    expect(accountPreferences).toContain("atmosphereForAppearance");
    /* Settings resolves the system preference from the same media query as the shell,
       reaching it through a named constant used twice. Assert the contract — that query,
       passed to matchMedia — rather than one particular spelling. */
    expect(accountPreferences).toContain('"(prefers-color-scheme: dark)"');
    expect(accountPreferences).toMatch(/matchMedia\((?:SYSTEM_QUERY|"\(prefers-color-scheme: dark\)")\)/);
    expect(accountPreferences).not.toContain('value === "system" ? "auto"');
    expect(accountPreferences).not.toContain("color-mix(in_srgb");
  });

  it("overrides the legacy dark platform color-scheme through the existing convergence layer", () => {
    expect(convergence).toContain(".klinikos-platform {");
    expect(convergence).toContain("color-scheme:var(--k-theme-mode)");
    expect(convergence).toContain("--workspace-text:var(--k-text)");
    expect(convergence).toContain("--workspace-border:var(--k-line)");
    expect(convergence).toContain(":where(input,textarea,select) {color-scheme:var(--k-theme-mode)}");
    expect(convergence).toContain(".grid-marble-surface .k-page");
    expect(convergence).toContain(".grid-marble-surface .grid-canvas");
  });
});
