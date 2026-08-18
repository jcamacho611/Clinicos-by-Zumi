import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { allKlinikosPaths } from "@/lib/paths/catalog";
import { workspaceSlugs } from "@/components/clinic/workspace-renderer";

const appRoot = join(process.cwd(), "src", "app");
const genericWorkspacePage = join(appRoot, "(platform)", "[workspace]", "page.tsx");

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

function isWhitelistedGenericWorkspace(target: string) {
  const segments = target.split("/").filter(Boolean);
  return segments.length === 1 && workspaceSlugs.includes(segments[0] as (typeof workspaceSlugs)[number]);
}

describe("Klinikos governed route registry", () => {
  // The generic [workspace] page is real, but it may render only whitelisted
  // workspace slugs. Excluding it from generic pattern matching prevents an
  // arbitrary `/made-up-page` from being treated as a valid governed route.
  const concreteRoutePatterns = walkPages(appRoot)
    .filter((page) => page !== genericWorkspacePage)
    .map(routePatternFromPage);

  function routeExists(target: string) {
    return concreteRoutePatterns.some((pattern) => pattern.test(target)) || isWhitelistedGenericWorkspace(target);
  }

  it("only links route steps to real Next.js pages or whitelisted generic workspaces", () => {
    const missing = allKlinikosPaths.flatMap((path) => path.nodes.flatMap((node) => {
      if (!node.href?.startsWith("/")) return [];
      const target = internalPath(node.href);
      return routeExists(target) ? [] : [`${path.id}:${node.id} -> ${node.href}`];
    }));

    expect(missing, `Dead governed route destinations:\n${missing.join("\n")}`).toEqual([]);
  });

  it("keeps the clinic capacity readiness step on a real governance surface", () => {
    const path = allKlinikosPaths.find((candidate) => candidate.id === "clinic-monetize-capacity");
    const readiness = path?.nodes.find((node) => node.id === "readiness");
    expect(readiness?.href).toBe("/grid/trust");
    expect(routeExists("/grid/trust")).toBe(true);
  });

  it("does not let the generic workspace route legitimize arbitrary slugs", () => {
    expect(routeExists("/patient-navigation")).toBe(true);
    expect(routeExists("/claim-readiness")).toBe(true);
    expect(routeExists("/provider-network")).toBe(true);
    expect(routeExists("/totally-made-up-page")).toBe(false);
  });
});
