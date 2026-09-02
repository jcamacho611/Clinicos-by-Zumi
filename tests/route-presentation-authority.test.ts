import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const policyPath = "src/lib/design/route-presentation-policy.ts";
const policy = existsSync(policyPath) ? read(policyPath) : "";
const dock = read("src/components/marketing/public-utility-dock.tsx");
const publicZumi = read("src/components/marketing/public-zumi-site-control.tsx");
const atmosphere = read("src/lib/design/atmosphere.ts");

describe("single route presentation authority", () => {
  it("owns public utility visibility in one browser-safe policy module", () => {
    expect(existsSync(policyPath)).toBe(true);
    expect(policy).toContain("routePresentationPolicy");
    expect(policy).toContain("publicZumiVisible");
    expect(policy).toContain("appearanceControllerVisible");
    expect(policy).toContain("utilityDockVisible");
  });

  it("keeps the Living Home reference locked and prevents root utility duplication", () => {
    expect(policy).toMatch(/pathname\s*===\s*["']\/["']/);
    expect(policy).toContain('owner: "living-home"');
    expect(policy).toContain("referenceLocked: true");
    expect(policy).toContain("utilityDockVisible: false");
  });

  it("gives public experiences the public dock but leaves authenticated workspaces to AppShell", () => {
    for (const pathname of ["/about", "/how-it-works", "/grid", "/grid/browse", "/edu", "/pricing", "/trust"]) {
      expect(policy).toContain(`"${pathname}"`);
    }
    for (const pathname of ["/dashboard", "/patients", "/settings", "/zumi", "/grid/availability"]) {
      expect(policy).toContain(`"${pathname}"`);
    }
    expect(policy).toContain('owner: "public-experience"');
    expect(policy).toContain('owner: "authenticated-app"');
  });

  it("makes the root dock consume the shared policy instead of appearing on every non-root route", () => {
    expect(dock).toContain("usePathname");
    expect(dock).toContain("routePresentationPolicy");
    expect(dock).toContain("utilityDockVisible");
    expect(dock).toContain("publicZumiVisible");
    expect(dock).toContain("appearanceControllerVisible");
  });

  it("removes the duplicate public-route registry from Zumi", () => {
    expect(publicZumi).toContain("routePresentationPolicy");
    expect(publicZumi).not.toContain("const PUBLIC_PATHS = new Set");
  });

  it("derives appearance visibility from the same route authority", () => {
    expect(atmosphere).toContain("routePresentationPolicy");
    expect(atmosphere).not.toContain("controllerVisible: !referenceLocked");
  });
});
