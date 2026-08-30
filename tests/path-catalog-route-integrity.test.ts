import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";

function collectAppPageRoutes(rootDir: string): Set<string> {
  const routes = new Set<string>();

  function walk(currentDir: string, routeSegments: string[]) {
    for (const entry of readdirSync(currentDir)) {
      const absolute = path.join(currentDir, entry);
      const stat = statSync(absolute);

      if (stat.isDirectory()) {
        // Next.js route groups do not contribute to the public URL.
        const nextSegments = /^\(.+\)$/.test(entry) ? routeSegments : [...routeSegments, entry];
        walk(absolute, nextSegments);
        continue;
      }

      if (!stat.isFile() || entry !== "page.tsx") continue;
      const route = `/${routeSegments.join("/")}`.replace(/\/$/, "") || "/";
      routes.add(route);
    }
  }

  walk(rootDir, []);
  return routes;
}

function normalizeInternalHref(href: string): string {
  const [pathname] = href.split(/[?#]/, 1);
  return pathname || "/";
}

const appRoutes = collectAppPageRoutes(path.resolve(process.cwd(), "src/app"));
const mustResolveNow = new Set(["complete", "current"]);

describe("path catalog executable route truth", () => {
  it("never points a complete/current lifecycle step at a missing internal page", () => {
    const missing: string[] = [];

    for (const pathDefinition of klinikosPathCatalog) {
      for (const node of pathDefinition.nodes) {
        if (!node.href || !node.href.startsWith("/") || !mustResolveNow.has(node.state)) continue;

        const route = normalizeInternalHref(node.href);
        if (!appRoutes.has(route)) {
          missing.push(`${pathDefinition.id}:${node.id} (${node.state}) -> ${node.href}`);
        }
      }
    }

    expect(missing, `Current lifecycle links must resolve to real app pages:\n${missing.join("\n")}`).toEqual([]);
  });

  it("allows future links only when the node truthfully remains upcoming or blocked", () => {
    for (const pathDefinition of klinikosPathCatalog) {
      for (const node of pathDefinition.nodes) {
        if (!node.href || !node.href.startsWith("/")) continue;
        const route = normalizeInternalHref(node.href);
        if (appRoutes.has(route)) continue;

        expect(["upcoming", "blocked"], `${pathDefinition.id}:${node.id} points to ${node.href}`).toContain(node.state);
      }
    }
  });
});
