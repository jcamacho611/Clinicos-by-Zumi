import "server-only";

import type { PathGuidance } from "@/lib/orchestration/path-guidance-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { LivingHomePathState, LivingHomePathView } from "@/lib/home/living-home-view-model";

function mapState(guidance: PathGuidance | null, completed: boolean): LivingHomePathState {
  if (completed) return "done";
  if (!guidance) return "active";
  if (guidance.state === "blocked") return "blocked";
  if (guidance.state === "review_required") return "needs_review";
  if (guidance.state === "waiting") return "waiting";
  if (guidance.state === "available" || guidance.state === "recommended") return "ready";
  if (guidance.state === "completed") return "done";
  return "active";
}

function stateLabel(state: LivingHomePathState) {
  if (state === "blocked") return "Needs attention";
  if (state === "needs_review") return "Ready for review";
  if (state === "waiting") return "Waiting";
  if (state === "ready") return "Ready";
  if (state === "done") return "Completed";
  if (state === "needs_you") return "Needs you";
  return "In progress";
}

export function projectLivingHomePath(
  snapshot: PersistedPathSnapshot,
  guidance: PathGuidance | null = null,
): LivingHomePathView {
  const definition = getKlinikosPath(snapshot.pathId);
  const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });
  const completed = runtime?.status === "completed" || snapshot.status === "completed";
  const state = mapState(guidance, completed);
  const progressPercent = Math.max(0, Math.min(100, Math.round((runtime?.progress ?? 0) * 100)));

  return {
    instanceId: snapshot.instanceId,
    pathId: snapshot.pathId,
    title: definition?.title ?? "Klinikos Path",
    goal: snapshot.goal,
    progressPercent,
    state,
    stateLabel: stateLabel(state),
    reason: guidance?.reason ?? (completed ? "This Path is complete." : "This Path is active."),
    blockers: (guidance?.blockers ?? []).map((blocker) => ({
      code: blocker.code,
      title: blocker.title,
      explanation: blocker.explanation,
      owner: blocker.owner,
      canResolveNow: blocker.canResolveNow,
    })),
    nextActionLabel: guidance?.title ?? (completed ? null : "Continue"),
    nextActionHref: guidance?.href ?? null,
  };
}

export function projectLivingHomePaths(
  snapshots: readonly PersistedPathSnapshot[],
  guidanceList: readonly PathGuidance[],
): LivingHomePathView[] {
  const guidanceByInstanceId = new Map(guidanceList.map((guidance) => [guidance.instanceId, guidance]));
  return snapshots.map((snapshot) => projectLivingHomePath(snapshot, guidanceByInstanceId.get(snapshot.instanceId) ?? null));
}
