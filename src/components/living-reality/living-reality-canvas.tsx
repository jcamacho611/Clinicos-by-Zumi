"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraDirector } from "@/components/living-reality/scene/camera-director";
import { LivingRealityScene, type RealityPalette } from "@/components/living-reality/living-reality-scene";
import type { RealityPerformanceMode, RealityProjection } from "@/lib/living-reality/reality-projection";
import { runtimeDprCap } from "@/lib/living-reality/runtime-mode";

type ActiveRealityMode = Exclude<RealityPerformanceMode, "PRECISION_MODE">;

type LivingRealityCanvasProps = {
  projection: RealityProjection;
  mode: ActiveRealityMode;
  palette: RealityPalette;
  onRuntimeFailure: (reason: "context-lost") => void;
};

function ContextLossGuard({ onRuntimeFailure }: Pick<LivingRealityCanvasProps, "onRuntimeFailure">) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      onRuntimeFailure("context-lost");
    };
    canvas.addEventListener("webglcontextlost", onLost, false);
    return () => canvas.removeEventListener("webglcontextlost", onLost, false);
  }, [gl, onRuntimeFailure]);

  return null;
}

export function LivingRealityCanvas({ projection, mode, palette, onRuntimeFailure }: LivingRealityCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, runtimeDprCap(mode)]}
      frameloop="demand"
      gl={{
        antialias: mode === "FULL_REALITY",
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <ContextLossGuard onRuntimeFailure={onRuntimeFailure} />
      <CameraDirector cameraIntent={projection.cameraIntent} />
      <LivingRealityScene mode={mode} palette={palette} projection={projection} />
    </Canvas>
  );
}
