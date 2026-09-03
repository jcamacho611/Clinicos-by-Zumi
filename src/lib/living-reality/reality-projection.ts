export type RealityMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";

export type CameraIntent =
  | "ARRIVAL"
  | "FOCUS_OBJECT"
  | "SHOW_RELATIONSHIPS"
  | "INSPECT"
  | "MISSION"
  | "OUTCOME"
  | "NETWORK_OVERVIEW";

export type SpatialNodeProjection = {
  id: string;
  kind: string;
  label: string;
  state: string;
  emphasis: "normal" | "attention" | "selected" | "blocked" | "verified";
  route: `/${string}` | null;
};

export type SpatialEdgeProjection = {
  id: string;
  from: string;
  to: string;
  relationship: string;
  state: "visible" | "attention" | "blocked";
};

export type AttentionProjection = {
  objectId: string;
  level: "low" | "medium" | "high";
  safeReason: string;
};

export type PrecisionActionProjection = {
  id: string;
  label: string;
  href: `/${string}`;
};

export type RealityProjection = {
  realityId: string;
  title: string;
  modeHint: RealityMode;
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: AttentionProjection[];
  cameraIntent: CameraIntent | null;
  precisionActions: PrecisionActionProjection[];
};
