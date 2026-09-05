export type RealityPerformanceMode =
  | "FULL_REALITY"
  | "BALANCED_REALITY"
  | "PRECISION_MODE";

export type CameraIntent =
  | "ARRIVAL"
  | "FOCUS_OBJECT"
  | "SHOW_RELATIONSHIPS"
  | "INSPECT"
  | "MISSION"
  | "OUTCOME"
  | "NETWORK_OVERVIEW"
  | "TIME_COMPARE"
  | "PRECISION_LOCK";

export type SpatialNodeProjection = {
  id: string;
  kind: string;
  label: string;
  state: string;
  summary: string;
  claimStatus: "claimed" | "verified" | "in_review" | "unverified" | null;
  routeRef: `/${string}` | null;
};

export type SpatialEdgeProjection = {
  id: string;
  fromId: string;
  toId: string;
  kind: "lens" | "path" | "relationship";
  label: string;
};

export type AttentionProjection = {
  nodeId: string;
  level: "normal" | "elevated" | "critical";
  explanation: string;
};

export type PrecisionActionProjection = {
  id: string;
  label: string;
  href: `/${string}`;
};

export type RealityProjection = {
  realityId: string;
  contextId: string;
  title: string;
  modeHint: RealityPerformanceMode;
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: AttentionProjection[];
  cameraIntent: CameraIntent | null;
  precisionActions: PrecisionActionProjection[];
};
