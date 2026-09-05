import {
  CANONICAL_PLANE_IDS,
  canonicalEcosystemGraph,
  type CanonicalPlaneId,
} from "@/lib/ecosystem/canonical-ecosystem-graph";

/**
 * One source for what a plane means.
 *
 * There were two. The public ecosystem map described `lifecycle` as "How
 * something moves from a need to a finished, proven result"; the member's Living
 * Home described the same plane as "Claims, evidence, verification, eligibility,
 * fulfillment, and outcomes remain separate states." Both were written honestly,
 * neither knew about the other, and they had already drifted apart in register
 * and in emphasis.
 *
 * The fix is not to pick one. They are two registers of the same fact, and both
 * are needed: `meaning` is what we say to a person who has just arrived, and
 * `governance` is what we say to someone who needs to know which states the
 * plane keeps separate. Keeping them in one record means they change together.
 */
export type PlaneLanguage = {
  id: CanonicalPlaneId;
  /** Canonical display name, from the graph itself. Never re-typed here. */
  label: string;
  /** Position in the canonical order, "01".."05". Presentation, not identity. */
  ordinal: string;
  /** Plain language. What this layer is, to someone who has just arrived. */
  meaning: string;
  /** The governed reading. What this layer keeps separate, and from what. */
  governance: string;
};

const MEANING: Record<CanonicalPlaneId, string> = {
  healthcare_universe: "Everyone and every organization in healthcare.",
  economic_resource: "Everything that can be needed, offered, or exchanged.",
  lifecycle: "How something moves from a need to a finished, proven result.",
  operating_infrastructure: "The Klinikos machinery that makes it all work.",
  compounding_business: "How useful work makes the whole network stronger.",
};

const GOVERNANCE: Record<CanonicalPlaneId, string> = {
  healthcare_universe:
    "Your Person identity can participate in governed contexts without collapsing them into one role.",
  economic_resource:
    "Grid can show public-safe work, services, space, equipment, learning, and capacity without asserting eligibility.",
  lifecycle:
    "Claims, evidence, verification, eligibility, fulfillment, and outcomes remain separate states.",
  operating_infrastructure:
    "Identity, Grid, EDU, Network, and Zumi coordinate context while deterministic systems retain authority.",
  compounding_business:
    "Only completed, governed activity may contribute to continuity, reputation evidence, and future value.",
};

/**
 * The five planes in canonical order, with their language attached.
 *
 * Derived from the graph rather than re-declared, so a plane cannot exist here
 * that does not exist there, and the order is the graph's order.
 */
export const PLANE_LANGUAGE: readonly PlaneLanguage[] = canonicalEcosystemGraph.planes.map(
  (plane, index) => ({
    id: plane.id,
    label: plane.label,
    ordinal: String(index + 1).padStart(2, "0"),
    meaning: MEANING[plane.id],
    governance: GOVERNANCE[plane.id],
  }),
);

const BY_ID = new Map<CanonicalPlaneId, PlaneLanguage>(
  PLANE_LANGUAGE.map((plane) => [plane.id, plane]),
);

export function planeLanguage(id: CanonicalPlaneId): PlaneLanguage {
  const found = BY_ID.get(id);
  // CANONICAL_PLANE_IDS and the graph's planes are the same five ids, so this is
  // unreachable — but it fails loudly rather than rendering an empty layer if a
  // sixth plane is ever introduced on one side and not the other.
  if (!found) throw new Error(`No language for plane "${id}". Planes: ${CANONICAL_PLANE_IDS.join(", ")}`);
  return found;
}
