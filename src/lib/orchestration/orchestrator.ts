import type { ActorContext, BlockerResolution, EngineResult, NextAction, StructuredIntent } from "@/lib/orchestration/contracts";
import { blockersFromPolicy } from "@/lib/orchestration/blocker-engine";
import { evaluateCapabilityPolicy, getCapability } from "@/lib/orchestration/capability-engine";
import type { ExpertEngagementNeed } from "@/lib/orchestration/expert-grid-engine";
import { qualityGuardianBrief, type QualityGuardianSnapshot } from "@/lib/orchestration/quality-guardian-engine";
import {
  qualityExpertGridNextAction,
  qualityExpertNeedFromEvaluation,
} from "@/lib/orchestration/quality-expert-routing-engine";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";
import { composeIntentPathExperience, interpretIntentWithFallback, type ZumiIntentInterpreter } from "@/lib/orchestration/zumi-orchestration-engine";

export type OrchestratedExperience = {
  intent: StructuredIntent;
  path: ReturnType<typeof composeIntentPathExperience> extends EngineResult<infer T> ? T extends { path: infer P } ? P : never : never;
  nextActions: NextAction[];
  blockers: ReturnType<typeof blockersFromPolicy>;
  warnings: string[];
};

export type QualityAssuranceExperience = {
  snapshot: QualityGuardianSnapshot;
  nextActions: NextAction[];
  expertNeeds: ExpertEngagementNeed[];
  internalCapabilityAvailable: boolean;
  blockers: BlockerResolution[];
  warnings: string[];
};

function governNextActions(input: {
  actions: readonly NextAction[];
  context: ActorContext;
  connectedConnectorIds?: readonly string[];
}) {
  const blockers: BlockerResolution[] = [];
  const nextActions = input.actions.map((action) => {
    if (!action.capabilityKey) return action;
    const capability = getCapability(action.capabilityKey);
    if (!capability) return { ...action, state: "blocked" as const, blockers: ["Unknown capability."] };
    const policy = evaluateCapabilityPolicy({
      context: input.context,
      capabilityKey: action.capabilityKey,
      connectedConnectorIds: input.connectedConnectorIds,
    });
    const actionBlockers = blockersFromPolicy(policy);
    blockers.push(...actionBlockers);
    if (policy.state === "blocked" || policy.state === "unavailable") {
      return { ...action, state: "blocked" as const, blockers: actionBlockers.map((blocker) => blocker.explanation) };
    }
    if (policy.state === "review_required") {
      return { ...action, state: "review_required" as const, blockers: actionBlockers.map((blocker) => blocker.explanation) };
    }
    return action;
  });

  return { nextActions, blockers };
}

export async function orchestrateGoal(input: {
  rawIntent: string;
  context: ActorContext;
  interpreter?: ZumiIntentInterpreter | null;
  connectedConnectorIds?: readonly string[];
}): Promise<EngineResult<OrchestratedExperience>> {
  const interpreted = await interpretIntentWithFallback({ raw: input.rawIntent, interpreter: input.interpreter });
  if (!interpreted.ok || !interpreted.value) return { ok: false, errors: interpreted.errors, warnings: interpreted.warnings };

  const composed = composeIntentPathExperience(interpreted.value);
  if (!composed.ok || !composed.value) return { ok: false, errors: composed.errors, warnings: [...interpreted.warnings, ...composed.warnings] };

  const governed = governNextActions({
    actions: composed.value.nextActions,
    context: input.context,
    connectedConnectorIds: input.connectedConnectorIds,
  });

  return {
    ok: true,
    value: {
      intent: interpreted.value,
      path: composed.value.path,
      nextActions: governed.nextActions,
      blockers: governed.blockers,
      warnings: [...interpreted.warnings, ...composed.warnings],
    },
    errors: [],
    warnings: [...interpreted.warnings, ...composed.warnings],
  };
}

function qualityViewDecision(context: ActorContext, connectedConnectorIds?: readonly string[]) {
  return evaluateCapabilityPolicy({
    context,
    capabilityKey: "quality.assurance.view",
    connectedConnectorIds,
  });
}

