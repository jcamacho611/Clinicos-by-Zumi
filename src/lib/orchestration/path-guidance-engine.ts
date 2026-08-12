import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { actorContextFromSession } from "@/lib/orchestration/actor-context";
import { blockersFromPolicy } from "@/lib/orchestration/blocker-engine";
import { evaluateCapabilityPolicy } from "@/lib/orchestration/capability-engine";
import type { BlockerResolution, KlinikosActionState, NextAction } from "@/lib/orchestration/contracts";
import { nextActionsFromPath } from "@/lib/orchestration/next-action-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";

export type PathGuidance = {
  instanceId: string;
  pathId: string;
  state: KlinikosActionState;
  title: string;
  reason: string;
  href: string | null;
  capabilityKey: string | null;
  blockers: BlockerResolution[];
};

function unavailableBlocker(reason: string): BlockerResolution {
  return {
    code: "capability_unavailable",
    title: "Action unavailable",
    explanation: reason,
    owner: "system",
    canResolveNow: false,
    alternatives: [],
  };
}

function guidanceFromAction(
  snapshot: PersistedPathSnapshot,
  action: NextAction,
  input?: { state?: KlinikosActionState; reason?: string; blockers?: BlockerResolution[] },
): PathGuidance {
  return {
    instanceId: snapshot.instanceId,
    pathId: snapshot.pathId,
    state: input?.state ?? action.state,
    title: action.title,
    reason: input?.reason ?? action.reason,
    href: action.href ?? null,
    capabilityKey: action.capabilityKey ?? null,
    blockers: input?.blockers ?? [],
  };
}

export function resolvePathGuidance(
  session: ClinicSession,
  snapshot: PersistedPathSnapshot,
  connectedConnectorIds: readonly string[] = [],
): PathGuidance | null {
  const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });
  if (!runtime || runtime.status === "completed" || runtime.status === "cancelled") return null;

  const [action] = nextActionsFromPath(runtime);
  if (!action) return null;
  if (!action.capabilityKey) return guidanceFromAction(snapshot, action);

  const decision = evaluateCapabilityPolicy({
    context: actorContextFromSession(session),
    capabilityKey: action.capabilityKey,
    connectedConnectorIds,
  });

  if (decision.state === "allowed") return guidanceFromAction(snapshot, action);

  if (decision.state === "review_required") {
    const blockers = blockersFromPolicy(decision);
    return guidanceFromAction(snapshot, action, {
      state: "review_required",
      reason: decision.reasons[0] ?? "A governed human review is required before this step can be completed.",
      blockers,
    });
  }

  if (decision.state === "blocked") {
    const blockers = blockersFromPolicy(decision);
    return guidanceFromAction(snapshot, action, {
      state: "blocked",
      reason: decision.reasons[0] ?? "This step is blocked until its requirements are satisfied.",
      blockers,
    });
  }

  const reason = decision.reasons[0] ?? "This capability is not available in the active context.";
  return guidanceFromAction(snapshot, action, {
    state: "blocked",
    reason,
    blockers: [unavailableBlocker(reason)],
  });
}

export function resolvePathGuidanceList(
  session: ClinicSession,
  snapshots: readonly PersistedPathSnapshot[],
  connectedConnectorIds: readonly string[] = [],
) {
  return snapshots
    .map((snapshot) => resolvePathGuidance(session, snapshot, connectedConnectorIds))
    .filter((item): item is PathGuidance => item !== null);
}
