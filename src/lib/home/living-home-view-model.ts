export type LivingHomePathState =
  | "needs_you"
  | "waiting"
  | "needs_review"
  | "blocked"
  | "ready"
  | "done"
  | "active";

export type LivingHomeBlockerView = {
  code: string;
  title: string;
  explanation: string;
  owner: "user" | "clinic" | "reviewer" | "connector" | "system";
  canResolveNow: boolean;
};

export type LivingHomePathView = {
  instanceId: string;
  pathId: string;
  title: string;
  goal: string;
  progressPercent: number;
  state: LivingHomePathState;
  stateLabel: string;
  reason: string;
  blockers: LivingHomeBlockerView[];
  nextActionLabel: string | null;
  nextActionHref: string | null;
};

export type LivingHomeSurfaceView = {
  label: string;
  href: string;
};

export type LivingHomeCommandView =
  | { kind: "path"; message: string; path: LivingHomePathView }
  | { kind: "surface"; message: string; surface: LivingHomeSurfaceView }
  | { kind: "clarification"; message: string; clarification: string }
  | { kind: "blocked"; message: string }
  | { kind: "unavailable"; message: string };
