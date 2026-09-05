import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";
import { PLANE_LANGUAGE } from "@/lib/universe/plane-language";
import {
  ECOSYSTEM_ROOT_ID,
  ecosystemRealityProjection,
} from "@/lib/living-reality/ecosystem-reality-projection";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";

/**
 * Depth layout for the public ecosystem Reality.
 *
 * This is no longer a second projection. `ecosystemRealityProjection()` is the
 * one server truth; everything here is a pure function of it, adding only what
 * a depth-ordered view needs and the contract has no business carrying: which
 * plane a node sits on for stacking, and where on that plane it sits.
 *
 * Two consequences worth stating, because they are the point of the change:
 *
 *   1. The plain-language state a person reads is applied once, on the server,
 *      in the shared module — not re-derived here and again in the component.
 *   2. `legalSecurityGates` no longer reaches the browser at all. It named which
 *      legal and security controls gate each capability, which is a map of our
 *      compliance posture. The canonical contract has no field for it, and it
 *      should not get one.
 */

export type SpatialNode = {
  id: string;
  label: string;
  planeId: CanonicalPlaneId;
  /** Plain language, applied server-side. Never an internal enum. */
  state: string;
  /** What we intend, beside where it actually is. */
  summary: string;
  /** Verified capabilities read bright; claims and intentions read quiet. */
  claimStatus: RealityProjection["nodes"][number]["claimStatus"];
  attention: "normal" | "elevated" | "critical";
  /** Deterministic position. Stable across renders and reloads. */
  angle: number;
  radius: number;
};

export type SpatialPlane = {
  id: CanonicalPlaneId;
  label: string;
  meaning: string;
  depth: number;
  nodes: readonly SpatialNode[];
};

export type SpatialUniverse = {
  /** The canonical contract. The same shape every other Reality speaks. */
  reality: RealityProjection;
  planes: readonly SpatialPlane[];
  connections: readonly { from: string; to: string }[];
  nodeCount: number;
};

/**
 * Stable layout hash. The same node lands in the same place every time, on every
 * device, for every viewer — so the universe is a place people can learn, not a
 * new arrangement on each visit. Never Math.random.
 */
function layoutFor(id: string, index: number, total: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const base = (index / Math.max(total, 1)) * Math.PI * 2;
  const jitter = ((hash % 1000) / 1000 - 0.5) * 0.35;
  const radius = 30 + ((hash >>> 10) % 62);
  return { angle: base + jitter, radius };
}

export function projectSpatialUniverse(): SpatialUniverse {
  const reality = ecosystemRealityProjection();

  const attentionByNode = new Map(
    reality.attention.map((entry) => [entry.nodeId, entry.level] as const),
  );

  // Which plane owns which capability comes from the projection's own edges, so
  // the layout cannot disagree with the contract about where something lives.
  const planeByCapability = new Map<string, CanonicalPlaneId>();
  for (const edge of reality.edges) {
    if (edge.kind !== "relationship") continue;
    const planeId = edge.fromId.replace(/^plane:/, "") as CanonicalPlaneId;
    planeByCapability.set(edge.toId, planeId);
  }

  const nodeById = new Map(reality.nodes.map((node) => [node.id, node] as const));

  const planes = PLANE_LANGUAGE.map((plane, depth) => {
    const owned = reality.nodes.filter(
      (node) => planeByCapability.get(node.id) === plane.id,
    );

    return {
      id: plane.id,
      label: plane.label,
      meaning: plane.meaning,
      depth,
      nodes: owned.map((node, index) => ({
        id: node.id,
        label: node.label,
        planeId: plane.id,
        state: node.state,
        summary: node.summary,
        claimStatus: node.claimStatus,
        attention: attentionByNode.get(node.id) ?? ("normal" as const),
        ...layoutFor(node.id, index, owned.length),
      })),
    } satisfies SpatialPlane;
  });

  // Capability-to-capability lines only. The root and plane scaffolding is
  // structure, not a relationship anyone needs drawn.
  const connections = reality.edges
    .filter((edge) => edge.kind === "relationship" && edge.fromId !== ECOSYSTEM_ROOT_ID)
    .map((edge) => ({ from: edge.fromId, to: edge.toId }))
    .filter((edge) => nodeById.has(edge.to));

  return {
    reality,
    planes,
    connections,
    nodeCount: planes.reduce((total, plane) => total + plane.nodes.length, 0),
  };
}
