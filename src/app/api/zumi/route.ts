import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { invokeZumi } from "@/features/zumi/gateway";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { ZUMI_BASELINE_PERMISSION, zumiCapabilities, zumiOrbStates } from "@/features/zumi/schemas";
import { registerProvider, zumiGatewayStatus } from "@/features/zumi/providers";
import { createOpenAIResponsesAdapter, openAIResponsesRequested } from "@/features/zumi/adapters/openai-responses";
import { openZumiConversation, sealZumiConversation } from "@/features/zumi/conversation-state";
import { checkZumiProcessRateLimit } from "@/features/zumi/rate-limit";
import { resolveAuthenticatedConversationPolicy } from "@/features/zumi/conversation-policy";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;
const MAX_ZUMI_BODY_BYTES = 64 * 1024;

if (openAIResponsesRequested()) registerProvider(createOpenAIResponsesAdapter());

const domainSchema = z.string().trim().min(3).max(200).regex(/^[a-z0-9.-]+$/i);

const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80).default("conversation"),
  question: z.string().trim().min(3).max(8_000),
  /** Structured context supplied by an authorized product surface. The gateway redacts before egress. */
  context: z.record(z.string(), z.unknown()).optional(),
  conversationToken: z.string().trim().max(4_000).optional(),
  /** Undefined means Zumi may decide automatically from the question/context boundary. */
  webResearch: z.boolean().optional(),
  knowledgeSearch: z.boolean().default(true),
  codeInterpreter: z.boolean().optional(),
  allowedDomains: z.array(domainSchema).max(20).optional(),
});

function rateLimitKey(request: Request, userId: string) {
  const metadata = requestMetadata(request);
  return `${userId}:${metadata.ipAddress ?? "unknown"}`;
}

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

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const status = zumiGatewayStatus();
  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const conversationPolicy = resolveAuthenticatedConversationPolicy(session);

  return NextResponse.json({
    data: {
      status,
      orbStates: zumiOrbStates,
      conversation: {
        supported: true,
        profile: conversationPolicy.profile,
        continuation: "signed_provider_response",
        automaticResearch: true,
        publicWebSeparatedFromPrivateContext: true,
        founderModeIsNotAuthorizationBypass: true,
      },
      capabilities: zumiCapabilities.map((capability) => ({
        key: capability.key,
        label: capability.label,
        tier: capability.tier,
        produces: capability.produces,
        entitled: capability.requiresEntitlement === null || entitlements.includes(capability.requiresEntitlement),
        requiresEntitlement: capability.requiresEntitlement,
      })),
    },
  }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const limit = checkZumiProcessRateLimit(rateLimitKey(request, session.userId));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many Zumi requests. Try again shortly." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await boundedJson(request);
  if (body.tooLarge) {
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
    return NextResponse.json(
      { error: "Conversation token is invalid, expired, or belongs to another account." },
      { status: 400, headers: NO_STORE },
    );
  }

  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const capability = parsed.data.webResearch === true ? "public_research" : parsed.data.capability;
  const result = await invokeZumi({
    session,
    capability,
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context: parsed.data.context,
    previousResponseId: previous?.responseId ?? null,
    allowWebResearch: parsed.data.webResearch,
    allowKnowledgeSearch: parsed.data.knowledgeSearch,
    allowCodeInterpreter: parsed.data.codeInterpreter,
    allowedDomains: parsed.data.allowedDomains,
  });

  if (!result.allowed) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: result.status, headers: NO_STORE });
  }

  const conversationToken = result.continuation?.responseId
    ? sealZumiConversation({
        responseId: result.continuation.responseId,
        organizationId: session.organizationId,
        userId: session.userId,
      })
    : null;

  return NextResponse.json({
    data: {
      ...result.response,
      conversationToken,
      sources: result.continuation?.sources ?? [],
      toolsUsed: result.continuation?.toolsUsed ?? [],
      research: result.research,
      rateLimitRemaining: limit.remaining,
    },
  }, { headers: NO_STORE });
}
