import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { allKlinikosPaths } from "@/lib/paths/catalog";

const appRoot = join(process.cwd(), "src", "app");

function walkPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return walkPages(absolute);
    return entry.isFile() && entry.name === "page.tsx" ? [absolute] : [];
  });
}

function routePatternFromPage(pageFile: string) {
  const directory = relative(appRoot, join(pageFile, ".."));
  const segments = directory === "" ? [] : directory
    .split(sep)
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .filter((segment) => !segment.startsWith("@"));

  const pattern = segments.map((segment) => {
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) return "(?:/.*)?";
    if (/^\[\.\.\..+\]$/.test(segment)) return "/.+";
    if (/^\[.+\]$/.test(segment)) return "/[^/]+";
    return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
  }).join("");

  return new RegExp(`^${pattern || "/"}/?$`);
}

function internalPath(href: string) {
  return href.split("#", 1)[0]!.split("?", 1)[0]! || "/";
}

describe("Klinikos governed route registry", () => {
  const appRoutePatterns = walkPages(appRoot).map(routePatternFromPage);

  it("only links route steps to real Next.js pages", () => {
    const missing = allKlinikosPaths.flatMap((path) => path.nodes.flatMap((node) => {
      if (!node.href?.startsWith("/")) return [];
      const target = internalPath(node.href);
      const exists = appRoutePatterns.some((pattern) => pattern.test(target));
      return exists ? [] : [`${path.id}:${node.id} -> ${node.href}`];
    }));

    expect(missing, `Dead governed route destinations:\n${missing.join("\n")}`).toEqual([]);
  });

  it("keeps the clinic capacity readiness step on a real governance surface", () => {
    const path = allKlinikosPaths.find((candidate) => candidate.id === "clinic-monetize-capacity");
    const readiness = path?.nodes.find((node) => node.id === "readiness");
    expect(readiness?.href).toBe("/grid/trust");
    expect(appRoutePatterns.some((pattern) => pattern.test("/grid/trust"))).toBe(true);
  });
});
