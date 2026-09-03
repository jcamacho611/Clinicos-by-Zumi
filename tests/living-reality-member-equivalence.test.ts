import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync("src/components/living-universe/universe-shell.tsx", "utf8");

describe("Member Living Reality equivalence", () => {
  it("keeps every semantic work surface after adding the spatial enhancement", () => {
    for (const name of [
      "LivingRealityRuntime",
      "ObjectStage",
      "PlaneLens",
      "Inspector",
      "ActionDock",
    ]) {
      expect(shell).toContain(name);
    }
  });

  it("keeps an explicit Precision mode that can complete the task without Canvas", () => {
    expect(shell).toContain("Precision mode");
    expect(shell).toContain("PRECISION_MODE");
  });
});
