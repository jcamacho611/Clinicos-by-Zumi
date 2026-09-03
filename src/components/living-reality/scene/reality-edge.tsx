"use client";

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { LivingRealityMaterialTokens } from "@/lib/living-reality/material-tokens";
import type { SpatialEdgeProjection } from "@/lib/living-reality/reality-projection";

export type RealityEdgeProps = {
  edge: SpatialEdgeProjection;
  from: [number, number, number];
  to: [number, number, number];
  materials: LivingRealityMaterialTokens;
};

export function RealityEdge({ edge, from, to, materials }: RealityEdgeProps) {
  const geometry = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.normalize(),
    );
    return { distance, midpoint, quaternion };
  }, [from, to]);

  const color =
    edge.state === "blocked"
      ? materials.blocked
      : edge.state === "attention"
        ? materials.attention
        : materials.line;

  return (
    <mesh position={geometry.midpoint} quaternion={geometry.quaternion}>
      <cylinderGeometry args={[0.008, 0.008, geometry.distance, 8]} />
      <meshBasicMaterial color={color} transparent opacity={edge.state === "visible" ? 0.44 : 0.78} />
    </mesh>
  );
}
