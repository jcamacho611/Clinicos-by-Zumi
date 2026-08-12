export type KlinikosActorKind = "user" | "patient" | "provider" | "organization" | "system";
export type KlinikosContextKind = "personal" | "clinic" | "grid" | "edu" | "patient" | "system";
export type KlinikosRiskClass = "low" | "review" | "regulated" | "financial" | "destructive" | "phi";
export type KlinikosDecisionState = "allowed" | "blocked" | "review_required" | "unavailable";
export type KlinikosActionState = "available" | "recommended" | "blocked" | "waiting" | "completed" | "review_required";
export type KlinikosPathStatus = "active" | "blocked" | "completed" | "cancelled" | "paused";
export type KlinikosEventSeverity = "info" | "attention" | "warning" | "critical";

export type ActorContext = {
  actorId: string;
  actorKind: KlinikosActorKind;
  userId?: string | null;
  patientId?: string | null;
  providerId?: string | null;
  organizationId?: string | null;
  contextKind: KlinikosContextKind;
  roleKeys: string[];
  permissionKeys: string[];
};

export type StructuredIntent = {
  raw: string;
  actor: "professional" | "learner" | "clinic" | "operations" | "patient" | "unknown";
  goal: string;
  outcome: string;
  timing?: string | null;
  location?: string | null;
  constraints: string[];
  candidatePathIds: string[];
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions: string[];
};

export type CapabilityDefinition = {
  key: string;
  label: string;
  description: string;
  route?: string | null;
  domain: "care" | "network" | "grid" | "edu" | "revenue" | "work" | "organization" | "system";
  requiredRoles: string[];
  requiredPermissions: string[];
  riskClass: KlinikosRiskClass;
  requiresConfirmation: boolean;
  requiresHumanReview: boolean;
  connectorIds: string[];
  productionState: "available" | "demo" | "manual_fallback" | "connector_required" | "planned";
};

export type PolicyDecision = {
  state: KlinikosDecisionState;
  reasons: string[];
  missingRoles: string[];
  missingPermissions: string[];
  missingConnectors: string[];
  requiredConfirmations: string[];
};

export type PathNodeRuntime = {
  id: string;
  label: string;
  capabilityKey?: string | null;
  href?: string | null;
  state: "complete" | "current" | "upcoming" | "blocked";
  completedAt?: Date | null;
  blockers: string[];
};

export type PathRuntime = {
  pathId: string;
  instanceId?: string | null;
  title: string;
  goal: string;
  status: KlinikosPathStatus;
  progress: number;
  currentNodeId?: string | null;
  nodes: PathNodeRuntime[];
  blockers: string[];
  nextActionIds: string[];
};

export type NextAction = {
  id: string;
  title: string;
  reason: string;
  sourceType: "path" | "task" | "referral" | "credential" | "edu" | "grid" | "transaction" | "result" | "claim" | "schedule" | "system";
  sourceId?: string | null;
  capabilityKey?: string | null;
  href?: string | null;
  state: KlinikosActionState;
  priority: number;
  dueAt?: Date | null;
  organizationId?: string | null;
  pathInstanceId?: string | null;
  blockers: string[];
};

export type KlinikosSignal = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  sourceType: NextAction["sourceType"];
  sourceId?: string | null;
  severity: KlinikosEventSeverity;
  href?: string | null;
  observedAt: Date;
};

export type DomainEvent = {
  id: string;
  type: string;
  actorId?: string | null;
  actorKind?: KlinikosActorKind | null;
  organizationId?: string | null;
  patientId?: string | null;
  providerId?: string | null;
  pathInstanceId?: string | null;
  sourceType: string;
  sourceId?: string | null;
  severity: KlinikosEventSeverity;
  occurredAt: Date;
  payload: Record<string, unknown>;
};

export type BlockerAlternative = {
  title: string;
  description: string;
  capabilityKey?: string | null;
  href?: string | null;
};

export type BlockerResolution = {
  code: string;
  title: string;
  explanation: string;
  owner: "user" | "clinic" | "reviewer" | "connector" | "system";
  canResolveNow: boolean;
  alternatives: BlockerAlternative[];
};

export type MatchCandidate<T = unknown> = {
  id: string;
  item: T;
  eligible: boolean;
  score: number;
  reasons: string[];
  blockers: string[];
};

export type EngineResult<T> = {
  ok: boolean;
  value?: T;
  errors: string[];
  warnings: string[];
};
