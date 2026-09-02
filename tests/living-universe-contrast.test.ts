import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "src/components/marketing/public-living-universe-stage.tsx",
  "src/components/living-universe/action-dock.tsx",
  "src/components/living-universe/plane-lens.tsx",
  "src/components/living-universe/universe-shell.tsx",
];

describe("Living Universe normal-text contrast regression", () => {
  it("does not restore the audited sub-AA dark-surface text colors", () => {
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

    for (const color of ["#756460", "#786764", "#7f6c68", "#806d69", "#806e6a", "#816d69", "#816e6a"]) {
      expect(source, `${color} was below 4.5:1 on its rendered dark surface`).not.toContain(color);
    }
  });
});
