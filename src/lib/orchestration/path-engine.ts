import { getKlinikosPath } from "@/lib/paths/catalog";
import type { PathNodeRuntime, PathRuntime } from "@/lib/orchestration/contracts";

export type PersistedPathSnapshot = {
  instanceId: string;
  pathId: string;
  goal: string;
  status: "active" | "blocked" | "completed" | "cancelled" | "paused";
  completedNodeIds: string[];
  blockedNodeIds: string[];
  currentNodeId?: string | null;
  blockers: string[];
};

export function resolvePathRuntime(input: {
  pathId: string;
  goal?: string | null;
  snapshot?: PersistedPathSnapshot | null;
}): PathRuntime | null {
  const definition = getKlinikosPath(input.pathId);
  if (!definition) return null;

  const snapshot = input.snapshot ?? null;
  const baselineCompleted = snapshot ? [] : definition.nodes.filter((node) => node.state === "complete").map((node) => node.id);
  const baselineBlocked = snapshot ? [] : definition.nodes.filter((node) => node.state === "blocked").map((node) => node.id);
  const completed = new Set([...(snapshot?.completedNodeIds ?? []), ...baselineCompleted]);
  const blocked = new Set([...(snapshot?.blockedNodeIds ?? []), ...baselineBlocked]);
  let currentNodeId = snapshot?.currentNodeId ?? null;

  if (!currentNodeId && !snapshot) {
    currentNodeId = definition.nodes.find((node) => node.state === "current" && !completed.has(node.id) && !blocked.has(node.id))?.id ?? null;
  }
  if (!currentNodeId) {
    currentNodeId = definition.nodes.find((node) => !completed.has(node.id) && !blocked.has(node.id))?.id ?? null;
  }

  const nodes: PathNodeRuntime[] = definition.nodes.map((node) => {
    let state: PathNodeRuntime["state"] = "upcoming";
    if (completed.has(node.id)) state = "complete";
    else if (blocked.has(node.id)) state = "blocked";
    else if (node.id === currentNodeId) state = "current";

    return {
      id: node.id,
      label: node.label,
      href: node.href ?? null,
      capabilityKey: node.capabilityKey ?? null,
      state,
      completedAt: null,
      blockers: state === "blocked" ? snapshot?.blockers ?? [] : [],
    };
  });

  const progress = definition.nodes.length === 0
    ? 1
    : nodes.filter((node) => node.state === "complete").length / definition.nodes.length;

  const status = progress >= 1
    ? "completed"
    : snapshot?.status ?? (nodes.some((node) => node.state === "blocked") ? "blocked" : "active");

  return {
    pathId: definition.id,
    instanceId: snapshot?.instanceId ?? null,
    title: definition.title,
    goal: input.goal?.trim() || snapshot?.goal || definition.summary,
    status,
    progress,
    currentNodeId,
    nodes,
    blockers: snapshot?.blockers ?? [],
    nextActionIds: currentNodeId ? [`path:${definition.id}:${currentNodeId}`] : [],
  };
}

export function baselineSnapshotForPath(input: {
  instanceId: string;
  pathId: string;
  goal: string;
}): PersistedPathSnapshot | null {
  const runtime = resolvePathRuntime({ pathId: input.pathId, goal: input.goal });
  if (!runtime) return null;
  return {
    instanceId: input.instanceId,
    pathId: input.pathId,
    goal: input.goal,
    status: runtime.status,
    completedNodeIds: runtime.nodes.filter((node) => node.state === "complete").map((node) => node.id),
    blockedNodeIds: runtime.nodes.filter((node) => node.state === "blocked").map((node) => node.id),
    currentNodeId: runtime.currentNodeId ?? null,
    blockers: runtime.blockers,
  };
}

export function advancePathSnapshot(input: {
  snapshot: PersistedPathSnapshot;
  completedNodeId: string;
}): PersistedPathSnapshot {
  const definition = getKlinikosPath(input.snapshot.pathId);
  if (!definition) return input.snapshot;

  const completedNodeIds = Array.from(new Set([...input.snapshot.completedNodeIds, input.completedNodeId]));
  const next = definition.nodes.find((node) => !completedNodeIds.includes(node.id) && !input.snapshot.blockedNodeIds.includes(node.id));

  return {
    ...input.snapshot,
    completedNodeIds,
    currentNodeId: next?.id ?? null,
    status: next ? "active" : "completed",
  };
}

/**
 * Storage is intentionally an interface. The first implementation may use Prisma,
 * while tests can use memory. The orchestration engine does not get to smuggle
 * persistence assumptions into policy decisions.
 */
export interface PathPersistenceStore {
  getActiveForActor(actorId: string, organizationId?: string | null): Promise<PersistedPathSnapshot[]>;
  get(instanceId: string): Promise<PersistedPathSnapshot | null>;
  save(snapshot: PersistedPathSnapshot): Promise<PersistedPathSnapshot>;
}

export class MemoryPathPersistenceStore implements PathPersistenceStore {
  private readonly rows = new Map<string, PersistedPathSnapshot>();

  async getActiveForActor(_actorId: string, _organizationId?: string | null) {
    return Array.from(this.rows.values()).filter((row) => row.status === "active" || row.status === "blocked" || row.status === "paused");
  }

  async get(instanceId: string) {
    return this.rows.get(instanceId) ?? null;
  }

  async save(snapshot: PersistedPathSnapshot) {
    this.rows.set(snapshot.instanceId, snapshot);
    return snapshot;
  }
}