function expertEscalations(input: {
  evaluations: readonly GovernedRuleEvaluation[];
  jurisdictionKey?: string | null;
  requiredExpertEvidenceKeys?: string[];
  requiredAgreementEvidenceKeys?: string[];
  connectedConnectorIds?: readonly string[];
  context: ActorContext;
  now: Date;
}) {
  const byNeedId = new Map<string, { need: ExpertEngagementNeed; action: NextAction }>();

  for (const evaluation of input.evaluations) {
    const need = qualityExpertNeedFromEvaluation({
      evaluation,
      internalCapabilityAvailable: false,
      jurisdictionKey: input.jurisdictionKey,
      requiredExpertEvidenceKeys: input.requiredExpertEvidenceKeys,
      requiredAgreementEvidenceKeys: input.requiredAgreementEvidenceKeys,
      now: input.now,
    });
    if (!need) continue;
    const action = qualityExpertGridNextAction({ need, evaluation });
    const existing = byNeedId.get(need.id);
    if (!existing || action.priority > existing.action.priority) byNeedId.set(need.id, { need, action });
  }

  const entries = [...byNeedId.values()].sort((a, b) => b.action.priority - a.action.priority);
  const governed = governNextActions({
    actions: entries.map((entry) => entry.action),
    context: input.context,
    connectedConnectorIds: input.connectedConnectorIds,
  });

  return {
    expertNeeds: entries.map((entry) => entry.need),
    nextActions: governed.nextActions,
    blockers: governed.blockers,
  };
}

/**
 * Trusted Zumi quality orchestration consumes already-authorized deterministic
 * evaluations. It fails closed on tenant scope, never lets model output establish
 * quality truth, and creates outside Expert Grid demand only when the organization
 * lacks internal quality capability. Expert demand contains no patient/evidence
 * payload and still requires a separately governed engagement before data access.
 */
export function orchestrateQualityAssurance(input: {
  context: ActorContext;
  evaluations: readonly GovernedRuleEvaluation[];
  internalQualityCapabilityAvailable: boolean;
  jurisdictionKey?: string | null;
  requiredExpertEvidenceKeys?: string[];
  requiredAgreementEvidenceKeys?: string[];
  connectedConnectorIds?: readonly string[];
  now?: Date;
}): EngineResult<QualityAssuranceExperience> {
  const organizationId = input.context.organizationId;
  if (!organizationId) {
    return {
      ok: false,
      errors: ["Quality assurance requires an active organization context."],
      warnings: [],
    };
  }

  const viewPolicy = qualityViewDecision(input.context, input.connectedConnectorIds);
  if (viewPolicy.state !== "allowed") {
    return {
      ok: false,
      errors: ["Quality assurance access is not authorized for the active context."],
      warnings: [],
    };
  }

  const tenantEvaluations = input.evaluations.filter((evaluation) => evaluation.organizationId === organizationId);
  const excludedCount = input.evaluations.length - tenantEvaluations.length;
  const warnings = excludedCount > 0
    ? [`${excludedCount} out-of-scope or unscoped quality evaluation(s) were excluded before orchestration.`]
    : [];
  const now = input.now ?? new Date();
  const brief = qualityGuardianBrief(tenantEvaluations, now);

  if (input.internalQualityCapabilityAvailable) {
    const governed = governNextActions({
      actions: brief.nextActions,
      context: input.context,
      connectedConnectorIds: input.connectedConnectorIds,
    });
    return {
      ok: true,
      value: {
        snapshot: brief.snapshot,
        nextActions: governed.nextActions,
        expertNeeds: [],
        internalCapabilityAvailable: true,
        blockers: governed.blockers,
        warnings,
      },
      errors: [],
      warnings,
    };
  }

  const expert = expertEscalations({
    evaluations: tenantEvaluations,
    jurisdictionKey: input.jurisdictionKey,
    requiredExpertEvidenceKeys: input.requiredExpertEvidenceKeys,
    requiredAgreementEvidenceKeys: input.requiredAgreementEvidenceKeys,
    connectedConnectorIds: input.connectedConnectorIds,
    context: input.context,
    now,
  });

  return {
    ok: true,
    value: {
      snapshot: brief.snapshot,
      nextActions: expert.nextActions,
      expertNeeds: expert.expertNeeds,
      internalCapabilityAvailable: false,
      blockers: expert.blockers,
      warnings,
    },
    errors: [],
    warnings,
  };
}
