"use client";

import { useMemo } from "react";
import type { RealityPerformanceMode, RealityProjection } from "@/lib/living-reality/reality-projection";

export type RealityPalette = {
  environment: string;
  surface: string;
  edge: string;
  active: string;
  attention: string;
  blocked: string;
  success: string;
  livingEdge: string;
};

type Point = [number, number, number];

type LivingRealitySceneProps = {
  projection: RealityProjection;
  mode: Exclude<RealityPerformanceMode, "PRECISION_MODE">;
  palette: RealityPalette;
};

function nodePositions(projection: RealityProjection) {
  const positions = new Map<string, Point>();
  const activeId = projection.activeObject?.id ?? projection.nodes[0]?.id;
  if (activeId) positions.set(activeId, [0, 0, 0]);

  const related = projection.nodes.filter((node) => node.id !== activeId);
  const radius = related.length <= 5 ? 2.9 : 3.45;
  related.forEach((node, index) => {
    const angle = (index / Math.max(related.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const depth = Math.sin(angle * 2) * 0.42;
    positions.set(node.id, [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, depth]);
  });

  return positions;
}

function edgePositions(projection: RealityProjection, positions: Map<string, Point>) {
  const values: number[] = [];
  for (const edge of projection.edges) {
    const from = positions.get(edge.fromId);
    const to = positions.get(edge.toId);
    if (!from || !to) continue;
    values.push(...from, ...to);
  }
  return new Float32Array(values);
}

export function LivingRealityScene({ projection, mode, palette }: LivingRealitySceneProps) {
  const positions = useMemo(() => nodePositions(projection), [projection]);
  const edges = useMemo(() => edgePositions(projection, positions), [projection, positions]);
  const activeId = projection.activeObject?.id ?? projection.nodes[0]?.id ?? null;
  const attention = useMemo(
    () => new Map(projection.attention.map((item) => [item.nodeId, item.level])),
    [projection.attention],
  );
  const detail = mode === "FULL_REALITY" ? 40 : 24;

  return (
    <>
      <color attach="background" args={[palette.environment]} />
      <fog attach="fog" args={[palette.environment, 9, 18]} />
      <ambientLight intensity={mode === "FULL_REALITY" ? 1.15 : 0.92} />
      <pointLight color={palette.active} intensity={mode === "FULL_REALITY" ? 22 : 13} position={[0, 1.4, 5]} distance={15} />
      <pointLight color={palette.livingEdge} intensity={8} position={[-5, -2, 1]} distance={13} />

      <mesh rotation={[Math.PI / 2.4, 0, 0]} position={[0, 0, -1.15]}>
        <torusGeometry args={[3.55, 0.008, 6, mode === "FULL_REALITY" ? 120 : 72]} />
        <meshBasicMaterial color={palette.edge} transparent opacity={0.52} />
      </mesh>
      <mesh rotation={[Math.PI / 2.1, 0.22, 0.1]} position={[0, 0, -1.5]}>
        <torusGeometry args={[4.25, 0.004, 4, mode === "FULL_REALITY" ? 120 : 64]} />
        <meshBasicMaterial color={palette.livingEdge} transparent opacity={0.18} />
      </mesh>

      {edges.length > 0 ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[edges, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={palette.edge} transparent opacity={0.44} />
        </lineSegments>
      ) : null}

      {projection.nodes.map((node) => {
        const position = positions.get(node.id) ?? [0, 0, 0];
        const active = node.id === activeId;
        const gravity = attention.get(node.id);
        const nodeColor = gravity === "critical"
          ? palette.blocked
          : gravity === "elevated"
            ? palette.attention
            : active
              ? palette.active
              : palette.surface;
        const scale = active ? 1 : gravity === "critical" ? 0.76 : gravity === "elevated" ? 0.68 : 0.58;

        return (
          <group key={node.id} position={position}>
            <mesh scale={scale}>
              <icosahedronGeometry args={[0.78, active ? 2 : 1]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={active ? palette.livingEdge : nodeColor}
                emissiveIntensity={active ? 0.34 : gravity ? 0.18 : 0.04}
                metalness={active ? 0.72 : 0.45}
                roughness={active ? 0.22 : 0.38}
                transparent
                opacity={active ? 0.98 : 0.78}
              />
            </mesh>
            <mesh scale={active ? 1.12 : 0.82}>
              <sphereGeometry args={[0.8, detail, detail]} />
              <meshBasicMaterial color={active ? palette.active : palette.edge} transparent opacity={active ? 0.08 : 0.035} wireframe />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
