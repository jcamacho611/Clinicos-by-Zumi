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
import { estimateResearchComplexity, zumiResearchDepths } from "@/features/zumi/research-strategy";
import { configuredZumiMcpServers } from "@/features/zumi/mcp-config";
import { zumiToolCatalog } from "@/features/zumi/tool-catalog";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

registerOpenAIProvider();

const domainSchema = z.string().trim().min(3).max(200).regex(/^[a-z0-9.-]+$/i);
const depthSchema = z.enum([...zumiResearchDepths, "auto"] as const);

const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80).default("conversation"),
  question: z.string().trim().min(3).max(8_000),
  context: z.record(z.string(), z.unknown()).optional(),
  conversationToken: z.string().trim().max(4_000).optional(),
  /** Explicit true/false overrides auto. Omit to let Zumi decide from complexity. */
  webResearch: z.boolean().optional(),
  knowledgeSearch: z.boolean().default(true),
  computation: z.boolean().default(true),
  learnStrategy: z.boolean().default(true),
  depth: depthSchema.default("auto"),
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
  const mcpServers = configuredZumiMcpServers();
  return NextResponse.json({
    data: {
      status,
      orbStates: zumiOrbStates,
      conversation: {
        supported: true,
        continuity: "signed_previous_response",
        automaticResearchEscalation: true,
        publicWebResearchSeparatedFromPhi: true,
        knowledgeRetrievalConfigured: Boolean(process.env.ZUMI_OPENAI_VECTOR_STORE_ID?.trim()),
        computationAvailable: true,
        configuredExternalToolServers: mcpServers.map((server) => ({ label: server.label, requireApproval: server.requireApproval })),
      },
      tools: zumiToolCatalog.map((tool) => ({
        key: tool.key,
        kind: tool.kind,
        label: tool.label,
        risk: tool.risk,
        enabledByDefault: tool.enabledByDefault,
        requiresHumanApproval: tool.requiresHumanApproval ?? false,
      })),
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
    ? openZumiConversation(parsed.data.conversationToken, { organizationId: session.organizationId, userId: session.userId })
    : null;
  if (parsed.data.conversationToken && !previous) {
    return NextResponse.json({ error: "Conversation token is invalid, expired, or belongs to another account." }, { status: 400, headers: NO_STORE });
  }

  const complexity = estimateResearchComplexity(parsed.data.question);
  const hasOperationalContext = parsed.data.context !== undefined;
  const autoWebResearch = !hasOperationalContext && complexity.depth !== "direct";
  const allowWebResearch = parsed.data.webResearch ?? autoWebResearch;
  const resolvedDepth = parsed.data.depth === "auto" ? complexity.depth : parsed.data.depth;
  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const capability = allowWebResearch ? "public_research" : parsed.data.capability;

  const result = await invokeZumi({
    session,
    capability,
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context: parsed.data.context,
    previousResponseId: previous?.responseId ?? null,
    allowWebResearch,
    allowKnowledgeSearch: parsed.data.knowledgeSearch,
    allowComputation: parsed.data.computation,
    allowedDomains: parsed.data.allowedDomains,
    mcpServers: configuredZumiMcpServers(),
    agentDepth: resolvedDepth,
    learnStrategy: parsed.data.learnStrategy,
    timeoutMs: resolvedDepth === "deep" ? 60_000 : allowWebResearch ? 45_000 : undefined,
    maxOutputTokens: resolvedDepth === "deep" ? 2_400 : allowWebResearch ? 2_000 : undefined,
  });

  if (!result.allowed) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: result.status, headers: NO_STORE });
  }

  const conversationToken = result.continuation?.responseId
    ? sealZumiConversation({ responseId: result.continuation.responseId, organizationId: session.organizationId, userId: session.userId })
    : null;

  return NextResponse.json({
    data: {
      ...result.response,
      conversationToken,
      sources: result.continuation?.sources ?? [],
      intelligence: result.continuation ? {
        requestedDepth: parsed.data.depth,
        resolvedDepth: result.continuation.depth,
        complexityScore: complexity.score,
        complexityReasons: complexity.reasons,
        calls: result.continuation.calls,
        toolsUsed: result.continuation.toolsUsed,
        verification: result.continuation.verification,
        evidenceQuality: result.continuation.evidenceQuality,
        strategyLearned: result.continuation.strategyLearned,
        webResearchUsed: allowWebResearch,
      } : null,
    },
  }, { headers: NO_STORE });
}
