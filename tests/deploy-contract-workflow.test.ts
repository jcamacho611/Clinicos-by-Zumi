import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/quality.yml", "utf8");

describe("production deploy contract workflow", () => {
  it("runs render:build under the same Render migration gate used by production", () => {
    const deployContract = workflow.split("  deploy-contract:")[1] ?? "";

    expect(deployContract).toContain('RENDER: "true"');
    expect(deployContract).toContain("run: npm run render:build");
  });

  it("does not claim Actions are unavailable when the workflow is actively executing", () => {
    expect(workflow).not.toContain("CI has not executed on this repository since at least 2026-08-18.");
  });
});
