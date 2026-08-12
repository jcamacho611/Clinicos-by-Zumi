import "server-only";

import type { ProviderAdapter, ProviderResult, ZumiExternalSource, ZumiMcpServer } from "@/features/zumi/providers";
import {
  buildResearchCriticInstruction,
  buildResearchPlannerInstruction,
  buildStrategyReflectionInstruction,
  estimateResearchComplexity,
  zumiResearchPlanSchema,
  zumiStrategyCapsuleSchema,
  type ZumiResearchDepth,
  type ZumiStrategyCapsule,
} from "@/features/zumi/research-strategy";

export type ZumiAgentBudget = {
  maxCalls: number;
  maxCostMicroUsd: number;
  maxOutputTokensPerCall: number;
};

export type ZumiAgentRequest = {
  adapter: ProviderAdapter;
  system: string;
  question: string;
  previousResponseId?: string | null;
  depth?: ZumiResearchDepth | "auto";
  allowWebSearch: boolean;
  allowKnowledgeSearch: boolean;
  allowCodeInterpreter: boolean;
  allowedDomains?: readonly string[];
  mcpServers?: readonly ZumiMcpServer[];
  timeoutMs: number;
  budget: ZumiAgentBudget;
  learnStrategy?: boolean;
};

export type ZumiAgentResult = ProviderResult & {
  depth: ZumiResearchDepth;
  calls: number;
  verification: "not_run" | "verified" | "needs_more_research" | "failed";
  strategy?: ZumiStrategyCapsule | null;
};

function mergeSources(...groups: Array<readonly ZumiExternalSource[] | undefined>) {
  const byUrl = new Map<string, ZumiExternalSource>();
  for (const group of groups) for (const source of group ?? []) byUrl.set(source.url, source);
  return [...byUrl.values()];
}

function mergeTools(...groups: Array<readonly string[] | undefined>) {
  return [...new Set(groups.flatMap((group) => group ?? []))];
}

function cleanJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function verificationStatus(text: string): ZumiAgentResult["verification"] {
  const head = text.trim().slice(0, 120).toUpperCase();
  if (head.includes("VERIFIED")) return "verified";
  if (head.includes("NEEDS_MORE_RESEARCH")) return "needs_more_research";
  if (head.includes("FAIL")) return "failed";
  return "failed";
}

