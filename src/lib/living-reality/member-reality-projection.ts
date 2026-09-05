import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import type {
  RealityProjection,
  SpatialEdgeProjection,
  SpatialNodeProjection,
} from "@/lib/living-reality/reality-projection";

function activeObjectNode(projection: MemberHomeProjection): SpatialNodeProjection {
  return {
    id: projection.object.id,
    kind: projection.object.kind,
    label: projection.object.title,
    state: projection.object.state,
    summary: projection.object.summary,
    claimStatus: projection.object.claimStatus ?? null,
    routeRef: "/member",
  };
}

function lensNode(lens: MemberHomeProjection["lenses"][number]): SpatialNodeProjection {
  return {
    id: `lens:${lens.id}`,
    kind: "canonical_plane_lens",
    label: lens.title,
    state: lens.status,
    summary: lens.description,
    claimStatus: null,
    routeRef: null,
  };
}

function lensEdge(activeId: string, lens: MemberHomeProjection["lenses"][number]): SpatialEdgeProjection {
  return {
    id: `edge:${activeId}:${lens.id}`,
    fromId: activeId,
    toId: `lens:${lens.id}`,
    kind: "lens",
    label: lens.title,
  };
}

export function memberRealityProjection(projection: MemberHomeProjection): RealityProjection {
  const activeObject = activeObjectNode(projection);
  const lensNodes = projection.lenses.map(lensNode);

  return {
    realityId: "member-living-home",
    contextId: projection.object.id,
    title: projection.object.title,
    modeHint: "FULL_REALITY",
    activeObject,
    nodes: [activeObject, ...lensNodes],
    edges: projection.lenses.map((lens) => lensEdge(activeObject.id, lens)),
    attention: [],
    cameraIntent: "ARRIVAL",
    precisionActions: projection.actions.map((action) => ({
      id: action.id,
      label: action.label,
      href: action.href,
    })),
  };
}
