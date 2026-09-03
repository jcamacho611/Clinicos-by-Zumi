"use client";

import dynamic from "next/dynamic";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";
import type { RealityMode, RealityProjection } from "@/lib/living-reality/reality-projection";

const LivingRealityCanvas = dynamic(
  () =>
    import("./living-reality-canvas").then((module) => module.LivingRealityCanvas),
  { ssr: false },
);

export type LivingRealityRuntimeProps = {
  projection: RealityProjection;
  mode: RealityMode;
  onIntent?: (intent: RealityClientIntent) => void;
  className?: string;
};

export function LivingRealityRuntime({
  projection,
  mode,
  onIntent,
  className,
}: LivingRealityRuntimeProps) {
  if (mode === "PRECISION_MODE") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={className}
      data-living-reality="presentation"
      data-reality-mode={mode}
    >
      <LivingRealityCanvas projection={projection} mode={mode} onIntent={onIntent} />
    </div>
  );
}
