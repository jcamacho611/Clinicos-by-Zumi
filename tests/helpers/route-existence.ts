import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Does a route actually resolve?
 *
 * Shared because two guards need the same answer — the governed Path catalog and the
 * feature registry's declared interface routes — and a second copy of this logic would
 * eventually disagree with the first about what "exists" means.
 *
 * Answering it is not as simple as looking for a directory. Most clinic surfaces are
 * served by one dynamic `[workspace]` page from a whitelist, so checking the filesystem
 * alone reports dozens of real routes as missing.
 */

const appRoot = join(process.cwd(), "src", "app");
const genericWorkspacePage = join(appRoot, "(platform)", "[workspace]", "page.tsx");
const workspaceRendererFile = join(process.cwd(), "src", "components", "clinic", "workspace-renderer.tsx");

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

export function internalPath(href: string) {
  return href.split("#", 1)[0]!.split("?", 1)[0]! || "/";
}

export function readWorkspaceSlugWhitelist() {
  const source = readFileSync(workspaceRendererFile, "utf8");
  const declaration = source.match(/export const workspaceSlugs = \[([\s\S]*?)\] as const;/);
  if (!declaration?.[1]) throw new Error("workspaceSlugs declaration could not be read from workspace-renderer.tsx");
  return new Set([...declaration[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]));
}

/**
 * The generic `[workspace]` page is real, but it renders only whitelisted slugs.
 * Excluding it from generic pattern matching keeps an arbitrary `/made-up-page` from
 * being treated as a governed route.
 */
export function createRouteResolver() {
  const workspaceSlugs = readWorkspaceSlugWhitelist();
  const concreteRoutePatterns = walkPages(appRoot)
    .filter((page) => page !== genericWorkspacePage)
    .map(routePatternFromPage);

  return function routeExists(target: string) {
    const segments = target.split("/").filter(Boolean);
    const whitelistedWorkspace = segments.length === 1 && workspaceSlugs.has(segments[0]!);
    return concreteRoutePatterns.some((pattern) => pattern.test(target)) || whitelistedWorkspace;
  };
}
