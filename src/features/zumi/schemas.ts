import { z } from "zod";
import type { ClinicAction, ClinicResource } from "@/lib/auth/rbac";

/**
 * Zumi governed output contract.
 *
 * Every meaningful Zumi recommendation carries SOURCE, REASON, STATUS, OWNER,
 * REQUIRED REVIEW, ACTION and an AUDIT reference. That is not decoration: a
 * recommendation a clinic cannot trace back to its evidence is one they cannot act
 * on, and one nobody can be held to.
 *
 * Pure module. No database, no network, no provider SDK.
 */

/** Where a fact came from. Applies to any displayed fact, not only AI output. */
export const provenanceSources = ["USER", "IMPORT", "INTEGRATION", "SYSTEM", "ZUMI", "WORKFLOW", "GRID", "PAYMENT_PROVIDER"] as const;
export type ProvenanceSource = (typeof provenanceSources)[number];

/** Operating signal vocabulary, shared across every surface that raises work. */
export const signalTypes = ["OVERDUE", "UNASSIGNED", "MISSING", "WAITING", "ANOMALY", "OPPORTUNITY", "REVIEW_REQUIRED", "EXPIRING"] as const;
export type SignalType = (typeof signalTypes)[number];

export const signalSeverities = ["INFO", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type SignalSeverity = (typeof signalSeverities)[number];

export const zumiOrbStates = ["dormant", "observing", "mapping", "analyzing", "signal", "resolved"] as const;
export type ZumiOrbState = (typeof zumiOrbStates)[number];

export const riskTiers = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskTier = (typeof riskTiers)[number];

export type ZumiPermissionRequirement = { resource: ClinicResource; action: ClinicAction };

export type ZumiCapability = {
  key: string;
  label: string;
  tier: RiskTier;
  produces: string;
  requiresEntitlement: string | null;
  requiresPermission: ZumiPermissionRequirement | null;
};

export const ZUMI_BASELINE_PERMISSION: ZumiPermissionRequirement = { resource: "ai", action: "read" };

/**
 * A declared capability is a conversation/action envelope, not a data grant. Server
 * RBAC, tenant policy, tool policy, and domain rules remain authoritative beneath it.
 */
export const zumiCapabilities: readonly ZumiCapability[] = [
  { key: "conversation", label: "General conversation", tier: "LOW", produces: "A natural, context-aware answer within the user's allowed conversation/data boundary", requiresEntitlement: null, requiresPermission: null },
  { key: "public_research", label: "Research public information", tier: "LOW", produces: "A current source-backed answer using public evidence when a research-capable provider is configured", requiresEntitlement: null, requiresPermission: null },
  { key: "operational_summary", label: "Summarize operational state", tier: "LOW", produces: "A narrative summary of open work", requiresEntitlement: null, requiresPermission: null },
  { key: "morning_briefing", label: "Morning briefing", tier: "LOW", produces: "A source-backed briefing for the day", requiresEntitlement: null, requiresPermission: null },
  { key: "shift_handoff", label: "Shift handoff", tier: "LOW", produces: "A handoff summary of outstanding work", requiresEntitlement: null, requiresPermission: null },
  { key: "what_changed", label: "What changed since yesterday", tier: "LOW", produces: "A diff of operational state", requiresEntitlement: null, requiresPermission: null },
  { key: "operational_search", label: "Operational search", tier: "LOW", produces: "Ranked records matching a natural-language query", requiresEntitlement: null, requiresPermission: null },
  { key: "explain_signal", label: "Explain why this was flagged", tier: "LOW", produces: "The evidence chain behind a signal", requiresEntitlement: null, requiresPermission: null },
  { key: "queue_prioritization", label: "Prioritize a queue", tier: "LOW", produces: "An ordered queue with stated reasons", requiresEntitlement: null, requiresPermission: null },
  { key: "intake_summary", label: "Summarize intake", tier: "LOW", produces: "A summary of submitted intake answers", requiresEntitlement: null, requiresPermission: { resource: "forms", action: "read" } },
  { key: "edu_guided_practice", label: "Guide workforce practice", tier: "LOW", produces: "A bounded learning explanation, prompt-coaching step, or practice hint that preserves learner responsibility and instructor authority", requiresEntitlement: null, requiresPermission: null },
  { key: "edu_output_critique", label: "Coach AI-output critique", tier: "LOW", produces: "A learning-focused critique that helps a participant identify unsupported, unsafe, biased, private, or otherwise inappropriate AI output without deciding workplace action for them", requiresEntitlement: null, requiresPermission: null },
  { key: "edu_instructor_assist", label: "Assist an EDU instructor", tier: "MEDIUM", produces: "A draft instructor summary, misconception pattern, feedback suggestion, or lesson-support note held for human instructor review", requiresEntitlement: null, requiresPermission: null },
  { key: "document_extraction", label: "Extract document metadata", tier: "MEDIUM", produces: "Draft metadata for human confirmation", requiresEntitlement: null, requiresPermission: { resource: "documents", action: "update" } },
  { key: "suggest_task", label: "Suggest a task", tier: "MEDIUM", produces: "A draft task marked Suggested by Zumi", requiresEntitlement: null, requiresPermission: { resource: "tasks", action: "create" } },
  { key: "suggest_followup", label: "Suggest a follow-up", tier: "MEDIUM", produces: "A draft follow-up marked Suggested by Zumi", requiresEntitlement: null, requiresPermission: { resource: "tasks", action: "create" } },
  { key: "revenue_opportunity", label: "Identify revenue opportunity", tier: "MEDIUM", produces: "An estimated opportunity with evidence", requiresEntitlement: "revenue_recovery", requiresPermission: null },
  { key: "billing_readiness_explanation", label: "Explain billing readiness", tier: "MEDIUM", produces: "What is missing before an encounter can bill", requiresEntitlement: "billing_readiness", requiresPermission: null },
  { key: "grid_match_explanation", label: "Explain a GRID match", tier: "MEDIUM", produces: "Why a provider or location matched", requiresEntitlement: "grid", requiresPermission: null },
  { key: "owner_brief", label: "Owner brief", tier: "MEDIUM", produces: "A source-backed periodic owner report", requiresEntitlement: "advanced_reports", requiresPermission: null },
  { key: "propose_credential_decision", label: "Propose a credential decision", tier: "HIGH", produces: "A draft recommendation for a human credential reviewer", requiresEntitlement: "grid", requiresPermission: { resource: "grid", action: "manage" } },
  { key: "propose_record_release", label: "Propose a record release", tier: "HIGH", produces: "A draft release package for human approval", requiresEntitlement: null, requiresPermission: { resource: "documents", action: "manage" } },
  { key: "propose_claim_action", label: "Propose a claim action", tier: "HIGH", produces: "A draft claim action for human authorization", requiresEntitlement: "billing_readiness", requiresPermission: { resource: "billing", action: "update" } },
];

export function getZumiCapability(key: string) {
  return zumiCapabilities.find((capability) => capability.key === key);
}

export const ZUMI_PROHIBITED = [
  "diagnose",
  "prescribe",
  "interpret_result_as_final",
  "decide_treatment",
  "guarantee_coverage",
  "release_records_autonomously",
  "submit_claim_autonomously",
  "approve_credential_autonomously",
  "authorize_care",
] as const;

export function isProhibitedZumiCapability(key: string) {
  return (ZUMI_PROHIBITED as readonly string[]).includes(key);
}

export const zumiEvidenceSchema = z.object({
  source: z.enum(provenanceSources),
  entityType: z.string().trim().min(1).max(80),
  entityId: z.string().trim().min(1).max(64).nullable(),
  fact: z.string().trim().min(3).max(400),
  observedAt: z.string().datetime({ offset: true }).nullable().default(null),
});

export type ZumiEvidence = z.infer<typeof zumiEvidenceSchema>;

export const zumiRecommendationSchema = z.object({
  capability: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(3).max(600),
  signalType: z.enum(signalTypes).nullable().default(null),
  severity: z.enum(signalSeverities).default("INFO"),
  reason: z.string().trim().min(3).max(800),
  evidence: z.array(zumiEvidenceSchema).min(1).max(50),
  suggestedAction: z.string().trim().min(3).max(400).nullable().default(null),
  ownerUserId: z.string().trim().max(64).nullable().default(null),
  requiresHumanReview: z.boolean(),
  confidence: z.object({
    level: z.enum(["low", "moderate", "high"]),
    basis: z.string().trim().min(3).max(300),
  }).nullable().default(null),
});

export type ZumiRecommendation = z.infer<typeof zumiRecommendationSchema>;

export const zumiResponseSchema = z.object({
  capability: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  answer: z.string(),
  recommendations: z.array(zumiRecommendationSchema).default([]),
  orbState: z.enum(zumiOrbStates),
  promptVersion: z.string(),
  generatedAt: z.string(),
  usage: z.object({ inputTokens: z.number().int().min(0), outputTokens: z.number().int().min(0), costMicroUsd: z.number().int().min(0) }),
  auditLogId: z.string().nullable(),
});

export type ZumiResponse = z.infer<typeof zumiResponseSchema>;

export function validateRecommendation(recommendation: ZumiRecommendation): string[] {
  const problems: string[] = [];
  const capability = getZumiCapability(recommendation.capability);

  if (!capability) {
    problems.push(`Unknown capability "${recommendation.capability}".`);
    return problems;
  }
  if (!recommendation.evidence.length) problems.push("A recommendation must cite at least one piece of evidence.");
  if (capability.tier === "HIGH" && !recommendation.requiresHumanReview) problems.push("A HIGH-risk capability must require human review.");
  if (capability.tier === "MEDIUM" && !recommendation.requiresHumanReview) problems.push("A MEDIUM-risk capability produces a suggestion and must require human review.");
  if (recommendation.severity === "URGENT" && !recommendation.suggestedAction) problems.push("An urgent signal must state a suggested next action.");
  return problems;
}

export function orbStateForStage(stage: "idle" | "gathering" | "correlating" | "reasoning" | "flagged" | "closed"): ZumiOrbState {
  switch (stage) {
    case "gathering": return "observing";
    case "correlating": return "mapping";
    case "reasoning": return "analyzing";
    case "flagged": return "signal";
    case "closed": return "resolved";
    default: return "dormant";
  }
}
