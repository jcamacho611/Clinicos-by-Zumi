import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/dashboard/page.tsx"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const stylesheetPath = path.join(process.cwd(), "src/app/unicorn-experience.css");
const css = fs.existsSync(stylesheetPath) ? fs.readFileSync(stylesheetPath, "utf8") : "";

describe("Klinikos unicorn Living Home experience", () => {
  it("scopes the authenticated operating environment without replacing Living Home", () => {
    expect(dashboard).toContain('className="unicorn-dashboard"');
    expect(dashboard).toContain('className="unicorn-living-shell"');
    expect(dashboard).toContain("<LivingHome");
    expect(dashboard).toContain("data-klinikos-role={session.role}");
  });

  it("renders the context band from server-owned loaded truth rather than fabricated metrics", () => {
    expect(dashboard).toContain("activePaths.length");
    expect(dashboard).toContain("livingAppointments.length");
    expect(dashboard).toContain("gridSignals.length");
    expect(dashboard).toContain("gatewayStatus.available");
    expect(dashboard).toContain("Deterministic command mode");
    expect(dashboard).not.toContain("Revenue recovered");
    expect(dashboard).not.toContain("Verified matches");
    expect(dashboard).not.toContain("AI completed");
  });

  it("loads one scoped experience stylesheet after convergence and before accessibility", () => {
    expect(layout).toContain('import "./unicorn-experience.css"');
    expect(layout.indexOf('import "./experience-convergence.css"')).toBeLessThan(layout.indexOf('import "./unicorn-experience.css"'));
    expect(layout.indexOf('import "./unicorn-experience.css"')).toBeLessThan(layout.indexOf('import "./accessibility.css"'));
  });

  it("gives Marble and Obsidian different materials while preserving one hierarchy", () => {
    expect(css).toContain('html:root[data-klinikos-atmosphere="night"] .unicorn-living-shell');
    expect(css).toContain('html:root[data-klinikos-atmosphere="day"] .unicorn-living-shell');
    expect(css).toContain(".unicorn-living-shell #living-home-title");
    expect(css).toContain(".unicorn-living-shell #living-home-composer");
    expect(css).toContain('[aria-label="Progress on your request"]');
    expect(css).toContain('[aria-label="Klinikos destinations"]');
  });

  it("recomposes for tablet/mobile and honors reduced motion", () => {
    expect(css).toContain("@media (max-width: 1119px)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (max-width: 430px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
