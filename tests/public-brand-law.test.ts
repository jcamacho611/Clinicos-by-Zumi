import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findBannedPublicCopy } from "@/lib/design/command-system";

const APP_ROOT = join(process.cwd(), "src/app");
const SHARED_PUBLIC_COMPONENT_ROOTS = [
  join(process.cwd(), "src/components/marketing"),
  join(process.cwd(), "src/components/command"),
  join(process.cwd(), "src/components/growth"),
  join(process.cwd(), "src/components/commercial"),
].filter(existsSync);

function walk(root: string, predicate: (path: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function customerFacingLiteralText(source: string) {
  // Pull ordinary string/template literals plus raw JSX text. This intentionally
  // does not treat environment variable identifiers such as CLINICOS_SEED_* as
  // customer-facing copy.
  const pieces: string[] = [];
  const quoted = /(["'`])([^\n]*?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = quoted.exec(source)) !== null) pieces.push(match[2]);

  const jsxText = />\s*([^<{][^<]*)</g;
  while ((match = jsxText.exec(source)) !== null) pieces.push(match[1]);
  return pieces.join("\n");
}

function legacyClinicosInVisibleText(text: string) {
  return /\bclinicos\b/i.test(text);
}

function violationsFor(path: string) {
  const source = readFileSync(path, "utf8");
  const visible = customerFacingLiteralText(source);
  const banned = findBannedPublicCopy(visible);
  if (legacyClinicosInVisibleText(visible)) banned.push("clinicos");
  return [...new Set(banned)];
}

describe("Klinikos public brand law", () => {
  it("keeps every App Router page free of legacy public branding", () => {
    const pages = walk(APP_ROOT, (path) => path.endsWith("page.tsx"));
    expect(pages.length).toBeGreaterThan(20);
    const violations = pages
      .map((path) => ({ path: path.slice(process.cwd().length + 1), hits: violationsFor(path) }))
      .filter((entry) => entry.hits.length > 0);
    expect(violations).toEqual([]);
  });

  it("keeps shared public-facing components on the same hierarchy", () => {
    const components = SHARED_PUBLIC_COMPONENT_ROOTS.flatMap((root) => walk(root, (path) => path.endsWith(".tsx")));
    const violations = components
      .map((path) => ({ path: path.slice(process.cwd().length + 1), hits: violationsFor(path) }))
      .filter((entry) => entry.hits.length > 0);
    expect(violations).toEqual([]);
  });

  it("states the intended relationship in design law", () => {
    const law = readFileSync(join(process.cwd(), "src/lib/design/command-system.ts"), "utf8");
    expect(law).toContain("Zumi is the operating intelligence inside Klinikos");
    expect(law).toContain("klinikos by zumi");
  });
});
