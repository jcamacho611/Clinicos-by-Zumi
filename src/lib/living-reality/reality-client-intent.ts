import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

/**
 * Browser presentation intent only.
 *
 * This union deliberately cannot express clinical, financial, credential,
 * organization, employment, legal, payment, settlement, or other consequential
 * authority. Those transitions remain server-owned and independently governed.
 */
export type RealityClientIntent =
  | { kind: "FOCUS_OBJECT"; objectId: string }
  | { kind: "INSPECT_OBJECT"; objectId: string }
  | { kind: "OPEN_ROUTE"; href: `/${string}` }
  | { kind: "CHANGE_LENS"; lensId: CanonicalPlaneId }
  | { kind: "REQUEST_ACTION_PANEL"; objectId: string | null }
  | { kind: "CHANGE_TIME_VIEW"; direction: "PAST" | "NOW" | "FUTURE" }
  | { kind: "ENTER_MISSION_ROOM"; missionId: string }
  | { kind: "EXIT_MISSION_ROOM" }
  | { kind: "SHOW_RELATIONSHIPS"; objectId: string }
  | { kind: "RECENTER_CAMERA"; objectId: string | null };
