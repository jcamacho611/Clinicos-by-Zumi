import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P01 Living Reality runtime", () => {
  it("requires one React-19-compatible 3D runtime", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^9\./);
    expect(pkg.dependencies.three).toMatch(/^\^0\.185\./);
    expect(pkg.devDependencies["@types/three"]).toMatch(/^\^0\.185\./);
  });

  it("requires the governed projection, mode resolver, and lazy runtime", () => {
    for (const path of [
      "src/lib/living-reality/reality-projection.ts",
      "src/lib/living-reality/reality-client-intent.ts",
      "src/lib/living-reality/runtime-mode.ts",
      "src/components/living-reality/living-reality-runtime.tsx",
      "src/components/living-reality/living-reality-canvas.tsx",
    ]) {
      expect(existsSync(path), path).toBe(true);
    }
  });
});
