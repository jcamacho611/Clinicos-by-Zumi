import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  degradeRealityMode,
  selectInitialRealityMode,
} from "@/lib/living-reality/runtime-mode";

const layer = readFileSync("src/components/living-reality/living-reality-layer.tsx", "utf8");
const canvas = readFileSync("src/components/living-reality/living-reality-canvas.tsx", "utf8");
const realityVerifier = readFileSync("scripts/verify-living-reality-browser.mjs", "utf8");
const generalVerifier = readFileSync("scripts/verify-frontend-browser-interactions.mjs", "utf8");
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");

describe("P01 Living Reality degraded and accessible production states", () => {
  it("falls back to Precision when WebGL is unavailable", () => {
    expect(selectInitialRealityMode({
      webgl: false,
      reducedMotion: false,
      userPreference: null,
      deviceMemoryGb: 16,
    })).toBe("PRECISION_MODE");
    expect(layer).toContain('data-living-reality-mode={mode}');
    expect(layer).toContain('data-living-reality-status={status}');
    expect(layer).toContain("Full interface available without 3D.");
  });

  it("reduces motion without removing the semantic product", () => {
    expect(selectInitialRealityMode({
      webgl: true,
      reducedMotion: true,
      userPreference: null,
      deviceMemoryGb: 16,
    })).toBe("BALANCED_REALITY");
    expect(layer).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
  });

  it("degrades repeated runtime failures all the way to Precision", () => {
    expect(degradeRealityMode("FULL_REALITY")).toBe("BALANCED_REALITY");
    expect(degradeRealityMode("BALANCED_REALITY")).toBe("PRECISION_MODE");
    expect(canvas).toContain('addEventListener("webglcontextlost"');
    expect(canvas).toContain("onRuntimeFailure");
  });

  it("honors an explicit Precision presentation preference", () => {
    expect(selectInitialRealityMode({
      webgl: true,
      reducedMotion: false,
      userPreference: "PRECISION_MODE",
      deviceMemoryGb: 16,
    })).toBe("PRECISION_MODE");
    expect(layer).toContain('stored === "PRECISION_MODE"');
  });

  it("requires the production browser verifier to prove GPU-less Precision continuity", () => {
    expect(realityVerifier).toContain('"--disable-gpu"');
    expect(realityVerifier).toContain("livingRealityPrecision");
    expect(realityVerifier).toContain("PRECISION_MODE");
    expect(realityVerifier).toContain("Full interface available without 3D.");
    expect(realityVerifier).toContain("data-living-reality-status");
    expect(realityVerifier).toContain("livingRealitySemanticWorkflow");
    expect(realityVerifier).toContain("hasCanvas: false");
    expect(qualityWorkflow).toContain("node scripts/verify-living-reality-browser.mjs");
  });

  it("requires production evidence for reduced motion, mobile recomposition and true browser zoom", () => {
    expect(realityVerifier).toContain("livingRealityReducedMotion");
    expect(realityVerifier).toContain("BALANCED_REALITY");
    expect(realityVerifier).toContain("livingRealityMobile");
    expect(realityVerifier).toContain("noHorizontalOverflow");
    expect(generalVerifier).toContain("verified_chrome_profile_page_zoom");
    expect(generalVerifier).toContain("requestedZoomPercent = Number");
  });
});
