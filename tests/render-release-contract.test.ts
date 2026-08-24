import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const renderYaml = readFileSync("render.yaml", "utf8");
const verifyRelease = readFileSync("scripts/verify-release.mjs", "utf8");

describe("Render release contract", () => {
  it("keeps the portable release gate aligned with the actual Render install/build/start contract", () => {
    expect(renderYaml).toContain("buildCommand: npm ci --include=dev --ignore-scripts && npm run render:build");
    expect(renderYaml).toContain("startCommand: npm start");

    expect(verifyRelease).toContain('["ci", "--include=dev", "--ignore-scripts"]');
    expect(verifyRelease).toContain('["run", "render:build"]');
    expect(verifyRelease).toContain('["start"]');
  });

  it("keeps confidentiality gates on both sides of the production build", () => {
    /* The gate scans before any bundle exists and again once it does, on both build
       paths. Raw file offsets cannot express that: the code-only branch is written above
       the render branch, so its post-build scan sits textually before the render:build
       call while still running after its own build. Anchor on each build invocation. */
    const codeOnlyBuild = verifyRelease.indexOf('["run", "build"]');
    const renderBuild = verifyRelease.indexOf('["run", "render:build"]');
    const gates = [...verifyRelease.matchAll(/"security:check"/g)].map((match) => match.index ?? -1);

    expect(codeOnlyBuild).toBeGreaterThan(-1);
    expect(renderBuild).toBeGreaterThan(-1);
    expect(gates.length).toBeGreaterThanOrEqual(3);
    expect(gates[0]).toBeLessThan(Math.min(codeOnlyBuild, renderBuild));
    expect(gates.some((gate) => gate > codeOnlyBuild && gate < renderBuild)).toBe(true);
    expect(gates.some((gate) => gate > renderBuild)).toBe(true);
  });
});
