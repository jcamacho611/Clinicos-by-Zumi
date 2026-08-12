import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { invokeZumi } from "@/features/zumi/gateway";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { ZUMI_BASELINE_PERMISSION, zumiCapabilities, zumiOrbStates } from "@/features/zumi/schemas";
import { zumiGatewayStatus } from "@/features/zumi/providers";
import { registerOpenAIProvider } from "@/features/zumi/openai-adapter";
import { openZumiConversation, sealZumiConversation } from "@/features/zumi/conversation-state";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

// Registration is idempotent: the registry is keyed by provider name.
registerOpenAIProvider();

const domainSchema = z.string().trim().min(3).max(200).regex(/^[a-z0-9.-]+$/i);

const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80).default("conversation"),
  question: z.string().trim().min(3).max(8_000),
  context: z.record(z.string(), z.unknown()).optional(),
  conversationToken: z.string().trim().max(4_000).optional(),
  webResearch: z.boolean().default(false),
  knowledgeSearch: z.boolean().default(true),
  allowedDomains: z.array(domainSchema).max(20).optional(),
});

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const status = zumiGatewayStatus();
  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  return NextResponse.json({
    data: {
      status,
      orbStates: zumiOrbStates,
      conversation: {
        supported: true,
        continuity: "signed_previous_response",
        publicWebResearchSeparatedFromPhi: true,
        knowledgeRetrievalConfigured: Boolean(process.env.ZUMI_OPENAI_VECTOR_STORE_ID?.trim()),
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

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const previous = parsed.data.conversationToken
    ? openZumiConversation(parsed.data.conversationToken, {
        organizationId: session.organizationId,
        userId: session.userId,
      })
    : null;

  if (parsed.data.conversationToken && !previous) {
    return NextResponse.json({ error: "Conversation token is invalid, expired, or belongs to another account." }, { status: 400, headers: NO_STORE });
  }

  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const capability = parsed.data.webResearch ? "public_research" : parsed.data.capability;
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
    allowedDomains: parsed.data.allowedDomains,
    timeoutMs: parsed.data.webResearch ? 45_000 : undefined,
    maxOutputTokens: parsed.data.webResearch ? 2_000 : undefined,
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
    },
  }, { headers: NO_STORE });
}
