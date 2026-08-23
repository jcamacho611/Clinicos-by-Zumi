import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokens = fs.readFileSync(path.join(process.cwd(), "src/app/design-tokens.css"), "utf8");
const appearance = fs.readFileSync(path.join(process.cwd(), "src/lib/design/atmosphere.ts"), "utf8");
const controller = fs.readFileSync(path.join(process.cwd(), "src/components/design/klinikos-atmosphere.tsx"), "utf8");
const accountPreferences = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/account-preferences.tsx"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const livingHome = fs.readFileSync(path.join(process.cwd(), "src/components/marketing/public-living-gateway.tsx"), "utf8");

function ruleFor(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tokens.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  return match?.[1] ?? "";
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
    expect(controller).toContain('const referenceLocked = pathname === "/"');
    expect(livingHome).toContain('bg-[#050303]');
  });

  it("gives Marble and Obsidian distinct semantic material blocks", () => {
    const marble = ruleFor('html:root[data-klinikos-atmosphere="day"]');
    const obsidian = ruleFor('html:root[data-klinikos-atmosphere="night"]');
    expect(marble).not.toBe("");
    expect(obsidian).not.toBe("");
    expect(marble).toContain("--k-theme-mode:light");
    expect(obsidian).toContain("--k-theme-mode:dark");
    expect(marble).toContain("--k-work-bg:#f6f2ed");
    expect(obsidian).toContain("--k-work-bg:#090506");
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
    expect(accountPreferences).toContain('matchMedia("(prefers-color-scheme: dark)")');
    expect(accountPreferences).not.toContain('value === "system" ? "auto"');
  });
});
