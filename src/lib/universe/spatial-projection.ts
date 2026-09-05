import {
  CANONICAL_PLANE_IDS,
  canonicalEcosystemGraph,
  type CanonicalPlaneId,
  type EcosystemNode,
} from "@/lib/ecosystem/canonical-ecosystem-graph";
import { planeLanguage } from "@/lib/universe/plane-language";

/**
 * Browser projection of the canonical five-plane ecosystem graph.
 *
 * The canonical graph is the authority; this is a disclosure boundary. Two fields
 * are deliberately dropped rather than forwarded:
 *
 *   evidencePaths        — internal source paths ("src/lib/grid/eligibility.ts").
 *                          Shipping these hands a reader a map of where Klinikos
 *                          keeps its eligibility, composition and ranking logic.
 *   externalDependencies — names the vendors and rails a capability leans on,
 *                          which is procurement and attack-surface intelligence.
 *
 * What survives is what a person actually needs to understand the universe:
 * what the thing is, which plane it lives on, how far along it is, who holds
 * authority over it, and whether a legal or privacy boundary governs it.
 */

export type SpatialNode = {
  id: string;
  label: string;
  planeId: CanonicalPlaneId;
  /** Strategic intent. NOW never means "this is live." */
  strategyState: EcosystemNode["strategyState"];
  /** Implementation reality, shown honestly beside the intent. */
  implementationState: EcosystemNode["implementationState"];
  authorityOwner: EcosystemNode["authorityOwner"];
  /** Plain-language boundary notes only; never an internal path. */
  boundaries: readonly string[];
  /** Deterministic position on the plane. Stable across renders and reloads. */
  angle: number;
  radius: number;
};

export type SpatialPlane = {
  id: CanonicalPlaneId;
  label: string;
  /** Plain-language line. Simple above, technical below. */
  meaning: string;
  depth: number;
  nodes: readonly SpatialNode[];
};

export type SpatialUniverse = {
  planes: readonly SpatialPlane[];
  connections: readonly { from: string; to: string }[];
  nodeCount: number;
};

/** Human meaning for each plane. The person never reads "plane" jargon alone. */

/**
 * Stable layout hash. The same node lands in the same place every time, on every
 * device, for every viewer — so the universe is a place people can learn, not a
 * shuffled cloud. No randomness, and nothing is invented: position is derived
 * purely from the canonical node id.
 */
function layoutFor(id: string, index: number, total: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  // Even angular distribution keeps dense planes readable; the hash only nudges
  // each node off the perfect ring so the field feels alive rather than clocklike.
  const base = (index / Math.max(total, 1)) * Math.PI * 2;
  const jitter = ((hash % 1000) / 1000 - 0.5) * 0.35;
  const radius = 30 + ((hash >>> 10) % 62);
  return { angle: base + jitter, radius };
}

export function projectSpatialUniverse(): SpatialUniverse {
  const planes = CANONICAL_PLANE_IDS.map((planeId, depthIndex) => {
    const planeNodes = canonicalEcosystemGraph.nodes.filter((n) => n.planeId === planeId);
    const label =
      canonicalEcosystemGraph.planes.find((p) => p.id === planeId)?.label ?? planeId;

    return {
      id: planeId,
      label,
      meaning: planeLanguage(planeId).meaning,
      depth: depthIndex,
      nodes: planeNodes.map((n, index) => ({
        id: n.id,
        label: n.label,
        planeId: n.planeId,
        strategyState: n.strategyState,
        implementationState: n.implementationState,
        authorityOwner: n.authorityOwner,
        boundaries: n.legalSecurityGates,
        ...layoutFor(n.id, index, planeNodes.length),
      })),
    } satisfies SpatialPlane;
  });

  const known = new Set(canonicalEcosystemGraph.nodes.map((n) => n.id));

  return {
    planes,
    // Edges carry structure, not the relation verb: the verb set is part of how
    // Klinikos reasons about the graph and does not need to reach the browser.
    connections: canonicalEcosystemGraph.edges
      .filter((e) => known.has(e.from) && known.has(e.to))
      .map((e) => ({ from: e.from, to: e.to })),
    nodeCount: canonicalEcosystemGraph.nodes.length,
  };
}
