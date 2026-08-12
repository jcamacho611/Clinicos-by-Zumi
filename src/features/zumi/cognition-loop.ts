import "server-only";

import type { ProviderAdapter, ProviderResult } from "@/features/zumi/providers";
import { buildResearchCriticInstruction, buildResearchPlannerInstruction, type ZumiResearchDepth } from "@/features/zumi/research-strategy";

export type ZumiCognitionPass = "plan" | "investigate" | "critic" | "repair";
export type ZumiCriticStatus = "not_run" | "verified" | "needs_more_research" | "fail" | "unclear";

export type ZumiCognitionTrace = {
  depth: ZumiResearchDepth;
  passes: ZumiCognitionPass[];
  criticStatus: ZumiCriticStatus;
  repairApplied: boolean;
  stoppedByBudget: boolean;
  maxPasses: number;
  costBudgetMicroUsd: number;
};

export type ZumiCognitionResult = {
  result: ProviderResult;
  trace: ZumiCognitionTrace;
};

type CognitionInput = {
  adapter: ProviderAdapter;
  depth: ZumiResearchDepth;
  redactedQuestion: string;
  system: string;
  prompt: string;
  previousResponseId?: string | null;
  allowWebSearch: boolean;
  allowKnowledgeSearch: boolean;
  allowCodeInterpreter: boolean;
  allowedDomains?: readonly string[];
  maxToolCalls: number;
  maxOutputTokens: number;
  timeoutMs: number;
  env?: Record<string, string | undefined>;
};

