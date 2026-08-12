import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = join(process.cwd(), "src/app");
const USER_FACING_COMPONENT_ROOTS = [
  join(process.cwd(), "src/components/marketing"),
  join(process.cwd(), "src/components/command"),
  join(process.cwd(), "src/components/growth"),
].filter(existsSync);

const LEGACY_PUBLIC_PHRASES = [
  "klinikos by zumi",
  "clinicos by zumi",
  "clinicos os",
] as const;

function walk(root: string, predicate: (path: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) output.push(...walk(path, predicate));
    else if (predicate(path)) output.push(path);
  }
  return output;
}

function stringLiterals(source: string): string[] {
  // Public copy should live in ordinary JSX/TS string literals. Pull only literal
  // contents so legacy internal identifiers such as CLINICOS_SEED_* do not become
  // false-positive branding failures.
  const literals: string[] = [];
  const pattern = /(["'`])([^\n]*?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) literals.push(match[2]);
  return literals;
}

function legacyHits(path: string) {
  const source = readFileSync(path, "utf8");
  const literals = stringLiterals(source);
  const hits: string[] = [];
  for (const literal of literals) {
    const lower = literal.toLowerCase();
    for (const phrase of LEGACY_PUBLIC_PHRASES) {
      if (lower.includes(phrase)) hits.push(phrase);
    }
    if (/\bclinicos\b/i.test(literal)) hits.push("clinicos");
  }
  return [...new Set(hits)];
}

describe("Klinikos public brand hierarchy", () => {
  it("keeps every App Router page free of legacy customer-facing branding", () => {
    const pages = walk(APP_ROOT, (path) => path.endsWith("page.tsx"));
    expect(pages.length).toBeGreaterThan(20);
    const violations = pages
      .map((path) => ({ path: path.slice(process.cwd().length + 1), hits: legacyHits(path) }))
      .filter((entry) => entry.hits.length > 0);
    expect(violations).toEqual([]);
  });

  it("keeps shared marketing and command components on the same brand hierarchy", () => {
    const components = USER_FACING_COMPONENT_ROOTS.flatMap((root) => walk(root, (path) => path.endsWith(".tsx")));
    const violations = components
      .map((path) => ({ path: path.slice(process.cwd().length + 1), hits: legacyHits(path) }))
      .filter((entry) => entry.hits.length > 0);
    expect(violations).toEqual([]);
  });

  it("states the intended hierarchy on the public homepage", () => {
    const homepage = readFileSync(join(APP_ROOT, "page.tsx"), "utf8");
    expect(homepage).toContain("Zumi is the operating intelligence inside Klinikos");
    expect(homepage).not.toContain("Klinikos by Zumi");
  });
});
