import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";

/**
 * Presentation-only adapter for the current minimum-necessary member projection.
 * It does not invent graph relationships or expand the data boundary merely because
 * the renderer can display more geometry.
 */
export function memberHomeToRealityProjection(input: MemberHomeProjection): RealityProjection {
  const activeObject = {
    id: input.object.id,
    kind: input.object.kind,
    label: input.object.title,
    state: input.object.state,
    emphasis: "selected" as const,
    route: null,
  };

  return {
    realityId: "member-living-home",
    title: input.object.title,
    modeHint: "FULL_REALITY",
    activeObject,
    nodes: [activeObject],
    edges: [],
    attention: [],
    cameraIntent: "FOCUS_OBJECT",
    precisionActions: input.actions.map((action) => ({
      id: action.id,
      label: action.label,
      href: action.href,
    })),
  };
}
