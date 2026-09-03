import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

/**
 * Presentation intent only. This union deliberately cannot express approval, signing,
 * payment, settlement, publication, verification, authorization, matching, booking,
 * ordering, or any other consequential state transition.
 */
export type RealityClientIntent =
  | { kind: "FOCUS_OBJECT"; objectId: string }
  | { kind: "INSPECT_OBJECT"; objectId: string }
  | { kind: "OPEN_ROUTE"; href: `/${string}` }
  | { kind: "CHANGE_LENS"; lensId: CanonicalPlaneId }
  | { kind: "REQUEST_ACTION_PANEL"; objectId: string | null };
