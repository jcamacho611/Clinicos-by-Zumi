import type { RealityPerformanceMode } from "@/lib/living-reality/reality-projection";

export type RealityCapabilityInput = {
  webgl: boolean;
  reducedMotion: boolean;
  userPreference: RealityPerformanceMode | null;
  deviceMemoryGb: number;
};

export function selectInitialRealityMode({
  webgl,
  reducedMotion,
  userPreference,
  deviceMemoryGb,
}: RealityCapabilityInput): RealityPerformanceMode {
  if (!webgl || userPreference === "PRECISION_MODE") return "PRECISION_MODE";
  if (reducedMotion || deviceMemoryGb <= 4 || userPreference === "BALANCED_REALITY") {
    return "BALANCED_REALITY";
  }
  return "FULL_REALITY";
}

export function degradeRealityMode(mode: RealityPerformanceMode): RealityPerformanceMode {
  if (mode === "FULL_REALITY") return "BALANCED_REALITY";
  return "PRECISION_MODE";
}

export function runtimeDprCap(mode: RealityPerformanceMode): number {
  if (mode === "FULL_REALITY") return 1.5;
  if (mode === "BALANCED_REALITY") return 1.1;
  return 1;
}
