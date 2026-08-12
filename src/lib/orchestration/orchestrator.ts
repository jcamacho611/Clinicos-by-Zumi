import type { ActorContext, EngineResult, NextAction, StructuredIntent } from "@/lib/orchestration/contracts";
import { blockersFromPolicy } from "@/lib/orchestration/blocker-engine";
import { evaluateCapabilityPolicy, getCapability } from "@/lib/orchestration/capability-engine";
import { composeIntentPathExperience, interpretIntentWithFallback, type ZumiIntentInterpreter } from "@/lib/orchestration/zumi-orchestration-engine";

export type OrchestratedExperience = {
  intent: StructuredIntent;
  path: ReturnType<typeof composeIntentPathExperience> extends EngineResult<infer T> ? T extends { path: infer P } ? P : never : never;
  nextActions: NextAction[];
  blockers: ReturnType<typeof blockersFromPolicy>;
  warnings: string[];
};

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

  const blockers: ReturnType<typeof blockersFromPolicy> = [];
  const nextActions = composed.value.nextActions.map((action) => {
    if (!action.capabilityKey) return action;
    const capability = getCapability(action.capabilityKey);
    if (!capability) return { ...action, state: "blocked" as const, blockers: ["Unknown capability."] };
    const policy = evaluateCapabilityPolicy({ context: input.context, capabilityKey: action.capabilityKey, connectedConnectorIds: input.connectedConnectorIds });
    const actionBlockers = blockersFromPolicy(policy);
    blockers.push(...actionBlockers);
    if (policy.state === "blocked" || policy.state === "unavailable") return { ...action, state: "blocked" as const, blockers: actionBlockers.map((blocker) => blocker.explanation) };
    if (policy.state === "review_required") return { ...action, state: "review_required" as const, blockers: actionBlockers.map((blocker) => blocker.explanation) };
    return action;
  });

  return {
    ok: true,
    value: {
      intent: interpreted.value,
      path: composed.value.path,
      nextActions,
      blockers,
      warnings: [...interpreted.warnings, ...composed.warnings],
    },
    errors: [],
    warnings: [...interpreted.warnings, ...composed.warnings],
  };
}
