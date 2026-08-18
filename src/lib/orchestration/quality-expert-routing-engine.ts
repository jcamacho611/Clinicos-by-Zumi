import type { NextAction } from "@/lib/orchestration/contracts";
import type { ExpertDataAccessClass, ExpertEngagementNeed } from "@/lib/orchestration/expert-grid-engine";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

function urgencyFromEvaluation(evaluation: GovernedRuleEvaluation, now: Date): ExpertEngagementNeed["urgency"] {
  if (evaluation.riskClass === "destructive" || evaluation.riskClass === "regulated") return "critical";
  if (evaluation.dueAt && evaluation.dueAt.getTime() < now.getTime()) return "urgent";
  if (evaluation.dueAt && evaluation.dueAt.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "priority";
  return "routine";
}

function priorityFromUrgency(urgency: ExpertEngagementNeed["urgency"]) {
  return { routine: 45, priority: 65, urgent: 80, critical: 95 }[urgency];
}

export function qualityExpertNeedFromEvaluation(input: {
  evaluation: GovernedRuleEvaluation;
  internalCapabilityAvailable: boolean;
  expertCapabilityKey?: string;
  jurisdictionKey?: string | null;
  remoteAllowed?: boolean;
  onsiteLocationKey?: string | null;
  requiredExpertEvidenceKeys?: string[];
  requiredDataAccessClass?: ExpertDataAccessClass;
  maxPriceCents?: number | null;
  now?: Date;
}): ExpertEngagementNeed | null {
  const { evaluation } = input;
  if (!evaluation.applicable || evaluation.status === "satisfied" || evaluation.status === "not_applicable") return null;
  if (input.internalCapabilityAvailable) return null;
  if (!evaluation.organizationId) return null;

  const now = input.now ?? new Date();
  return {
    // Grid demand identity is intentionally organization + rule scoped. The
    // patient/subject identifier stays inside the clinic's governed evaluation
    // and is not encoded into marketplace-facing identifiers.
    id: `expert-need:${evaluation.organizationId}:${evaluation.ruleKey}:${evaluation.ruleVersion}`,
    organizationId: evaluation.organizationId,
    capabilityKey: input.expertCapabilityKey
      ?? (evaluation.status === "review_required" ? "quality.expert.review" : "quality.expert.remediation"),
    capabilityDomain: "quality",
    jurisdictionKey: input.jurisdictionKey ?? null,
    remoteAllowed: input.remoteAllowed ?? true,
    onsiteLocationKey: input.onsiteLocationKey ?? null,
    requiredEvidenceKeys: input.requiredExpertEvidenceKeys ?? [],
    requiredDataAccessClass: input.requiredDataAccessClass ?? "deidentified",
    urgency: urgencyFromEvaluation(evaluation, now),
    maxPriceCents: input.maxPriceCents ?? null,
  };
}

export function qualityExpertGridNextAction(input: {
  need: ExpertEngagementNeed;
  evaluation: GovernedRuleEvaluation;
}): NextAction {
  return {
    id: `grid:${input.need.id}`,
    title: "Find qualified quality support",
    reason: qualityExpertEscalationReason(input.evaluation),
    sourceType: "grid",
    sourceId: input.need.id,
    capabilityKey: "grid.request.create",
    href: "/grid/requests",
    state: "recommended",
    priority: priorityFromUrgency(input.need.urgency),
    dueAt: input.evaluation.dueAt ?? null,
    organizationId: input.need.organizationId,
    pathInstanceId: null,
    blockers: [],
  };
}

/**
 * This function creates only a Grid demand object. It does not disclose rule
 * evidence, patient facts, or records to an outside expert. Sensitive access is
 * a later, separately authorized engagement step.
 */
export function qualityExpertEscalationReason(evaluation: GovernedRuleEvaluation) {
  if (evaluation.status === "review_required") {
    return `Authorized expert review is required before ${evaluation.ruleKey}@${evaluation.ruleVersion} can close.`;
  }
  if (evaluation.status === "gap") {
    return `${evaluation.missingEvidenceKeys.length} governed evidence requirement(s) remain unresolved for ${evaluation.ruleKey}@${evaluation.ruleVersion}.`;
  }
  return "No expert escalation is required for this evaluation state.";
}
