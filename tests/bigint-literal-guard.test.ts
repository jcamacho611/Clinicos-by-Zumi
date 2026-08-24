import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * BigInt literals do not compile against this tsconfig target, and vitest transpiles
 * them anyway — so a `0n` passes the test suite and fails `tsc`. That combination has
 * now broken main three separate times, each in a different file, because the failure
 * surfaces only in a gate people were not running while CI was down.
 *
 * Use BigInt(0) instead. This catches it at test time, where it is cheap.
 */
describe("BigInt literals", () => {
  // Read the target directly; tsconfig allows comments and trailing commas, so JSON.parse
  // is the wrong tool for it.
  const target = readFileSync("tsconfig.json", "utf8").match(/"target"\s*:\s*"([^"]+)"/)?.[1] ?? "";

  it("is only worth guarding while the target predates ES2020", () => {
    // If the target is ever raised, this guard has done its job and can go.
    const year = Number(target.replace(/[^0-9]/g, ""));
    expect(Number.isFinite(year) && year < 2020, `target is ${target}`).toBe(true);
  });

  it("appear nowhere in source or tests", () => {
    // git grep keeps this fast and respects .gitignore, so node_modules never enters.
    const hits = execSync(
      "git grep -nE '(^|[^A-Za-z0-9_$.\\\"'\\''`])[0-9]+n\\b' -- 'src/**/*.ts' 'src/**/*.tsx' 'tests/**/*.ts' 'tests/**/*.tsx' || true",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter((line) => line.trim())
      // A digit followed by n also appears inside words and CSS-ish strings; require the
      // literal to end the token, which is what the compiler actually rejects.
      .filter((line) => /[^A-Za-z0-9_$."'`][0-9]+n\s*[,;)\]}]/.test(line))
      .filter((line) => !line.includes("bigint-literal-guard"));

    expect(hits, "use BigInt(0) — literals fail tsc while vitest transpiles them").toEqual([]);
  });
});
