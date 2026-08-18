import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { invokeZumi } from "@/features/zumi/gateway";
import { loadZumiQualityGuardianContext } from "@/features/zumi/quality-guardian-context";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { ZUMI_BASELINE_PERMISSION } from "@/features/zumi/schemas";
import { registerProvider, zumiGatewayStatus } from "@/features/zumi/providers";
import { createOpenAIResponsesAdapter, openAIResponsesRequested } from "@/features/zumi/adapters/openai-responses";
import { openZumiConversation, sealZumiConversation } from "@/features/zumi/conversation-state";
import { checkZumiProcessRateLimit } from "@/features/zumi/rate-limit";
import { zumiAccessibilitySchema, zumiPresenceSchema } from "@/features/zumi/presence";
import {
  projectTrustedOrchestrationForClient,
  projectZumiSourcesForClient,
  sanitizeZumiAnswerForClient,
} from "@/features/zumi/client-projection";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import { deriveSessionRiskSignals } from "@/lib/security/session-risk";
import { recordSecurityEvent } from "@/lib/security/events";

export const maxDuration = 120;

const NO_STORE = PRIVATE_NO_STORE_HEADERS;
const MAX_ZUMI_BODY_BYTES = 64 * 1024;

if (openAIResponsesRequested()) registerProvider(createOpenAIResponsesAdapter());

const domainSchema = z.string().trim().min(3).max(200).regex(/^[a-z0-9.-]+$/i);

const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80).default("conversation"),
  question: z.string().trim().min(3).max(8_000),
  context: z.record(z.string(), z.unknown()).optional(),
  conversationToken: z.string().trim().max(4_000).optional(),
  webResearch: z.boolean().optional(),
  knowledgeSearch: z.boolean().default(true),
  codeInterpreter: z.boolean().optional(),
  allowedDomains: z.array(domainSchema).max(20).optional(),
  presence: zumiPresenceSchema.optional(),
  accessibility: zumiAccessibilitySchema.optional(),
});

async function boundedJson(request: Request) {
  const declared = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declared) && declared > MAX_ZUMI_BODY_BYTES) return { tooLarge: true as const, value: null };

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_ZUMI_BODY_BYTES) return { tooLarge: true as const, value: null };
  try {
    return { tooLarge: false as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { tooLarge: false as const, value: null };
  }
}

/**
 * Browser-visible status is deliberately narrow. Provider identity, missing env names,
 * entitlements, tool graph, prompt/cognition strategy, and internal policy profile are
 * server-confidential and are not configuration-discovery API surface.
 */
export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const gateway = zumiGatewayStatus();
  return NextResponse.json({
    data: {
      available: gateway.available,
      mode: gateway.available ? "connected" : "pending_connection",
      presence: {
        supported: true,
        keyboardShortcut: "Ctrl/Cmd+J",
        browserVoiceInput: true,
        browserSpeechOutput: true,
        interactionModes: ["conversation", "research", "command", "briefing"],
        autonomyModes: ["answer_only", "suggest_actions", "prepare_actions"],
      },
    },
  }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const metadata = requestMetadata(request);
  const sessionSignals = await deriveSessionRiskSignals(session, request);
  if (sessionSignals.newIp || sessionSignals.newUserAgent) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "session.drift_observed",
      risk: "MEDIUM",
      resourceType: "auth_session",
      resourceId: session.sessionId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: sessionSignals,
    });
  }

  const limit = checkZumiProcessRateLimit(`${session.userId}:${metadata.ipAddress ?? "unknown"}`);
  if (!limit.allowed) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.rate_limited",
      risk: "MEDIUM",
      resourceType: "ai",
      resourceId: "zumi",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { retryAfterSeconds: limit.retryAfterSeconds },
    });
    return NextResponse.json(
      { error: "Too many Zumi requests. Try again shortly." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await boundedJson(request);
  if (body.tooLarge) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.oversized_request",
      risk: "MEDIUM",
      resourceType: "ai",
      resourceId: "zumi",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { maxBytes: MAX_ZUMI_BODY_BYTES },
    });
    return NextResponse.json({ error: "Zumi request is too large." }, { status: 413, headers: NO_STORE });
  }

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const previous = parsed.data.conversationToken
    ? openZumiConversation(parsed.data.conversationToken, {
        organizationId: session.organizationId,
        userId: session.userId,
      })
    : null;

  if (parsed.data.conversationToken && !previous) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.invalid_continuation_token",
      risk: "MEDIUM",
      resourceType: "ai_conversation",
      resourceId: "continuation",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    return NextResponse.json(
      { error: "Conversation token is invalid, expired, or belongs to another account." },
      { status: 400, headers: NO_STORE },
    );
  }

  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const capability = parsed.data.webResearch === true ? "public_research" : parsed.data.capability;
  const presence = zumiPresenceSchema.parse(parsed.data.presence ?? {});
  const accessibility = zumiAccessibilitySchema.parse(parsed.data.accessibility ?? {});

  // Quality Guardian is server-loaded from tenant/RBAC-scoped persisted data. It is
  // intentionally separate from client-supplied `context`, which is never trusted
  // as quality/compliance truth.
  const qualityGuardianContext = await loadZumiQualityGuardianContext({
    session,
    question: parsed.data.question,
  });

  const result = await invokeZumi({
    session,
    capability,
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context: parsed.data.context,
    trustedQualityAssurance: qualityGuardianContext?.quality ?? null,
    previousResponseId: previous?.responseId ?? null,
    allowWebResearch: parsed.data.webResearch,
    allowKnowledgeSearch: parsed.data.knowledgeSearch,
    allowCodeInterpreter: parsed.data.codeInterpreter,
    allowedDomains: parsed.data.allowedDomains,
    presence,
    accessibility,
  });

  if (!result.allowed) {
    return NextResponse.json({ error: result.message }, { status: result.status, headers: NO_STORE });
  }

  const conversationToken = result.continuation?.responseId
    ? sealZumiConversation({
        responseId: result.continuation.responseId,
        organizationId: session.organizationId,
        userId: session.userId,
      })
    : null;

  const projectedAnswer = sanitizeZumiAnswerForClient(result.response.answer);
  if (projectedAnswer.blockedMarkers.length > 0) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.client_disclosure_blocked",
      risk: "HIGH",
      resourceType: "ai_response",
      resourceId: result.response.auditLogId ?? "zumi-response",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { markerCount: projectedAnswer.blockedMarkers.length },
    });
  }

  // This is the browser disclosure boundary. Do not spread the internal gateway
  // result here. Usage/cost telemetry, audit IDs, model/provider details, cognition
  // traces, tool usage, capability keys, policy profiles, Quality Guardian internals,
  // and trusted orchestration identifiers remain server-side.
  return NextResponse.json({
    data: {
      answer: projectedAnswer.answer,
      conversationToken,
      sources: projectZumiSourcesForClient(result.continuation?.sources ?? []),
      trustedOrchestration: projectTrustedOrchestrationForClient(result.trustedOrchestration),
      rateLimitRemaining: limit.remaining,
    },
  }, { headers: NO_STORE });
}
