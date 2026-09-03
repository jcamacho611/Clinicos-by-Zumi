import type { RealityProjection } from "@/lib/living-reality/reality-projection";
import type { PublicLivingUniverseProjection } from "@/lib/orchestration/public-living-universe";

export function publicPathRealityProjection(item: PublicLivingUniverseProjection): RealityProjection {
  const pathNodeId = `path:${item.pathId}`;
  const checkpointNodes = item.steps.map((step, index) => ({
    id: `checkpoint:${item.pathId}:${index}`,
    kind: "path_checkpoint",
    label: step.label,
    state: step.state,
    summary: step.description,
    claimStatus: null,
    routeRef: null,
  })) satisfies RealityProjection["nodes"];

  return {
    realityId: "public-path",
    contextId: item.pathId,
    title: item.title,
    modeHint: "FULL_REALITY",
    activeObject: {
      id: pathNodeId,
      kind: "public_path",
      label: item.title,
      state: item.availability,
      summary: item.summary,
      claimStatus: null,
      routeRef: null,
    },
    nodes: [
      {
        id: pathNodeId,
        kind: "public_path",
        label: item.title,
        state: item.availability,
        summary: item.summary,
        claimStatus: null,
        routeRef: null,
      },
      ...checkpointNodes,
    ],
    edges: checkpointNodes.map((node, index) => ({
      id: `edge:${item.pathId}:${index}`,
      fromId: pathNodeId,
      toId: node.id,
      kind: "path",
      label: item.steps[index]?.label ?? "Path checkpoint",
    })),
    attention: item.steps.flatMap((step, index) => {
      if (step.state === "current") {
        return [{
          nodeId: `checkpoint:${item.pathId}:${index}`,
          level: "elevated" as const,
          explanation: "Current modeled stage",
        }];
      }
      if (step.state === "blocked") {
        return [{
          nodeId: `checkpoint:${item.pathId}:${index}`,
          level: "critical" as const,
          explanation: "Blocked pending requirements",
        }];
      }
      return [];
    }),
    cameraIntent: "SHOW_RELATIONSHIPS",
    precisionActions: [],
  };
}
