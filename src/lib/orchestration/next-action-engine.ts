import type { NextAction, PathRuntime } from "@/lib/orchestration/contracts";

const sourceWeight: Record<NextAction["sourceType"], number> = {
  result: 100,
  referral: 95,
  credential: 90,
  claim: 85,
  task: 80,
  schedule: 75,
  transaction: 70,
  grid: 65,
  path: 60,
  edu: 50,
  system: 40,
};

function urgencyFromDueAt(dueAt?: Date | null, now = new Date()) {
  if (!dueAt) return 0;
  const hours = (dueAt.getTime() - now.getTime()) / 3_600_000;
  if (hours <= 0) return 30;
  if (hours <= 24) return 20;
  if (hours <= 72) return 10;
  return 0;
}

export function rankNextActions(actions: readonly NextAction[], now = new Date()) {
  return actions
    .map((action) => ({
      ...action,
      priority: action.priority + sourceWeight[action.sourceType] + urgencyFromDueAt(action.dueAt, now),
    }))
    .sort((a, b) => {
      if (a.state === "blocked" && b.state !== "blocked") return 1;
      if (a.state !== "blocked" && b.state === "blocked") return -1;
      return b.priority - a.priority;
    });
}

export function nextActionsFromPath(path: PathRuntime): NextAction[] {
  const current = path.nodes.find((node) => node.state === "current");
  const blocked = path.nodes.filter((node) => node.state === "blocked");
  const actions: NextAction[] = [];

  if (current) {
    actions.push({
      id: `path:${path.pathId}:${current.id}`,
      title: current.label,
      reason: `This is the next step in ${path.title}.`,
      sourceType: "path",
      sourceId: path.pathId,
      href: current.href ?? null,
      capabilityKey: current.capabilityKey ?? null,
      state: "recommended",
      priority: 20,
      pathInstanceId: path.instanceId ?? null,
      blockers: [],
    });
  }

  for (const node of blocked) {
    actions.push({
      id: `path-blocked:${path.pathId}:${node.id}`,
      title: `Resolve: ${node.label}`,
      reason: node.blockers[0] ?? `${path.title} cannot continue until this step is resolved.`,
      sourceType: "path",
      sourceId: path.pathId,
      href: node.href ?? null,
      capabilityKey: node.capabilityKey ?? null,
      state: "blocked",
      priority: 10,
      pathInstanceId: path.instanceId ?? null,
      blockers: node.blockers,
    });
  }

  return rankNextActions(actions);
}

export function mergeNextActionSources(...sources: readonly NextAction[][]) {
  const deduped = new Map<string, NextAction>();
  for (const source of sources) {
    for (const action of source) {
      const existing = deduped.get(action.id);
      if (!existing || action.priority > existing.priority) deduped.set(action.id, action);
    }
  }
  return rankNextActions(Array.from(deduped.values()));
}
