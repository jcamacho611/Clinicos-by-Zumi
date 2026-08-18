import type { DomainEvent } from "@/lib/orchestration/contracts";
import { createWorkflowJob, type WorkflowJob } from "@/lib/orchestration/workflow-engine";
import type { GovernedRuleDomain, GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

export type AssuranceMonitorPlan = {
  id: string;
  organizationId: string;
  domains: GovernedRuleDomain[];
  ruleKeys: string[];
  enabled: boolean;
  cadenceMinutes: number;
  sourceType: "scheduled" | "event_driven" | "hybrid";
  actorId?: string | null;
};

export function createAssuranceEvaluationJob(input: {
  plan: AssuranceMonitorPlan;
  now?: Date;
}): WorkflowJob | null {
  if (!input.plan.enabled) return null;
  const now = input.now ?? new Date();

  return createWorkflowJob({
    id: `assurance:${input.plan.id}:${now.getTime()}`,
    type: "assurance.evaluate-rule-set",
    organizationId: input.plan.organizationId,
    actorId: input.plan.actorId ?? null,
    sourceId: input.plan.id,
    payload: {
      planId: input.plan.id,
      domains: input.plan.domains,
      ruleKeys: input.plan.ruleKeys,
      triggerMode: input.plan.sourceType,
    },
    maxAttempts: 4,
    runAfter: now,
    now,
  });
}

export function nextAssuranceRunAt(plan: AssuranceMonitorPlan, from = new Date()) {
  const cadenceMinutes = Math.max(5, plan.cadenceMinutes);
  return new Date(from.getTime() + cadenceMinutes * 60 * 1000);
}

export function assuranceEventsFromEvaluations(input: {
  evaluations: readonly GovernedRuleEvaluation[];
  actorId?: string | null;
  now?: Date;
}): DomainEvent[] {
  const now = input.now ?? new Date();

  return input.evaluations
    .filter((evaluation) => evaluation.applicable && (evaluation.status === "gap" || evaluation.status === "review_required"))
    .map((evaluation) => ({
      id: `assurance-event:${evaluation.id}:${now.getTime()}`,
      type: evaluation.status === "review_required" ? "assurance.review_required" : "assurance.gap_detected",
      actorId: input.actorId ?? null,
      actorKind: input.actorId ? "system" as const : null,
      organizationId: evaluation.organizationId ?? null,
      patientId: evaluation.subjectType === "patient" ? evaluation.subjectId : null,
      providerId: evaluation.subjectType === "provider" ? evaluation.subjectId : null,
      pathInstanceId: null,
      sourceType: "governed_rule_evaluation",
      sourceId: evaluation.id,
      severity: evaluation.status === "review_required" || evaluation.riskClass === "regulated" ? "warning" as const : "attention" as const,
      occurredAt: now,
      payload: {
        ruleKey: evaluation.ruleKey,
        ruleVersion: evaluation.ruleVersion,
        domain: evaluation.domain,
        status: evaluation.status,
        missingEvidenceKeys: evaluation.missingEvidenceKeys,
        dueAt: evaluation.dueAt?.toISOString() ?? null,
      },
    }));
}

/**
 * The monitor schedules deterministic evaluation work and emits minimum-necessary
 * operational events. It does not call a model to determine compliance and it
 * does not send patient data to an external provider. Zumi consumes the resulting
 * authorized signals and next actions after policy enforcement.
 */
export function shouldReevaluateOnDomainEvent(input: {
  plan: AssuranceMonitorPlan;
  eventDomain: GovernedRuleDomain;
  organizationId?: string | null;
}) {
  if (!input.plan.enabled) return false;
  if (input.organizationId && input.organizationId !== input.plan.organizationId) return false;
  if (input.plan.sourceType === "scheduled") return false;
  return input.plan.domains.includes(input.eventDomain);
}
