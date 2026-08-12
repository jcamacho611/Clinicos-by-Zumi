import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { admitZumiRequest, type ZumiAdmissionDenial } from "@/features/zumi/policy";
import { containsLikelyIdentifiers, redactPayload, redactText } from "@/features/zumi/redaction";
import {
  orbStateForStage,
  validateRecommendation,
  zumiRecommendationSchema,
  type ZumiRecommendation,
  type ZumiResponse,
} from "@/features/zumi/schemas";
import { phiEgressPermitted, selectProvider, type ZumiExternalSource, type ZumiMcpServer } from "@/features/zumi/providers";
import { runZumiAgent } from "@/features/zumi/agent-orchestrator";
import type { ZumiResearchDepth } from "@/features/zumi/research-strategy";
import { persistZumiStrategy } from "@/features/zumi/strategy-store";
import { assessEvidenceQuality, type EvidenceQuality } from "@/features/zumi/source-authority";

const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1_600;
const DEFAULT_AGENT_MAX_CALLS = 6;
const DEFAULT_AGENT_MAX_COST_MICRO_USD = 1_000_000;

export const ZUMI_PROMPT_VERSION = "zumi-intelligence-2026-08-12.2";

const SYSTEM_INSTRUCTION = [
  "You are Zumi, Klinikos Intelligence inside the Klinikos healthcare operating ecosystem.",
  "Klinikos is the master product and brand. Zumi is its governed intelligence subsystem.",
  "You are tool-using and evidence-seeking: determine what you need, retrieve known material, research public sources when permitted, calculate when useful, and verify consequential claims.",
  "You do not need to memorize encyclopedic subject matter. Use the live world and approved tools as an external library, then retain reusable strategies rather than giant textbook copies.",
  "You never diagnose, prescribe, decide treatment, interpret a clinical result as final, guarantee coverage, approve credentials, or bypass human authorization.",
  "Operational claims must be grounded in supplied records. Public research claims must be grounded in cited public sources.",
  "When evidence is insufficient, stale, contradictory, or outside tool access, say so instead of inventing certainty.",
  "Suggestions are proposals for a person to confirm when the domain requires human review.",
].join(" ");

export type ZumiRequest = {
  session: ClinicSession;
  capability: string;
  organizationId: string;
  entitlements: readonly string[];
  question: string;
  context?: unknown;
  timeoutMs?: number;
  maxOutputTokens?: number;
  previousResponseId?: string | null;
  allowWebResearch?: boolean;
  allowKnowledgeSearch?: boolean;
  allowComputation?: boolean;
  allowedDomains?: readonly string[];
  mcpServers?: readonly ZumiMcpServer[];
  agentDepth?: ZumiResearchDepth | "auto";
  learnStrategy?: boolean;
  maxAgentCalls?: number;
  maxAgentCostMicroUsd?: number;
};

export type ZumiFailure = ZumiAdmissionDenial & { invocationId: string | null };
export type ZumiSuccess = {
  allowed: true;
  response: ZumiResponse;
  continuation?: {
    responseId: string;
    sources: ZumiExternalSource[];
    toolsUsed: string[];
    depth: ZumiResearchDepth;
    calls: number;
    verification: "not_run" | "verified" | "needs_more_research" | "failed";
    evidenceQuality: EvidenceQuality;
    strategyLearned: boolean;
  } | null;
};
export type ZumiGatewayResult = ZumiSuccess | ZumiFailure;

type InvocationRecord = {
  organizationId: string;
  userId: string | null;
  capability: string;
  tier: string;
  outcome: "admitted" | "denied" | "error";
  reason?: string | null;
  providerKey?: string | null;
  modelId?: string | null;
  promptVersion?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  costMicroUsd?: number;
  durationMs?: number;
  humanReviewRequired?: boolean;
  redactionApplied?: boolean;
  droppedKeys?: string[];
  auditLogId?: string | null;
};

