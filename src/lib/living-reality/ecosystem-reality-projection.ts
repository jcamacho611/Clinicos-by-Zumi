import {
  canonicalEcosystemGraph,
  type EcosystemNode,
} from "@/lib/ecosystem/canonical-ecosystem-graph";
import { PLANE_LANGUAGE } from "@/lib/universe/plane-language";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";

/**
 * The public ecosystem, projected onto the canonical Reality contract.
 *
 * This replaces a second spatial vocabulary. `/ecosystem/universe` previously
 * built its own projection shape; it now produces a `RealityProjection` like
 * every other Reality, so there is one contract for the member's Living Home,
 * the public Paths, and this.
 *
 * It remains a disclosure boundary. `canonicalEcosystemGraph` carries two fields
 * on every node that must never cross to a browser:
 *
 *   evidencePaths        — internal source paths ("src/lib/grid/eligibility.ts"),
 *                          a map of where Klinikos keeps eligibility, composition
 *                          and ranking logic.
 *   externalDependencies — the vendors and rails a capability leans on, which is
 *                          procurement and attack-surface intelligence.
 *
 * Every field below is written explicitly. Nothing is spread from a graph node,
 * because a spread is how those two fields would silently return.
 */

/** Honest state chips. Intent and reality are shown side by side, never merged. */
export const IMPLEMENTATION_LABEL: Record<string, string> = {
  LIVE_VERIFIED: "Live",
  BUILT_NEEDS_VERIFICATION: "Built · needs checking",
  PARTIAL: "Partly built",
  DESIGNED: "Designed",
  PLANNED: "Planned",
  EXTERNAL_CONNECTION_REQUIRED: "Needs an outside connection",
  LEGAL_REVIEW_REQUIRED: "Waiting on legal review",
  NOT_BUILT: "Not built yet",
};

export const STRATEGY_LABEL: Record<string, string> = {
  NOW: "Now",
  NEXT: "Next",
  LATER: "Later",
  PARTNER: "With a partner",
  CONNECT: "Connect, don't rebuild",
  INTERNALIZE: "Bring in-house",
  NEVER_BUILD: "Never build",
};

export const ECOSYSTEM_ROOT_ID = "klinikos";

/**
 * Implementation state read as an authority claim.
 *
 * The contract's `claimStatus` is the first brick of the authority grammar, and
 * it applies to a capability exactly as it applies to a person: what Klinikos
 * asserts is not the same as what has been checked. Only a verified-live
 * capability may read as verified; an intention reads as unverified, and
 * anything held by legal reads as in review.
 */
function claimStatusFor(
  node: Pick<EcosystemNode, "implementationState">,
): RealityProjection["nodes"][number]["claimStatus"] {
  if (node.implementationState === "LIVE_VERIFIED") return "verified";
  if (node.implementationState === "BUILT_NEEDS_VERIFICATION") return "claimed";
  if (node.implementationState === "LEGAL_REVIEW_REQUIRED") return "in_review";
  return "unverified";
}

/** What we intend, beside where it actually is. Never collapsed into one line. */
function summaryFor(node: EcosystemNode) {
  const intent = STRATEGY_LABEL[node.strategyState] ?? node.strategyState;
  const reality = IMPLEMENTATION_LABEL[node.implementationState] ?? node.implementationState;
  return `Intent: ${intent}. Where it actually is: ${reality}.`;
}

export function ecosystemRealityProjection(): RealityProjection {
  const root: RealityProjection["nodes"][number] = {
    id: ECOSYSTEM_ROOT_ID,
    kind: "klinikos_universe",
    label: "Klinikos",
    state: "One system, five layers",
    summary:
      "Klinikos is not one product. It is a set of businesses that share the same people, the same evidence and the same rails.",
    claimStatus: null,
    routeRef: "/ecosystem/universe",
  };

  const planeNodes = PLANE_LANGUAGE.map((plane) => ({
    id: `plane:${plane.id}`,
    kind: "canonical_plane",
    label: plane.label,
    state: `Layer ${plane.ordinal}`,
    summary: plane.meaning,
    claimStatus: null,
    routeRef: null,
  })) satisfies RealityProjection["nodes"];

  const capabilityNodes = canonicalEcosystemGraph.nodes.map((node) => ({
    id: `capability:${node.id}`,
    kind: "ecosystem_capability",
    label: node.label,
    state: IMPLEMENTATION_LABEL[node.implementationState] ?? node.implementationState,
    summary: summaryFor(node),
    claimStatus: claimStatusFor(node),
    routeRef: null,
  })) satisfies RealityProjection["nodes"];

  const planeEdges = PLANE_LANGUAGE.map((plane) => ({
    id: `edge:${ECOSYSTEM_ROOT_ID}:${plane.id}`,
    fromId: ECOSYSTEM_ROOT_ID,
    toId: `plane:${plane.id}`,
    kind: "lens" as const,
    label: plane.label,
  }));

  const capabilityEdges = canonicalEcosystemGraph.nodes.map((node) => ({
    id: `edge:${node.planeId}:${node.id}`,
    fromId: `plane:${node.planeId}`,
    toId: `capability:${node.id}`,
    kind: "relationship" as const,
    label: "On this layer",
  }));

  // Attention is server-derived and carries a plain-language reason. The browser
  // may render a level it is given; it never decides that something is blocked.
  const attention = canonicalEcosystemGraph.nodes.flatMap<RealityProjection["attention"][number]>(
    (node) => {
      if (node.implementationState === "LEGAL_REVIEW_REQUIRED") {
        return [{
          nodeId: `capability:${node.id}`,
          level: "critical",
          explanation: "Waiting on legal review",
        }];
      }
      if (node.implementationState === "EXTERNAL_CONNECTION_REQUIRED") {
        return [{
          nodeId: `capability:${node.id}`,
          level: "elevated",
          explanation: "Needs an outside connection before it can work",
        }];
      }
      return [];
    },
  );

  return {
    realityId: "public-ecosystem",
    contextId: "canonical-ecosystem-graph",
    title: "The Klinikos universe",
    modeHint: "FULL_REALITY",
    activeObject: root,
    nodes: [root, ...planeNodes, ...capabilityNodes],
    edges: [...planeEdges, ...capabilityEdges],
    attention,
    cameraIntent: "NETWORK_OVERVIEW",
    // A public informational surface carries no governed action. When one exists
    // it arrives here as a real route, never as a client-invented capability.
    precisionActions: [],
  };
}

/**
 * Exported for tests only.
 *
 * No canonical node is LIVE_VERIFIED today, so the "nothing reads as verified"
 * guard would pass even if this mapping were broken. This lets that guard prove
 * the mapping can report verified, rather than passing by having nothing to check.
 */
export const claimStatusForTest = claimStatusFor;
