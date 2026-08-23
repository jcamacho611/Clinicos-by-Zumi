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
    const firstSecurityGate = verifyRelease.indexOf('"security:check"');
    const renderBuild = verifyRelease.indexOf('"render:build"');
    const secondSecurityGate = verifyRelease.indexOf('"security:check"', firstSecurityGate + 1);

    expect(firstSecurityGate).toBeGreaterThan(-1);
    expect(renderBuild).toBeGreaterThan(firstSecurityGate);
    expect(secondSecurityGate).toBeGreaterThan(renderBuild);
  });
});