function envInt(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function recordInvocation(record: InvocationRecord): Promise<string | null> {
  try {
    const row = await db.zumiInvocation.create({ data: record });
    return row.id;
  } catch (error) {
    console.error("[zumi] failed to write invocation record", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

async function writeAuditLog(input: {
  organizationId: string;
  userId: string | null;
  capability: string;
  outcome: string;
  reason?: string | null;
  providerKey?: string | null;
  humanReviewRequired: boolean;
  webResearch?: boolean;
  sourceCount?: number;
  toolsUsed?: readonly string[];
  depth?: string;
  calls?: number;
  verification?: string;
  evidenceScore?: number;
}): Promise<string | null> {
  try {
    const row = await db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.userId,
        actorType: "user",
        action: `zumi.${input.outcome}`,
        resourceType: "ai",
        resourceId: input.capability,
        metadata: {
          capability: input.capability,
          reason: input.reason ?? null,
          provider: input.providerKey ?? null,
          humanReviewRequired: input.humanReviewRequired,
          promptVersion: ZUMI_PROMPT_VERSION,
          webResearch: input.webResearch ?? false,
          sourceCount: input.sourceCount ?? 0,
          toolsUsed: input.toolsUsed ?? [],
          depth: input.depth ?? null,
          calls: input.calls ?? 0,
          verification: input.verification ?? null,
          evidenceScore: input.evidenceScore ?? null,
        },
      },
    });
    return row.id;
  } catch (error) {
    console.error("[zumi] failed to write audit log", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

function buildPrompt(request: ZumiRequest): {
  prompt: string;
  redactionApplied: boolean;
  droppedKeys: string[];
  questionRedacted: boolean;
} | null {
  const question = redactText(request.question);
  const context = request.context === undefined ? null : redactPayload(request.context);
  const serializedContext = context ? JSON.stringify(context.value) : "";
  const prompt = [
    `Capability: ${request.capability}`,
    `Question: ${question.text}`,
    serializedContext ? `Operational context (JSON): ${serializedContext}` : "Operational context: none supplied.",
  ].join("\n\n");
  if (containsLikelyIdentifiers(prompt)) return null;
  return {
    prompt,
    redactionApplied: question.redactedAny || Boolean(context?.redactedAny),
    droppedKeys: context?.droppedKeys ?? [],
    questionRedacted: question.redactedAny,
  };
}

export function parseRecommendations(raw: string): { recommendations: ZumiRecommendation[]; rejected: number } {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { recommendations: [], rejected: 0 }; }
  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { recommendations?: unknown })?.recommendations)
      ? (parsed as { recommendations: unknown[] }).recommendations
      : [];
  const recommendations: ZumiRecommendation[] = [];
  let rejected = 0;
  for (const candidate of candidates) {
    const result = zumiRecommendationSchema.safeParse(candidate);
    if (!result.success || validateRecommendation(result.data).length > 0) { rejected += 1; continue; }
    recommendations.push(result.data);
  }
  return { recommendations, rejected };
}

export async function invokeZumi(request: ZumiRequest): Promise<ZumiGatewayResult> {
  const startedAt = Date.now();
  const selection = selectProvider();
  const decision = admitZumiRequest({
    capability: request.capability,
    role: request.session.role,
    sessionOrganizationId: request.session.organizationId,
    requestedOrganizationId: request.organizationId,
    entitlements: request.entitlements,
    providerAvailable: selection.ok,
    providerDetail: selection.ok ? undefined : selection.detail,
  });

  if (!decision.allowed) {
    const auditLogId = await writeAuditLog({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, outcome: "denied", reason: decision.reason, humanReviewRequired: true });
    const invocationId = await recordInvocation({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, tier: "UNKNOWN", outcome: "denied", reason: decision.reason, durationMs: Date.now() - startedAt, auditLogId });
    return { ...decision, invocationId };
  }
  if (!selection.ok) throw new Error("Zumi admitted a request with no usable provider. This is a policy bug.");

  const built = buildPrompt(request);
  if (!built) {
    const auditLogId = await writeAuditLog({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, outcome: "denied", reason: "redaction_incomplete", providerKey: selection.adapter.key, humanReviewRequired: true });
    await recordInvocation({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, tier: decision.tier, outcome: "denied", reason: "redaction_incomplete", providerKey: selection.adapter.key, redactionApplied: true, durationMs: Date.now() - startedAt, auditLogId });
    const phi = phiEgressPermitted(selection.adapter);
    return { allowed: false, reason: "prohibited", status: 403, message: `This request still contains identifier-shaped content after redaction, so Zumi did not send it. ${phi.notice}`, invocationId: null };
  }

  if (request.allowWebResearch && (request.context !== undefined || built.questionRedacted)) {
    const auditLogId = await writeAuditLog({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, outcome: "denied", reason: "web_research_requires_public_non_phi_input", providerKey: selection.adapter.key, humanReviewRequired: true, webResearch: true });
    const invocationId = await recordInvocation({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, tier: decision.tier, outcome: "denied", reason: "web_research_requires_public_non_phi_input", providerKey: selection.adapter.key, durationMs: Date.now() - startedAt, auditLogId });
    return { allowed: false, reason: "prohibited", status: 403, message: "Public-web research is isolated from clinic context and identifier-shaped content. Ask the public research question without PHI or operational context.", invocationId };
  }

  try {
    const result = await runZumiAgent({
      adapter: selection.adapter,
      system: SYSTEM_INSTRUCTION,
      question: built.prompt,
      previousResponseId: request.previousResponseId,
      depth: request.agentDepth ?? "auto",
      allowWebSearch: Boolean(request.allowWebResearch),
      allowKnowledgeSearch: request.allowKnowledgeSearch !== false,
      allowCodeInterpreter: request.allowComputation !== false,
      allowedDomains: request.allowedDomains,
      mcpServers: request.mcpServers,
      timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      budget: {
        maxCalls: Math.max(1, Math.min(request.maxAgentCalls ?? envInt("ZUMI_AGENT_MAX_CALLS", DEFAULT_AGENT_MAX_CALLS), 12)),
        maxCostMicroUsd: Math.max(1, request.maxAgentCostMicroUsd ?? envInt("ZUMI_AGENT_MAX_COST_MICRO_USD", DEFAULT_AGENT_MAX_COST_MICRO_USD)),
        maxOutputTokensPerCall: Math.max(400, Math.min(request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS, 6_000)),
      },
      learnStrategy: request.learnStrategy !== false && request.context === undefined,
    });

    const { recommendations } = parseRecommendations(result.text);
    const durationMs = Date.now() - startedAt;
    const sources = result.sources ?? [];
    const evidenceQuality = assessEvidenceQuality(sources.map((source) => source.url));
    let strategyLearned = false;
    if (result.strategy && result.strategy.observedQuality !== "weak") {
      try { strategyLearned = (await persistZumiStrategy(result.strategy)).persisted; } catch { strategyLearned = false; }
    }

    const auditLogId = await writeAuditLog({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      outcome: "admitted",
      providerKey: selection.adapter.key,
      humanReviewRequired: decision.requiresHumanReview,
      webResearch: request.allowWebResearch,
      sourceCount: sources.length,
      toolsUsed: result.toolsUsed,
      depth: result.depth,
      calls: result.calls,
      verification: result.verification,
      evidenceScore: evidenceQuality.score,
    });

    await recordInvocation({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      tier: decision.tier,
      outcome: "admitted",
      providerKey: selection.adapter.key,
      modelId: result.modelId,
      promptVersion: ZUMI_PROMPT_VERSION,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costMicroUsd: result.costMicroUsd,
      durationMs,
      humanReviewRequired: decision.requiresHumanReview,
      redactionApplied: built.redactionApplied,
      droppedKeys: built.droppedKeys,
      auditLogId,
    });

    return {
      allowed: true,
      response: {
        capability: request.capability,
        organizationId: request.session.organizationId,
        userId: request.session.userId,
        answer: redactText(result.text).text,
        recommendations,
        orbState: orbStateForStage(recommendations.length > 0 ? "flagged" : "closed"),
        promptVersion: ZUMI_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costMicroUsd: result.costMicroUsd },
        auditLogId,
      },
      continuation: result.responseId ? {
        responseId: result.responseId,
        sources,
        toolsUsed: result.toolsUsed ?? [],
        depth: result.depth,
        calls: result.calls,
        verification: result.verification,
        evidenceQuality,
        strategyLearned,
      } : null,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "provider_error";
    const budgetFailure = reason === "zumi_agent_call_budget_exhausted" || reason === "zumi_agent_cost_budget_exhausted";
    const auditLogId = await writeAuditLog({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, outcome: "error", reason: budgetFailure ? reason : "provider_error", providerKey: selection.adapter.key, humanReviewRequired: true, webResearch: request.allowWebResearch });
    const invocationId = await recordInvocation({ organizationId: request.session.organizationId, userId: request.session.userId, capability: request.capability, tier: decision.tier, outcome: "error", reason: budgetFailure ? reason : "provider_error", providerKey: selection.adapter.key, durationMs: Date.now() - startedAt, auditLogId });
    return {
      allowed: false,
      reason: "provider_unavailable",
      status: budgetFailure ? 429 : 503,
      message: budgetFailure
        ? "Zumi reached the configured intelligence budget before it could safely finish. No additional tool calls were made."
        : "Zumi could not complete the intelligence request. Nothing was changed and no suggestion was produced.",
      invocationId,
    };
  }
}
