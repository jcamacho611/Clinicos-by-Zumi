import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokens = fs.readFileSync(path.join(process.cwd(), "src/app/design-tokens.css"), "utf8");
const atmosphere = fs.readFileSync(path.join(process.cwd(), "src/lib/design/atmosphere.ts"), "utf8");
const controller = fs.readFileSync(path.join(process.cwd(), "src/components/design/klinikos-atmosphere.tsx"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const livingHome = fs.readFileSync(path.join(process.cwd(), "src/components/marketing/public-living-gateway.tsx"), "utf8");

function ruleFor(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tokens.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  return match?.[1] ?? "";
}

describe("Klinikos Obsidian / Marble appearance system", () => {
  it("gives Day a real Marble surface distinct from Night", () => {
    const day = ruleFor('html:root[data-klinikos-atmosphere="day"]');
    const night = ruleFor('html:root[data-klinikos-atmosphere="night"]');

    expect(day, "Day must have its own token block instead of sharing Night tokens").not.toBe("");
    expect(night, "Night must keep an explicit Obsidian token block").not.toBe("");
    expect(day).toContain("--k-theme-mode:light");
    expect(night).toContain("--k-theme-mode:dark");
    expect(day).not.toContain("--k-work-bg:#090506");
    expect(night).toContain("--k-work-bg:#090506");
  });

  it("keeps the design-system semantic surfaces connected to atmosphere tokens", () => {
    expect(tokens).toContain("--surface-primary:var(--k-public-bg)");
    expect(tokens).toContain("--surface-raised:var(--k-public-raised)");
    expect(tokens).toContain("--text-primary:var(--k-text)");
    expect(tokens).toContain("--text-secondary:var(--k-muted)");
    expect(tokens).toContain("--line-dark:var(--k-line)");
  });

  it("offers normal Auto, Light, and Dark customer choices", () => {
    expect(controller).toContain('label: "Auto"');
    expect(controller).toContain('label: "Light"');
    expect(controller).toContain('label: "Dark"');
    expect(controller).not.toContain('label: "Dawn"');
    expect(controller).not.toContain('label: "Golden hour"');
  });

  it("migrates legacy stored atmosphere choices instead of breaking preferences", () => {
    expect(atmosphere).toContain("normalizeAtmospherePreference");
    expect(atmosphere).toContain('value === "night" ? "dark"');
    expect(atmosphere).toContain('value === "dawn" || value === "day" || value === "golden"');
  });

  it("activates the existing Marble compatibility scope for light operational pages", () => {
    expect(layout).toContain('className="klinikos-theme-surface"');
    expect(atmosphere).toContain('grid-marble-surface');
    expect(controller).toContain('classList.toggle("grid-marble-surface"');
  });

  it("keeps the canonical public Living Home reference-locked to Obsidian", () => {
    expect(atmosphere).toContain('location.pathname === "/"');
    expect(controller).toContain('const referenceLocked = pathname === "/"');
    expect(livingHome).toContain('className="rose-home min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]"');
  });
});
