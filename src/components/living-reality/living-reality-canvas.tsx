"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";
import type { RealityMode, RealityProjection } from "@/lib/living-reality/reality-projection";
import {
  readLivingRealityMaterialTokens,
  type LivingRealityMaterialTokens,
} from "@/lib/living-reality/material-tokens";
import { RealityScene } from "./scene/reality-scene";

export type LivingRealityCanvasProps = {
  projection: RealityProjection;
  mode: RealityMode;
  onIntent?: (intent: RealityClientIntent) => void;
};

export function LivingRealityCanvas({
  projection,
  mode,
  onIntent,
}: LivingRealityCanvasProps) {
  const [materials, setMaterials] = useState<LivingRealityMaterialTokens | null>(null);

  useEffect(() => {
    setMaterials(readLivingRealityMaterialTokens());
  }, []);

  if (!materials) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0.4, 6], fov: 42, near: 0.1, far: 100 }}
      dpr={mode === "FULL_REALITY" ? [1, 1.75] : [1, 1.25]}
      frameloop="demand"
      gl={{ antialias: mode === "FULL_REALITY", alpha: true, powerPreference: "high-performance" }}
    >
      <RealityScene
        projection={projection}
        materials={materials}
        onIntent={onIntent}
      />
    </Canvas>
  );
}
