import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P01 renderer boundary", () => {
  it("keeps Canvas isolated and lazy", () => {
    expect(
      read("src/components/living-reality/living-reality-canvas.tsx"),
    ).toContain("<Canvas");
    expect(
      read("src/components/living-reality/living-reality-runtime.tsx"),
    ).toContain("dynamic(");
    expect(
      read("src/components/living-reality/living-reality-runtime.tsx"),
    ).toContain("ssr: false");
  });

  it("keeps authority and data engines out of scene modules", () => {
    const scene = [
      "reality-scene.tsx",
      "reality-node.tsx",
      "reality-edge.tsx",
      "camera-director.tsx",
    ]
      .map((name) => read(`src/components/living-reality/scene/${name}`))
      .join("\n");

    for (const forbidden of [
      "@/lib/db",
      "api-authorization",
      "stripe",
      "eligibility",
      "ranking",
      "hiddenPrompt",
      "process.env",
    ]) {
      expect(scene).not.toContain(forbidden);
    }
  });
});
