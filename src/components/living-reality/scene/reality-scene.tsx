"use client";

import { useMemo } from "react";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";
import type { LivingRealityMaterialTokens } from "@/lib/living-reality/material-tokens";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";
import { CameraDirector } from "./camera-director";
import { RealityEdge } from "./reality-edge";
import { RealityNode } from "./reality-node";

export type RealitySceneProps = {
  projection: RealityProjection;
  materials: LivingRealityMaterialTokens;
  onIntent?: (intent: RealityClientIntent) => void;
};

function positionForIndex(index: number, count: number): [number, number, number] {
  if (count <= 1) return [0, 0, 0];
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const radius = Math.min(2.15, 1.25 + count * 0.07);
  const depth = index % 2 === 0 ? 0.12 : -0.12;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, depth];
}

export function RealityScene({ projection, materials, onIntent }: RealitySceneProps) {
  const positions = useMemo(
    () =>
      new Map(
        projection.nodes.map((node, index) => [
          node.id,
          positionForIndex(index, projection.nodes.length),
        ] as const),
      ),
    [projection.nodes],
  );

  const activePosition = projection.activeObject
    ? positions.get(projection.activeObject.id) ?? null
    : null;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[3, 4, 5]} intensity={1.15} />
      <pointLight position={[-3, -1, 2]} intensity={0.35} color={materials.attention} />

      <CameraDirector intent={projection.cameraIntent} activePosition={activePosition} />

      {projection.edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        return (
          <RealityEdge
            key={edge.id}
            edge={edge}
            from={from}
            to={to}
            materials={materials}
          />
        );
      })}

      {projection.nodes.map((node) => (
        <RealityNode
          key={node.id}
          node={node}
          position={positions.get(node.id) ?? [0, 0, 0]}
          materials={materials}
          onIntent={onIntent}
        />
      ))}
    </>
  );
}
