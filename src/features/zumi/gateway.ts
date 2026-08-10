import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { admitZumiRequest, type ZumiAdmissionDenial } from "@/features/zumi/policy";
import {
  containsLikelyIdentifiers,
  redactPayload,
  redactText,
} from "@/features/zumi/redaction";
import {
  orbStateForStage,
  validateRecommendation,
  zumiRecommendationSchema,
  type ZumiRecommendation,
  type ZumiResponse,
} from "@/features/zumi/schemas";
import { phiEgressPermitted, selectProvider, type ProviderAdapter } from "@/features/zumi/providers";

/**
 * The Zumi AI Gateway.
 *
 * Every AI call in Klinikos enters here and nowhere else. The gateway owns the parts
 * that are easy to forget and expensive to forget: tenant scoping, permission and
 * entitlement checks, redaction before egress, a timeout, output validation against
 * the governed contract, and a metering + audit record written on every path
 * including refusal.
 *
 * The invariant worth stating plainly: this module never returns unvalidated model
 * text as a recommendation, and it never sends a request it has not redacted. If
 * either would happen, it refuses.
 */

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1_200;

/** Bumped whenever the system instruction changes, so audit rows stay interpretable. */
export const ZUMI_PROMPT_VERSION = "zumi-2026-08-10";

/**
 * The standing instruction sent with every request.
 *
 * It restates the product boundary to the model. That is defence in depth, not the
 * control — the control is `admitZumiRequest`, which refuses prohibited capabilities
 * before a prompt is ever built. A model asked politely is not a permission system.
 */
const SYSTEM_INSTRUCTION = [
  "You are Zumi, the operational intelligence layer inside Klinikos, a clinic operating system.",
  "You summarize, correlate, prioritize, and explain clinic operations.",
  "You never diagnose, never prescribe, never decide treatment, never interpret a clinical result as final, and never guarantee insurance coverage.",
  "Every claim you make must cite the operational record it came from. If the provided context does not support a claim, say the information is not available rather than inferring it.",
  "You produce suggestions for a person to confirm. You do not describe your output as a decision.",
].join(" ");

export type ZumiRequest = {
  session: ClinicSession;
  capability: string;
  /** Organization the request claims to act on. Checked against the session. */
  organizationId: string;
  /** Entitlement keys resolved server-side by the caller. */
  entitlements: readonly string[];
  /** Operational question in the user's words. */
  question: string;
  /** Structured operational context. Redacted before it reaches a provider. */
  context?: unknown;
  timeoutMs?: number;
  maxOutputTokens?: number;
};

export type ZumiFailure = ZumiAdmissionDenial & { invocationId: string | null };

export type ZumiSuccess = { allowed: true; response: ZumiResponse };

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

/**
 * Record the invocation.
 *
 * Never throws. A metering write that fails must not turn a successful, governed
 * answer into an error for the operator — but it also must not fail silently, so the
 * failure is surfaced on the server console without the request payload.
 */
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
        },
      },
    });
    return row.id;
  } catch (error) {
    console.error("[zumi] failed to write audit log", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

/**
 * Build the redacted prompt.
 *
 * Returns null when redaction cannot be trusted — identifier shapes still present
 * after scrubbing mean a rule missed something, and the request is abandoned rather
 * than sent. Failing closed here costs an answer; failing open costs a disclosure.
 */
function buildPrompt(request: ZumiRequest): { prompt: string; redactionApplied: boolean; droppedKeys: string[] } | null {
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
  };
}

/**
 * Parse model output into governed recommendations.
 *
 * Anything that does not satisfy the contract is dropped rather than repaired. A
 * recommendation with invented evidence is worse than no recommendation, and quietly
 * patching one would hide that the model failed to follow the contract.
 */
export function parseRecommendations(raw: string): { recommendations: ZumiRecommendation[]; rejected: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { recommendations: [], rejected: 0 };
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { recommendations?: unknown })?.recommendations)
      ? (parsed as { recommendations: unknown[] }).recommendations
      : [];

  const recommendations: ZumiRecommendation[] = [];
  let rejected = 0;

  for (const candidate of candidates) {
    const result = zumiRecommendationSchema.safeParse(candidate);
    if (!result.success) {
      rejected += 1;
      continue;
    }
    if (validateRecommendation(result.data).length > 0) {
      rejected += 1;
      continue;
    }
    recommendations.push(result.data);
  }

  return { recommendations, rejected };
}

