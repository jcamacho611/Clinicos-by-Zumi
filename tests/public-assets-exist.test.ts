import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every local asset the product points at is actually on disk.
 *
 * This exists because the Zumi send button in the app shell referenced
 * `/klinikos-orbital-k-transparent.png`, which had never been shipped — the real file is
 * `klinikos-orbital-k-production.png`. The result was a broken image on the send button of
 * every authenticated page, and nothing caught it: a missing image does not throw, does not
 * fail a type-check, and does not fail a render test. It only shows up as a 404 in a browser
 * console, which no automated check was reading.
 *
 * A guard for the instance would have been worthless — the next renamed asset would break the
 * same way. This walks the source instead, so the class is closed.
 */

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Only paths that name a file extension we actually serve from `public/`. A bare `/grid` is
 * a route, not an asset, and Next resolves it through the router — matching those would flag
 * every link in the product.
 */
const ASSET_REFERENCE = /["'`(](\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|svg|webp|gif|ico|avif|woff2?|mp4|webm|pdf|json|txt|xml))["'`)]/g;

/** Served by a route handler or by Next itself rather than by a file in `public/`. */
const SERVED_BY_CODE = new Set(["/manifest.json", "/sitemap.xml", "/robots.txt", "/opensearch.xml"]);

describe("every local asset the product references exists", () => {
  const missing: string[] = [];

  for (const file of sourceFiles(path.join(ROOT, "src"))) {
    const contents = fs.readFileSync(file, "utf8");
    for (const match of contents.matchAll(ASSET_REFERENCE)) {
      const reference = match[1];
      if (SERVED_BY_CODE.has(reference)) continue;
      // A route handler can own the path even when it looks like a file.
      if (fs.existsSync(path.join(PUBLIC_DIR, reference))) continue;
      missing.push(`${path.relative(ROOT, file)} → ${reference}`);
    }
  }

  it("has no reference pointing at a file that was never shipped", () => {
    expect(missing, `assets referenced but absent from public/:\n${missing.join("\n")}`).toEqual([]);
  });

  it("actually looks at the source, so an empty result means something", () => {
    // Guard against the guard silently scanning nothing — a check that can pass without
    // exercising its target is not evidence.
    const scanned = sourceFiles(path.join(ROOT, "src"));
    expect(scanned.length).toBeGreaterThan(100);
    const anyAsset = scanned.some((file) => ASSET_REFERENCE.test(fs.readFileSync(file, "utf8")));
    expect(anyAsset, "no asset references found at all — the pattern has stopped matching").toBe(true);
  });
});
