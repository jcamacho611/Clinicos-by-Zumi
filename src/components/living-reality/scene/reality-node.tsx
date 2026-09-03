"use client";

import { useMemo } from "react";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";
import type { LivingRealityMaterialTokens } from "@/lib/living-reality/material-tokens";
import type { SpatialNodeProjection } from "@/lib/living-reality/reality-projection";

export type RealityNodeProps = {
  node: SpatialNodeProjection;
  position: [number, number, number];
  materials: LivingRealityMaterialTokens;
  onIntent?: (intent: RealityClientIntent) => void;
};

export function RealityNode({
  node,
  position,
  materials,
  onIntent,
}: RealityNodeProps) {
  const presentation = useMemo(() => {
    if (node.emphasis === "blocked") {
      return { color: materials.blocked, scale: 0.92 };
    }
    if (node.emphasis === "verified") {
      return { color: materials.verified, scale: 1.04 };
    }
    if (node.emphasis === "attention" || node.emphasis === "selected") {
      return { color: materials.attention, scale: node.emphasis === "selected" ? 1.18 : 1.08 };
    }
    return { color: materials.object, scale: 1 };
  }, [materials, node.emphasis]);

  return (
    <mesh
      position={position}
      scale={presentation.scale}
      onClick={(event) => {
        event.stopPropagation();
        onIntent?.({ kind: "FOCUS_OBJECT", objectId: node.id });
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onIntent?.({ kind: "INSPECT_OBJECT", objectId: node.id });
      }}
    >
      <icosahedronGeometry args={[0.32, 2]} />
      <meshStandardMaterial
        color={presentation.color}
        emissive={node.emphasis === "attention" || node.emphasis === "selected" ? materials.attention : materials.environment}
        emissiveIntensity={node.emphasis === "selected" ? 0.35 : 0.1}
        metalness={0.08}
        roughness={0.42}
      />
    </mesh>
  );
}
