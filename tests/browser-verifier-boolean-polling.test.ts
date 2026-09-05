import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const livingRealityVerifier = readFileSync("scripts/verify-living-reality-browser.mjs", "utf8");
const frontendVerifier = readFileSync("scripts/verify-frontend-browser-interactions.mjs", "utf8");

const safePollingExpression = 'await evaluate(`Boolean(${expression})`)';
const unsafePollingExpression = "if (await evaluate(expression)) return;";

describe("browser verifier polling serialization", () => {
  it("forces Living Reality wait predicates to return a primitive boolean", () => {
    expect(livingRealityVerifier).toContain(safePollingExpression);
    expect(livingRealityVerifier).not.toContain(unsafePollingExpression);
  });

  it("forces general frontend wait predicates to return a primitive boolean", () => {
    expect(frontendVerifier).toContain(safePollingExpression);
    expect(frontendVerifier).not.toContain(unsafePollingExpression);
  });
});
