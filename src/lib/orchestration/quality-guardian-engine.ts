import type { HumanReviewItem } from "@/lib/orchestration/human-review-engine";
import type { NextAction } from "@/lib/orchestration/contracts";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

export type QualityGuardianSnapshot = {
  evaluated: number;
  applicable: number;
  satisfied: number;
  openGaps: number;
  reviewRequired: number;
  overdue: number;
  dueSoon: number;
};

const riskPriority = {
  low: 20,
  review: 55,
  regulated: 85,
  financial: 75,
  destructive: 95,
  phi: 80,
} as const;

function duePriority(dueAt: Date | null | undefined, now: Date) {
  if (!dueAt) return 0;
  const deltaDays = (dueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (deltaDays < 0) return 20;
  if (deltaDays <= 7) return 12;
  if (deltaDays <= 30) return 5;
  return 0;
}

export function qualityGuardianSnapshot(evaluations: readonly GovernedRuleEvaluation[], now = new Date()): QualityGuardianSnapshot {
  const applicable = evaluations.filter((evaluation) => evaluation.applicable);
  const dueSoonCutoff = now.getTime() + 7 * 24 * 60 * 60 * 1000;

  return {
    evaluated: evaluations.length,
    applicable: applicable.length,
    satisfied: applicable.filter((evaluation) => evaluation.status === "satisfied").length,
    openGaps: applicable.filter((evaluation) => evaluation.status === "gap").length,
    reviewRequired: applicable.filter((evaluation) => evaluation.status === "review_required").length,
    overdue: applicable.filter((evaluation) =>
      evaluation.status !== "satisfied" && evaluation.dueAt != null && evaluation.dueAt.getTime() < now.getTime()).length,
    dueSoon: applicable.filter((evaluation) =>
      evaluation.status !== "satisfied"
      && evaluation.dueAt != null
      && evaluation.dueAt.getTime() >= now.getTime()
      && evaluation.dueAt.getTime() <= dueSoonCutoff).length,
  };
}

export function qualityGuardianNextActions(
  evaluations: readonly GovernedRuleEvaluation[],
  now = new Date(),
): NextAction[] {
  return evaluations
    .filter((evaluation) => evaluation.applicable && (evaluation.status === "gap" || evaluation.status === "review_required"))
    .map((evaluation) => ({
      id: `quality:${evaluation.id}`,
      title: evaluation.status === "review_required" ? `Review ${evaluation.ruleTitle}` : `Resolve ${evaluation.ruleTitle}`,
      reason: evaluation.status === "review_required"
        ? "Deterministic evidence is complete, but authorized human review is required before closure."
        : evaluation.reasons.join(" ") || "Applicable quality evidence remains incomplete.",
      sourceType: "system" as const,
      sourceId: evaluation.id,
      capabilityKey: evaluation.status === "review_required" ? "quality.review" : "quality.resolve",
      href: "/insights",
      state: evaluation.status === "review_required" ? "review_required" as const : "recommended" as const,
      priority: Math.min(100, riskPriority[evaluation.riskClass] + duePriority(evaluation.dueAt, now)),
      dueAt: evaluation.dueAt ?? null,
      organizationId: evaluation.organizationId ?? null,
      pathInstanceId: null,
      blockers: evaluation.status === "gap"
        ? evaluation.missingEvidenceKeys.map((key) => `Missing evidence: ${key}`)
        : [],
    }))
    .sort((a, b) => b.priority - a.priority || (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER));
}

export function qualityGuardianReviewItem(input: {
  evaluation: GovernedRuleEvaluation;
  requestedBy: string;
  reviewerId?: string | null;
  now?: Date;
}): HumanReviewItem | null {
  if (input.evaluation.status !== "review_required") return null;
  const now = input.now ?? new Date();

  return {
    id: `quality-review:${input.evaluation.id}`,
    organizationId: input.evaluation.organizationId ?? null,
    subjectType: input.evaluation.subjectType,
    subjectId: input.evaluation.subjectId,
    actionKey: "quality.rule.close",
    riskClass: input.evaluation.riskClass,
    requestedBy: input.requestedBy,
    assignedTo: input.reviewerId ?? null,
    reason: `Review required before closing ${input.evaluation.ruleTitle} (${input.evaluation.ruleKey}@${input.evaluation.ruleVersion}).`,
    state: "pending",
    evidenceRefs: input.evaluation.matchedEvidenceRefs,
    requestedAt: now,
    decidedAt: null,
    decisionReason: null,
  };
}

/**
 * Zumi may summarize, prioritize, and coordinate these outputs. The quality
 * guardian does not let model output create evidence, alter applicability, or
 * close regulated work. Closure remains deterministic and human-reviewed where
 * policy requires it.
 */
export function qualityGuardianBrief(evaluations: readonly GovernedRuleEvaluation[], now = new Date()) {
  const snapshot = qualityGuardianSnapshot(evaluations, now);
  const nextActions = qualityGuardianNextActions(evaluations, now);

  return {
    snapshot,
    nextActions,
    needsAttention: snapshot.openGaps + snapshot.reviewRequired,
    highestPriorityAction: nextActions[0] ?? null,
  };
}
