import { describe, expect, it } from "vitest";
import {
  degradeRealityMode,
  runtimeDprCap,
  selectInitialRealityMode,
} from "@/lib/living-reality/runtime-mode";

describe("P01 Living Reality performance modes", () => {
  it("fails over to Precision when WebGL is unavailable", () => {
    expect(selectInitialRealityMode({
      webgl: false,
      reducedMotion: false,
      userPreference: null,
      deviceMemoryGb: 8,
    })).toBe("PRECISION_MODE");
  });

  it("honors accessibility and low-capability signals", () => {
    expect(selectInitialRealityMode({
      webgl: true,
      reducedMotion: true,
      userPreference: null,
      deviceMemoryGb: 8,
    })).toBe("BALANCED_REALITY");
    expect(selectInitialRealityMode({
      webgl: true,
      reducedMotion: false,
      userPreference: null,
      deviceMemoryGb: 2,
    })).toBe("BALANCED_REALITY");
    expect(selectInitialRealityMode({
      webgl: true,
      reducedMotion: false,
      userPreference: "PRECISION_MODE",
      deviceMemoryGb: 8,
    })).toBe("PRECISION_MODE");
  });

  it("degrades one tier at a time and caps render density", () => {
    expect(degradeRealityMode("FULL_REALITY")).toBe("BALANCED_REALITY");
    expect(degradeRealityMode("BALANCED_REALITY")).toBe("PRECISION_MODE");
    expect(degradeRealityMode("PRECISION_MODE")).toBe("PRECISION_MODE");
    expect(runtimeDprCap("FULL_REALITY")).toBe(1.5);
    expect(runtimeDprCap("BALANCED_REALITY")).toBe(1.1);
    expect(runtimeDprCap("PRECISION_MODE")).toBe(1);
  });
});