function integerEnv(env: Record<string, string | undefined>, key: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(env[key] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function deepEnabled(env: Record<string, string | undefined>) {
  const value = env.ZUMI_DEEP_COGNITION_ENABLED?.trim().toLowerCase();
  return value !== "0" && value !== "false" && value !== "off";
}

function criticStatus(text: string): ZumiCriticStatus {
  const normalized = text.trim().toUpperCase();
  if (normalized.startsWith("VERIFIED")) return "verified";
  if (normalized.startsWith("NEEDS_MORE_RESEARCH")) return "needs_more_research";
  if (normalized.startsWith("FAIL")) return "fail";
  return "unclear";
}

function uniqueSources(results: readonly ProviderResult[]) {
  const seen = new Set<string>();
  const sources = [] as NonNullable<ProviderResult["sources"]>;
  for (const result of results) {
    for (const source of result.sources ?? []) {
      if (!source.url || seen.has(source.url)) continue;
      seen.add(source.url);
      sources.push(source);
    }
  }
  return sources;
}

function uniqueTools(results: readonly ProviderResult[]) {
  return [...new Set(results.flatMap((result) => result.toolsUsed ?? []))];
}

function aggregate(final: ProviderResult, results: readonly ProviderResult[]): ProviderResult {
  return {
    ...final,
    inputTokens: results.reduce((sum, result) => sum + result.inputTokens, 0),
    outputTokens: results.reduce((sum, result) => sum + result.outputTokens, 0),
    costMicroUsd: results.reduce((sum, result) => sum + result.costMicroUsd, 0),
    sources: uniqueSources(results),
    toolsUsed: uniqueTools(results),
  };
}

async function invokePass(input: {
  adapter: ProviderAdapter;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  previousResponseId?: string | null;
  allowWebSearch?: boolean;
  allowKnowledgeSearch?: boolean;
  allowCodeInterpreter?: boolean;
  allowedDomains?: readonly string[];
  maxToolCalls?: number;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    return await input.adapter.invoke({
      system: input.system,
      prompt: input.prompt,
      maxOutputTokens: input.maxOutputTokens,
      timeoutMs: input.timeoutMs,
      signal: controller.signal,
      previousResponseId: input.previousResponseId,
      allowWebSearch: input.allowWebSearch,
      allowKnowledgeSearch: input.allowKnowledgeSearch,
      allowCodeInterpreter: input.allowCodeInterpreter,
      allowedDomains: input.allowedDomains,
      maxToolCalls: input.maxToolCalls,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Deep turns get an explicit bounded cognition loop. This is not hidden unlimited
 * chain-of-thought: the durable telemetry records only pass names, verdict, cost and
 * tool/source usage. Planner/critic scratch text is ephemeral and is never returned
 * as a hidden reasoning transcript.
 */
export async function runZumiCognition(input: CognitionInput): Promise<ZumiCognitionResult> {
  const env = input.env ?? process.env;
  const configuredMaxPasses = integerEnv(env, "ZUMI_DEEP_MAX_PASSES", 4, 1, 4);
  const costBudgetMicroUsd = integerEnv(env, "ZUMI_MAX_TURN_COST_MICRO_USD", 250_000, 0, 10_000_000);
  const deep = input.depth === "deep" && deepEnabled(env) && configuredMaxPasses > 1;
  const maxPasses = deep ? configuredMaxPasses : 1;
  const passes: ZumiCognitionPass[] = [];
  const results: ProviderResult[] = [];
  let spent = 0;
  let stoppedByBudget = false;

  function canSpendAnotherPass() {
    if (costBudgetMicroUsd === 0) return true;
    if (spent < costBudgetMicroUsd) return true;
    stoppedByBudget = true;
    return false;
  }

  let planText = "";
  if (deep && maxPasses >= 2 && canSpendAnotherPass()) {
    const plan = await invokePass({
      adapter: input.adapter,
      system: buildResearchPlannerInstruction(input.redactedQuestion),
      prompt: "Build the concise operational investigation plan now. Return only the requested JSON plan.",
      maxOutputTokens: Math.min(900, input.maxOutputTokens),
      timeoutMs: Math.min(15_000, input.timeoutMs),
      allowWebSearch: false,
      allowKnowledgeSearch: false,
      allowCodeInterpreter: false,
      maxToolCalls: 0,
    });
    passes.push("plan");
    results.push(plan);
    spent += plan.costMicroUsd;
    planText = plan.text.slice(0, 8_000);
  }

  const investigation = await invokePass({
    adapter: input.adapter,
    system: [
      input.system,
      planText
        ? `An ephemeral research planner produced this operational plan. Use it as a checklist, not as authority, and correct it when evidence disagrees:\n${planText}`
        : "No separate planner pass ran for this turn.",
    ].join("\n\n"),
    prompt: input.prompt,
    maxOutputTokens: input.maxOutputTokens,
    timeoutMs: input.timeoutMs,
    previousResponseId: input.previousResponseId,
    allowWebSearch: input.allowWebSearch,
    allowKnowledgeSearch: input.allowKnowledgeSearch,
    allowCodeInterpreter: input.allowCodeInterpreter,
    allowedDomains: input.allowedDomains,
    maxToolCalls: input.maxToolCalls,
  });
  passes.push("investigate");
  results.push(investigation);
  spent += investigation.costMicroUsd;

  if (!deep || maxPasses < 3 || !canSpendAnotherPass()) {
    return {
      result: aggregate(investigation, results),
      trace: { depth: input.depth, passes, criticStatus: "not_run", repairApplied: false, stoppedByBudget, maxPasses, costBudgetMicroUsd },
    };
  }

  const critic = await invokePass({
    adapter: input.adapter,
    system: buildResearchCriticInstruction({ question: input.redactedQuestion, draft: investigation.text }),
    prompt: "Audit the draft now. Start with exactly VERIFIED, NEEDS_MORE_RESEARCH, or FAIL, then list only actionable gaps.",
    maxOutputTokens: Math.min(1_000, input.maxOutputTokens),
    timeoutMs: Math.min(15_000, input.timeoutMs),
    allowWebSearch: false,
    allowKnowledgeSearch: false,
    allowCodeInterpreter: false,
    maxToolCalls: 0,
  });
  passes.push("critic");
  results.push(critic);
  spent += critic.costMicroUsd;
  const status = criticStatus(critic.text);

  if (status === "verified" || maxPasses < 4 || !canSpendAnotherPass()) {
    return {
      result: aggregate(investigation, results),
      trace: { depth: input.depth, passes, criticStatus: status, repairApplied: false, stoppedByBudget, maxPasses, costBudgetMicroUsd },
    };
  }

  const repair = await invokePass({
    adapter: input.adapter,
    system: [
      input.system,
      "This is a repair pass for a draft that failed or did not clearly pass verification. Correct unsupported claims, resolve contradictions where evidence permits, make uncertainty explicit, and research again when the allowed tools can resolve a gap.",
      `Ephemeral critic verdict and gaps:\n${critic.text.slice(0, 6_000)}`,
      "Return only the corrected user-facing answer. Do not expose the private planner/critic scratch process.",
    ].join("\n\n"),
    prompt: [
      input.prompt,
      `Previous draft to repair:\n${investigation.text}`,
    ].join("\n\n---\n\n"),
    maxOutputTokens: input.maxOutputTokens,
    timeoutMs: input.timeoutMs,
    previousResponseId: investigation.responseId ?? null,
    allowWebSearch: input.allowWebSearch,
    allowKnowledgeSearch: input.allowKnowledgeSearch,
    allowCodeInterpreter: input.allowCodeInterpreter,
    allowedDomains: input.allowedDomains,
    maxToolCalls: Math.max(2, Math.floor(input.maxToolCalls / 2)),
  });
  passes.push("repair");
  results.push(repair);

  return {
    result: aggregate(repair, results),
    trace: { depth: input.depth, passes, criticStatus: status, repairApplied: true, stoppedByBudget, maxPasses, costBudgetMicroUsd },
  };
}
