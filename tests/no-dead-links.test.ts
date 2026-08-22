import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { workspaceSlugs } from "@/components/clinic/workspace-renderer";

/**
 * Every internal link in the product goes somewhere.
 *
 * The path catalog is already guarded (route-registry, path-route-existence), but those
 * check the journeys Klinikos defines — not the ordinary `<Link href="/…">` a component
 * renders. A button that navigates nowhere is indistinguishable from a broken product to
 * the person clicking it, and nothing failed when one appeared.
 *
 * Two ways a link dies, and the second is the one that actually bit us:
 *
 * 1. No page or route handler resolves the path at all.
 * 2. The path *structurally* resolves through the `[workspace]` catch-all — so every
 *    file-existence check passes — but the slug is not registered, and the page calls
 *    `notFound()` at runtime. `/insights` and `/action-center` both shipped this way:
 *    green tests, 404 in a browser. A structural check alone would not have caught
 *    either, which is why single-segment links are checked against `workspaceSlugs`
 *    rather than against the filesystem.
 */

const ROOT = process.cwd();
const APP = path.join(ROOT, "src/app");

/** Route groups — `(platform)` — are invisible in the URL, so a page may live under any. */
const ROOTS = [APP, ...fs.readdirSync(APP, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("("))
  .map((entry) => path.join(APP, entry.name))];

const LEAVES = ["page.tsx", "page.ts", "route.ts", "route.tsx"];

/** First segments that own a real directory, so they never reach the catch-all. */
const CONCRETE_SEGMENTS = new Set(
  ROOTS.flatMap((root) => fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[([@]/.test(entry.name))
    .map((entry) => entry.name)),
);

function resolvesUnder(base: string, segments: string[], index: number): boolean {
  if (index === segments.length) return LEAVES.some((leaf) => fs.existsSync(path.join(base, leaf)));
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  } catch {
    return false;
  }
  const literal = entries.find((entry) => entry.name === segments[index]);
  if (literal && resolvesUnder(path.join(base, literal.name), segments, index + 1)) return true;
  for (const entry of entries) {
    // A catch-all swallows the rest of the path.
    if (/^\[{1,2}\.\.\..+\]{1,2}$/.test(entry.name)
      && LEAVES.some((leaf) => fs.existsSync(path.join(base, entry.name, leaf)))) return true;
    if (/^\[[^.\][]+\]$/.test(entry.name)
      && resolvesUnder(path.join(base, entry.name), segments, index + 1)) return true;
    // A route group adds no URL segment, so recurse at the same index.
    if (/^\(.+\)$/.test(entry.name) && resolvesUnder(path.join(base, entry.name), segments, index)) return true;
  }
  return false;
}

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Only literal hrefs. A template with an interpolation is not knowable from source. */
const HREF = /href=(?:"([^"]+)"|'([^']+)'|\{`([^`$]+)`\})/g;
const ASSET = /\.(png|jpe?g|svg|webp|gif|ico|avif|pdf|xml|txt|json|mp4|webm)$/;

const files = sources(path.join(ROOT, "src"));
const registeredSlugs = new Set<string>(workspaceSlugs);

const dead: string[] = [];
let inspected = 0;

for (const file of files) {
  for (const match of fs.readFileSync(file, "utf8").matchAll(HREF)) {
    const raw = match[1] ?? match[2] ?? match[3];
    if (!raw.startsWith("/")) continue;
    const href = raw.split(/[?#]/)[0];
    if (ASSET.test(href)) continue;
    inspected += 1;
    const segments = href.split("/").filter(Boolean);
    const where = `${path.relative(ROOT, file)} → ${href}`;

    if (segments.length === 1 && !CONCRETE_SEGMENTS.has(segments[0])) {
      // Reaches the generic workspace page, which 404s on an unregistered slug.
      if (!registeredSlugs.has(segments[0])) dead.push(`${where} (workspace slug not registered)`);
      continue;
    }
    if (!resolvesUnder(APP, segments, 0) && !ROOTS.some((root) => resolvesUnder(root, segments, 0))) {
      dead.push(`${where} (no page or route handler)`);
    }
  }
}

describe("no dead links", () => {
  it("has no internal link pointing at a page that does not exist", () => {
    expect(dead, `dead internal links:\n${dead.join("\n")}`).toEqual([]);
  });

  it("actually inspected the product, so an empty result means something", () => {
    // A check that can pass without exercising its target is not evidence.
    expect(files.length).toBeGreaterThan(100);
    expect(inspected).toBeGreaterThan(100);
  });

  it("recognises an unregistered workspace slug as dead", () => {
    // The `/insights` failure mode, asserted directly: the path resolves through the
    // catch-all, so only the slug registry can tell it apart from a working link.
    expect(CONCRETE_SEGMENTS.has("definitely-not-a-real-workspace")).toBe(false);
    expect(registeredSlugs.has("definitely-not-a-real-workspace")).toBe(false);
    expect(resolvesUnder(APP, ["definitely-not-a-real-workspace"], 0)).toBe(true);
  });
});
