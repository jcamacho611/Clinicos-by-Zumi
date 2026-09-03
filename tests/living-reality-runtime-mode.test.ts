import { describe, expect, it } from "vitest";
import {
  resolveRealityMode,
  shouldDowngradeRealityMode,
} from "@/lib/living-reality/runtime-mode";

describe("Living Reality performance modes", () => {
  const capable = {
    webgl: true,
    reducedMotion: false,
    coarsePointer: false,
    deviceMemoryGb: 8,
  };

  it("fails to Precision without WebGL", () => {
    expect(resolveRealityMode({ ...capable, webgl: false }, "auto")).toBe(
      "PRECISION_MODE",
    );
  });

  it("honors explicit Precision preference", () => {
    expect(resolveRealityMode(capable, "precision")).toBe("PRECISION_MODE");
  });

  it("uses Full on healthy desktop capability", () => {
    expect(resolveRealityMode(capable, "auto")).toBe("FULL_REALITY");
  });

  it("uses Balanced for accessibility or constrained-device signals", () => {
    expect(resolveRealityMode({ ...capable, reducedMotion: true }, "auto")).toBe(
      "BALANCED_REALITY",
    );
    expect(resolveRealityMode({ ...capable, coarsePointer: true }, "auto")).toBe(
      "BALANCED_REALITY",
    );
    expect(resolveRealityMode({ ...capable, deviceMemoryGb: 2 }, "auto")).toBe(
      "BALANCED_REALITY",
    );
  });

  it("downgrades sustained poor performance one level", () => {
    expect(
      shouldDowngradeRealityMode({
        mode: "FULL_REALITY",
        averageFps: 24,
        sampleMs: 5000,
      }),
    ).toBe("BALANCED_REALITY");
    expect(
      shouldDowngradeRealityMode({
        mode: "BALANCED_REALITY",
        averageFps: 24,
        sampleMs: 5000,
      }),
    ).toBe("PRECISION_MODE");
  });

  it("does not downgrade a short or healthy sample", () => {
    expect(
      shouldDowngradeRealityMode({
        mode: "FULL_REALITY",
        averageFps: 20,
        sampleMs: 4999,
      }),
    ).toBeNull();
    expect(
      shouldDowngradeRealityMode({
        mode: "FULL_REALITY",
        averageFps: 30,
        sampleMs: 5000,
      }),
    ).toBeNull();
  });
});
