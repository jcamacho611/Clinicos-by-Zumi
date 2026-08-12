import { afterEach, describe, expect, it, vi } from "vitest";
import { openZumiConversation, sealZumiConversation } from "@/features/zumi/conversation-state";
import {
  knowledgeCapsuleIsFresh,
  renderKnowledgeCapsule,
  zumiKnowledgeCapsuleSchema,
} from "@/features/zumi/knowledge";
import { createOpenAIProvider } from "@/features/zumi/openai-adapter";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("Zumi conversation continuity", () => {
  const env = { AUTH_SECRET: "this-is-a-long-test-secret-for-zumi-conversation-signing" } as NodeJS.ProcessEnv;

  it("round-trips a provider response ID without exposing an unsigned continuation handle", () => {
    const token = sealZumiConversation({ responseId: "resp_123", organizationId: "org_1", userId: "user_1" }, env);
    expect(token).toBeTruthy();
    const opened = openZumiConversation(token, { organizationId: "org_1", userId: "user_1" }, env);
    expect(opened?.responseId).toBe("resp_123");
  });

  it("cannot move a conversation between organizations or users", () => {
    const token = sealZumiConversation({ responseId: "resp_123", organizationId: "org_1", userId: "user_1" }, env);
    expect(openZumiConversation(token, { organizationId: "org_2", userId: "user_1" }, env)).toBeNull();
    expect(openZumiConversation(token, { organizationId: "org_1", userId: "user_2" }, env)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = sealZumiConversation({ responseId: "resp_123", organizationId: "org_1", userId: "user_1" }, env)!;
    expect(openZumiConversation(`${token}x`, { organizationId: "org_1", userId: "user_1" }, env)).toBeNull();
  });
});

describe("Zumi knowledge capsules", () => {
  const capsule = zumiKnowledgeCapsuleSchema.parse({
    version: 1,
    topic: "FHIR interoperability",
    summary: "FHIR defines interoperable healthcare data resources and APIs.",
    claims: [{
      text: "FHIR organizes exchange around typed resources.",
      confidence: "high",
      sourceUrls: ["https://hl7.org/fhir/"],
    }],
    sources: [{
      url: "https://hl7.org/fhir/",
      domain: "hl7.org",
      title: "FHIR specification",
      capturedAt: "2026-08-12T10:00:00.000Z",
    }],
    tags: ["fhir", "interoperability"],
    capturedAt: "2026-08-12T10:00:00.000Z",
    freshnessDays: 60,
    supersedes: [],
  });

  it("keeps reusable evidence attached to retained claims", () => {
    expect(capsule.claims[0].sourceUrls).toEqual(["https://hl7.org/fhir/"]);
    expect(renderKnowledgeCapsule(capsule)).toContain("https://hl7.org/fhir/");
  });

  it("uses an explicit freshness window instead of treating retained knowledge as timeless", () => {
    expect(knowledgeCapsuleIsFresh(capsule, new Date("2026-09-01T10:00:00.000Z"))).toBe(true);
    expect(knowledgeCapsuleIsFresh(capsule, new Date("2026-11-01T10:00:00.000Z"))).toBe(false);
  });
});

describe("OpenAI Zumi provider adapter", () => {
  it("carries signed conversation continuity into Responses and enables bounded retrieval tools", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.ZUMI_OPENAI_VECTOR_STORE_ID = "vs_test";
    process.env.ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS = "1000000";
    process.env.ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS = "2000000";
    process.env.ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL = "300";
    process.env.ZUMI_MAX_TOOL_CALLS = "3";

    let requestBody: Record<string, unknown> | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body ?? "{}"));
      return new Response(JSON.stringify({
        id: "resp_new",
        model: "gpt-5-mini",
        usage: { input_tokens: 100, output_tokens: 50 },
        output: [
          { type: "web_search_call", action: { type: "search", sources: [{ type: "url", url: "https://cms.gov/example" }] } },
          { type: "message", content: [{ type: "output_text", text: "Grounded answer", annotations: [{ type: "url_citation", url: "https://cms.gov/example", title: "CMS" }] }] },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const adapter = createOpenAIProvider(process.env);
    const result = await adapter.invoke({
      system: "system",
      prompt: "public question",
      maxOutputTokens: 1200,
      timeoutMs: 20_000,
      previousResponseId: "resp_previous",
      allowWebSearch: true,
      allowKnowledgeSearch: true,
      allowedDomains: ["cms.gov"],
    });

    expect(requestBody).toMatchObject({
      previous_response_id: "resp_previous",
      max_tool_calls: 3,
      tools: [
        { type: "file_search", vector_store_ids: ["vs_test"] },
        { type: "web_search", filters: { allowed_domains: ["cms.gov"] } },
      ],
    });
    expect(result).toMatchObject({
      text: "Grounded answer",
      responseId: "resp_new",
      inputTokens: 100,
      outputTokens: 50,
      costMicroUsd: 500,
      sources: [{ url: "https://cms.gov/example", title: "CMS" }],
    });
  });
});