async function invokeWithTimeout(adapter: ProviderAdapter, prompt: string, timeoutMs: number, maxOutputTokens: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await adapter.invoke({
      system: SYSTEM_INSTRUCTION,
      prompt,
      maxOutputTokens,
      timeoutMs,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
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

  // Denials are audited. A refused AI request is exactly the event a reviewer wants
  // to be able to find later, so it is never a silent return.
  if (!decision.allowed) {
    const auditLogId = await writeAuditLog({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      outcome: "denied",
      reason: decision.reason,
      humanReviewRequired: true,
    });
    const invocationId = await recordInvocation({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      tier: "UNKNOWN",
      outcome: "denied",
      reason: decision.reason,
      durationMs: Date.now() - startedAt,
      auditLogId,
    });
    return { ...decision, invocationId };
  }

  // `decision.allowed` implies a usable provider — the policy refuses otherwise —
  // but the narrowing is asserted rather than assumed.
  if (!selection.ok) {
    throw new Error("Zumi admitted a request with no usable provider. This is a policy bug.");
  }

  const built = buildPrompt(request);
  if (!built) {
    const auditLogId = await writeAuditLog({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      outcome: "denied",
      reason: "redaction_incomplete",
      providerKey: selection.adapter.key,
      humanReviewRequired: true,
    });
    await recordInvocation({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      tier: decision.tier,
      outcome: "denied",
      reason: "redaction_incomplete",
      providerKey: selection.adapter.key,
      redactionApplied: true,
      durationMs: Date.now() - startedAt,
      auditLogId,
    });
    const phi = phiEgressPermitted(selection.adapter);
    return {
      allowed: false,
      reason: "prohibited",
      status: 403,
      message: `This request still contains identifier-shaped content after redaction, so Zumi did not send it. ${phi.notice}`,
      invocationId: null,
    };
  }

  try {
    const result = await invokeWithTimeout(
      selection.adapter,
      built.prompt,
      request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    );

    const { recommendations } = parseRecommendations(result.text);
    const durationMs = Date.now() - startedAt;

    const auditLogId = await writeAuditLog({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      outcome: "admitted",
      providerKey: selection.adapter.key,
      humanReviewRequired: decision.requiresHumanReview,
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
        // Model prose is scrubbed on the way back too. A provider echoing an
        // identifier out of its own context window is a real path back in.
        answer: redactText(result.text).text,
        recommendations,
        orbState: orbStateForStage(recommendations.length > 0 ? "flagged" : "closed"),
        promptVersion: ZUMI_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costMicroUsd: result.costMicroUsd },
        auditLogId,
      },
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const auditLogId = await writeAuditLog({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      outcome: "error",
      reason: aborted ? "timeout" : "provider_error",
      providerKey: selection.adapter.key,
      humanReviewRequired: true,
    });
    const invocationId = await recordInvocation({
      organizationId: request.session.organizationId,
      userId: request.session.userId,
      capability: request.capability,
      tier: decision.tier,
      outcome: "error",
      reason: aborted ? "timeout" : "provider_error",
      providerKey: selection.adapter.key,
      durationMs: Date.now() - startedAt,
      auditLogId,
    });

    // The provider's error text is not forwarded. It can carry request echoes and
    // vendor internals, neither of which belongs in a clinic-facing message.
    return {
      allowed: false,
      reason: "provider_unavailable",
      status: 503,
      message: aborted
        ? "Zumi did not answer in time. Nothing was changed and no suggestion was produced."
        : "Zumi could not reach its model provider. Nothing was changed and no suggestion was produced.",
      invocationId,
    };
  }
}
