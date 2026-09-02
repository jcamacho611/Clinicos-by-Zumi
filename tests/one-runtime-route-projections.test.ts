import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(pathname: string) {
  return readFileSync(join(ROOT, pathname), "utf8");
}

function findFiles(directory: string, filename: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules"].includes(entry.name)) return [];
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return findFiles(absolute, filename);
    return entry.isFile() && entry.name === filename
      ? [relative(ROOT, absolute).replaceAll("\\", "/")]
      : [];
  });
}

describe("one runtime with governed public projections", () => {
  it("keeps every public projection inside one Next runtime", () => {
    expect(findFiles(ROOT, "package.json")).toEqual(["package.json"]);
    expect(findFiles(ROOT, "next.config.ts")).toEqual(["next.config.ts"]);

    const layout = read("src/app/layout.tsx");
    expect(layout.match(/<PublicUtilityDock \/>/g)).toHaveLength(1);
    expect(layout).not.toMatch(/createRoot|hydrateRoot|iframe/);
  });

  it("makes the screen-experience registry the route-presentation authority for mounted consumers", () => {
    const sitemap = read("src/app/sitemap.ts");
    const header = read("src/components/marketing/public-header.tsx");
    const gateway = read("src/components/marketing/public-living-gateway.tsx");
    const dock = read("src/components/marketing/public-utility-dock.tsx");
    const control = read("src/components/marketing/public-zumi-site-control.tsx");
    const architecture = read("src/lib/design/design-architecture.ts");
    const marketplace = read("src/lib/design/marketplace-system.ts");
    const atmosphere = read("src/lib/design/atmosphere.ts");

    expect(sitemap).toContain("publicSitemapEntries");
    expect(header).toContain("PUBLIC_PRIMARY_NAVIGATION");
    expect(gateway).toContain("PUBLIC_PRIMARY_NAVIGATION");
    expect(gateway).toContain("isPublicDirectDestination");
    expect(dock).toContain("resolvePublicRoutePresentation");
    expect(control).toContain("resolvePublicRoutePresentation");
    expect(architecture).toContain("resolvePublicRoutePresentation");
    expect(marketplace).toContain("resolvePublicRoutePresentation");
    expect(atmosphere).toContain("resolvePublicRoutePresentation");

    expect(sitemap).not.toContain("const publicRoutes");
    expect(header).not.toContain("const publicNavigation");
    expect(gateway).not.toContain("const navItems");
    expect(gateway).not.toContain("const publicActionPaths");
    expect(control).not.toContain("const PUBLIC_PATHS");
    expect(control).not.toContain("const publicActionPaths");
    expect(architecture).not.toContain("const ROUTE_CLASSES");
    expect(marketplace).not.toContain("MARKETPLACE_EXCEPTION_SCOPE");
  });
});
