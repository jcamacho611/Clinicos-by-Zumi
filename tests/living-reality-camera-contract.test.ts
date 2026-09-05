import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectionPath = "src/lib/living-reality/reality-projection.ts";
const projectionSource = readFileSync(projectionPath, "utf8");

const canonicalCameraIntents = [
  "ARRIVAL",
  "FOCUS_OBJECT",
  "SHOW_RELATIONSHIPS",
  "INSPECT",
  "MISSION",
  "OUTCOME",
  "NETWORK_OVERVIEW",
  "TIME_COMPARE",
  "PRECISION_LOCK",
] as const;

function livingRealitySources() {
  const root = "src/lib/living-reality";
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => readFileSync(join(root, entry.name), "utf8"));
}

describe("Living Reality camera contract", () => {
  it("defines the full canonical presentation camera vocabulary", () => {
    for (const intent of canonicalCameraIntents) {
      expect(projectionSource).toContain(`\"${intent}\"`);
    }
  });

  it("keeps one exported RealityProjection type in the canonical library", () => {
    const exports = livingRealitySources().flatMap((source) =>
      source.match(/export\s+type\s+RealityProjection\b/g) ?? [],
    );
    expect(exports).toHaveLength(1);
  });
});
