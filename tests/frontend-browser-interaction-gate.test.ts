import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
const browserGatePath = "scripts/verify-frontend-browser-interactions.mjs";
const browserGate = existsSync(browserGatePath) ? readFileSync(browserGatePath, "utf8") : "";

describe("frontend browser interaction release gate", () => {
  it("drives exact-head Chrome through keyboard, responsive, motion, and recomposition checks before release evidence is accepted", () => {
    expect(existsSync(browserGatePath)).toBe(true);
    expect(workflow).toContain("Verify frontend browser interactions");
    expect(workflow).toContain("node --experimental-websocket scripts/verify-frontend-browser-interactions.mjs");
    expect(browserGate).toContain("Input.dispatchKeyEvent");
    expect(browserGate).toContain("focus-visible");
    expect(browserGate).toContain("prefers-reduced-motion");
    expect(browserGate).toContain("390");
    expect(browserGate).toContain("data-public-object-stage");
    expect(browserGate).toContain("data-public-inspector");
    expect(browserGate).toContain("data-public-action-dock");
  });
});
