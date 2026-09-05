import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function source(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P01 true-3D Living Reality contract", () => {
  it("uses the bounded React 19 renderer without helper-stack creep", () => {
    expect(pkg.dependencies.three).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^?9\.7\.0$/);
    expect(pkg.devDependencies["@types/three"]).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/drei"]).toBeUndefined();
    expect(pkg.dependencies["@react-three/postprocessing"]).toBeUndefined();
  });

  it("has one lazy demand-rendered Living Reality client subsystem", () => {
    const layerPath = "src/components/living-reality/living-reality-layer.tsx";
    const canvasPath = "src/components/living-reality/living-reality-canvas.tsx";
    const scenePath = "src/components/living-reality/living-reality-scene.tsx";

    expect(existsSync(resolve(root, layerPath))).toBe(true);
    expect(existsSync(resolve(root, canvasPath))).toBe(true);
    expect(existsSync(resolve(root, scenePath))).toBe(true);

    const layer = source(layerPath);
    const canvas = source(canvasPath);
    const scene = source(scenePath);

    expect(layer).toContain("ssr: false");
    expect(canvas).toContain('from "@react-three/fiber"');
    expect(canvas).toContain('frameloop="demand"');
    expect(scene).not.toMatch(/@\/lib\/(db|repositories|orchestration)/);
    expect(`${layer}\n${canvas}\n${scene}`).not.toMatch(/@react-three\/(drei|postprocessing)/);
    expect(`${layer}\n${canvas}\n${scene}`).not.toMatch(/https?:\/\//);
  });

  it("extends the existing semantic material authority for the spatial runtime", () => {
    const tokens = source("src/app/design-tokens.css");
    for (const token of [
      "--k-reality-environment",
      "--k-reality-surface",
      "--k-reality-edge",
      "--k-reality-active",
      "--k-reality-attention",
      "--k-reality-blocked",
      "--k-reality-success",
      "--k-reality-living-edge",
    ]) {
      expect(tokens).toContain(token);
    }
  });
});
