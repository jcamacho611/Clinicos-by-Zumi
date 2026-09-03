import type { RealityMode } from "@/lib/living-reality/reality-projection";

export type RealityPreference = "auto" | "full" | "balanced" | "precision";

export type RealityCapabilities = {
  webgl: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  deviceMemoryGb: number | null;
};

export type RealityPerformanceSample = {
  mode: RealityMode;
  averageFps: number;
  sampleMs: number;
};

export function resolveRealityMode(
  capabilities: RealityCapabilities,
  preference: RealityPreference,
): RealityMode {
  if (!capabilities.webgl || preference === "precision") {
    return "PRECISION_MODE";
  }

  if (preference === "full") {
    return "FULL_REALITY";
  }

  if (
    preference === "balanced"
    || capabilities.reducedMotion
    || capabilities.coarsePointer
    || (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb < 4)
  ) {
    return "BALANCED_REALITY";
  }

  return "FULL_REALITY";
}

export function shouldDowngradeRealityMode(
  sample: RealityPerformanceSample,
): RealityMode | null {
  if (sample.sampleMs < 5000 || sample.averageFps >= 30) {
    return null;
  }

  if (sample.mode === "FULL_REALITY") {
    return "BALANCED_REALITY";
  }

  if (sample.mode === "BALANCED_REALITY") {
    return "PRECISION_MODE";
  }

  return null;
}