export async function runZumiAgent(request: ZumiAgentRequest): Promise<ZumiAgentResult> {
  const complexity = estimateResearchComplexity(request.question);
  const depth = request.depth === undefined || request.depth === "auto" ? complexity.depth : request.depth;
  let calls = 0;
  let costMicroUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let responseId = request.previousResponseId ?? null;
  let sources: ZumiExternalSource[] = [];
  let toolsUsed: string[] = [];

  const invoke = async (prompt: string, options?: { web?: boolean; knowledge?: boolean; compute?: boolean }): Promise<ProviderResult> => {
    if (calls >= request.budget.maxCalls) throw new Error("zumi_agent_call_budget_exhausted");
    const result = await request.adapter.invoke({
      system: request.system,
      prompt,
      maxOutputTokens: request.budget.maxOutputTokensPerCall,
      timeoutMs: request.timeoutMs,
      previousResponseId: responseId,
      allowWebSearch: options?.web ?? request.allowWebSearch,
      allowKnowledgeSearch: options?.knowledge ?? request.allowKnowledgeSearch,
      allowCodeInterpreter: options?.compute ?? request.allowCodeInterpreter,
      allowedDomains: request.allowedDomains,
      mcpServers: request.mcpServers,
    });
    calls += 1;
    costMicroUsd += result.costMicroUsd;
    inputTokens += result.inputTokens;
    outputTokens += result.outputTokens;
    responseId = result.responseId ?? responseId;
    sources = mergeSources(sources, result.sources);
    toolsUsed = mergeTools(toolsUsed, result.toolsUsed);
    if (costMicroUsd > request.budget.maxCostMicroUsd) throw new Error("zumi_agent_cost_budget_exhausted");
    return result;
  };

  if (depth === "direct") {
    const answer = await invoke(request.question, { web: false, knowledge: request.allowKnowledgeSearch, compute: request.allowCodeInterpreter });
    return {
      ...answer,
      inputTokens,
      outputTokens,
      costMicroUsd,
      responseId,
      sources,
      toolsUsed,
      depth,
      calls,
      verification: "not_run",
    };
  }

  if (depth === "research") {
    const prompt = [
      "Answer the user after actively using the tools needed to verify current or uncertain claims.",
      "Use retained knowledge when it is fresh, live web research when current/external evidence is needed, and computation when calculations or structured analysis improve accuracy.",
      "Cross-check consequential claims before concluding. Cite public sources in the answer when web research is used.",
      `User question: ${request.question}`,
    ].join("\n\n");
    const answer = await invoke(prompt);
    return {
      ...answer,
      inputTokens,
      outputTokens,
      costMicroUsd,
      responseId,
      sources,
      toolsUsed,
      depth,
      calls,
      verification: "not_run",
    };
  }

  const planner = await invoke(buildResearchPlannerInstruction(request.question), {
    web: false,
    knowledge: request.allowKnowledgeSearch,
    compute: false,
  });
  let planText = planner.text;
  try {
    const plan = zumiResearchPlanSchema.parse(JSON.parse(cleanJson(planner.text)));
    planText = JSON.stringify(plan);
  } catch {
    planText = planner.text.slice(0, 10_000);
  }

  const investigation = await invoke([
    "Execute this research plan. You may adapt it as evidence changes.",
    "Search broadly enough to resolve the unknowns, but prefer primary/authoritative sources for current, technical, regulatory, legal, medical, financial, or high-stakes claims.",
    "Use computation when it can check arithmetic, compare alternatives, transform data, or test a claim.",
    "Do not expose hidden chain-of-thought. Produce a well-supported draft answer plus explicit remaining uncertainties.",
    `Original question: ${request.question}`,
    `Research plan: ${planText}`,
  ].join("\n\n"));

  const critic = await invoke(buildResearchCriticInstruction({ question: request.question, draft: investigation.text }), {
    web: request.allowWebSearch,
    knowledge: request.allowKnowledgeSearch,
    compute: request.allowCodeInterpreter,
  });
  const verification = verificationStatus(critic.text);

  const synthesis = await invoke([
    "Produce the final answer to the original user question.",
    "Repair every actionable problem identified by the verification critic. If evidence remains insufficient, say exactly what remains uncertain instead of guessing.",
    "Use the available tools again if needed for a final fact check or calculation.",
    "Do not mention internal planner/critic stages. Do not expose hidden chain-of-thought.",
    `Original question: ${request.question}`,
    `Draft: ${investigation.text}`,
    `Verification report: ${critic.text}`,
  ].join("\n\n"));

  let strategy: ZumiStrategyCapsule | null = null;
  if (request.learnStrategy && calls < request.budget.maxCalls && costMicroUsd < request.budget.maxCostMicroUsd) {
    try {
      const domains = sources.map((source) => {
        try { return new URL(source.url).hostname; } catch { return ""; }
      }).filter(Boolean);
      const reflection = await invoke(buildStrategyReflectionInstruction({
        question: request.question,
        toolsUsed,
        sourceDomains: domains,
        verificationOutcome: verification,
      }), { web: false, knowledge: false, compute: false });
      strategy = zumiStrategyCapsuleSchema.parse(JSON.parse(cleanJson(reflection.text)));
    } catch {
      strategy = null;
    }
  }

  return {
    ...synthesis,
    inputTokens,
    outputTokens,
    costMicroUsd,
    responseId,
    sources,
    toolsUsed,
    depth,
    calls,
    verification,
    strategy,
  };
}
