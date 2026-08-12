import { resolveIntentDeterministically, validateStructuredIntent } from "@/lib/orchestration/intent-engine";
import { resolvePathRuntime } from "@/lib/orchestration/path-engine";
import { nextActionsFromPath } from "@/lib/orchestration/next-action-engine";
import type { EngineResult, PathRuntime, StructuredIntent } from "@/lib/orchestration/contracts";

export type ZumiIntentInterpreter = (raw: string) => Promise<unknown>;

/**
 * Zumi may interpret language, but the application validates the shape and then
 * resolves Paths and actions from trusted code. A model response never grants a role,
 * permission, eligibility decision, connector state, or financial authorization.
 */
export async function interpretIntentWithFallback(input: {
  raw: string;
  interpreter?: ZumiIntentInterpreter | null;
}): Promise<EngineResult<StructuredIntent>> {
  const fallback = resolveIntentDeterministically(input.raw);
  if (!input.interpreter) return { ok: true, value: fallback, errors: [], warnings: ["Zumi interpreter unavailable; deterministic fallback used."] };

  try {
    const candidate = await input.interpreter(input.raw);
    const validated = validateStructuredIntent(candidate);
    if (!validated.success) {
      return { ok: true, value: fallback, errors: [], warnings: ["Zumi intent response failed schema validation; deterministic fallback used."] };
    }

    const modelIntent = validated.data;
    const trustedPathIds = modelIntent.candidatePathIds.filter((pathId) => resolvePathRuntime({ pathId }) !== null);
    return {
      ok: true,
      value: { ...modelIntent, candidatePathIds: trustedPathIds },
      errors: [],
      warnings: trustedPathIds.length === modelIntent.candidatePathIds.length ? [] : ["Unknown model-suggested Paths were removed."],
    };
  } catch (error) {
    return {
      ok: true,
      value: fallback,
      errors: [],
      warnings: [`Zumi intent interpretation failed; deterministic fallback used: ${error instanceof Error ? error.message : "unknown error"}`],
    };
  }
}

export function composeIntentPathExperience(intent: StructuredIntent): EngineResult<{ intent: StructuredIntent; path: PathRuntime | null; nextActions: ReturnType<typeof nextActionsFromPath> }> {
  const pathId = intent.candidatePathIds[0];
  if (!pathId) return { ok: true, value: { intent, path: null, nextActions: [] }, errors: [], warnings: ["No trusted Path matched this intent."] };
  const path = resolvePathRuntime({ pathId, goal: intent.goal });
  if (!path) return { ok: false, errors: [`Path ${pathId} does not exist.`], warnings: [] };
  return { ok: true, value: { intent, path, nextActions: nextActionsFromPath(path) }, errors: [], warnings: [] };
}
