import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAIResponsesAdapter } from "@/features/zumi/adapters/openai-responses";
import { resetProviderRegistry, selectProvider } from "@/features/zumi/providers";

const configuredEnv = {
  ZUMI_PROVIDER: "openai",
  OPENAI_API_KEY: "bound-test-key",
  ZUMI_OPENAI_MODEL: "gpt-test",
  // Dated test fixtures only. Production must configure current provider pricing.
  ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS: "5000000",
  ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS: "30000000",
  ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL: "10000",
  ZUMI_OPENAI_FILE_SEARCH_MICRO_USD_PER_CALL: "2500",
  ZUMI_OPENAI_CODE_INTERPRETER_MICRO_USD_PER_SESSION: "30000",
  ZUMI_OPENAI_VECTOR_STORE_ID: "vs_test",
  ZUMI_OPENAI_CODE_INTERPRETER: "1",
  ZUMI_WEB_SEARCH_CONTEXT_SIZE: "medium",
};

function request(overrides: Record<string, unknown> = {}) {
  return {
    system: "Use only supplied operational facts.",
    prompt: "Analyze the current operating question.",
    maxOutputTokens: 512,
    timeoutMs: 10_000,
    ...overrides,
  };
}

function successfulResponse(output: unknown, usage = { input_tokens: 1_000, output_tokens: 200 }) {
  return new Response(JSON.stringify({
    id: "resp_test",
    model: "gpt-test",
    output,
    usage,
  }), { status: 200, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.restoreAllMocks();
  resetProviderRegistry();
});

describe("OpenAI Responses cost integrity", () => {
  it("keeps partial OpenAI setup Pending Connection instead of throwing during registration", () => {
    expect(() => selectProvider({ ZUMI_PROVIDER: "openai" })).not.toThrow();
    const selection = selectProvider({ ZUMI_PROVIDER: "openai" });
    expect(selection).toMatchObject({ ok: false, reason: "not_configured" });
    if (!selection.ok) {
      expect(selection.detail).toContain("OPENAI_API_KEY");
      expect(selection.detail).toContain("ZUMI_OPENAI_MODEL");
      expect(selection.detail).toContain("ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS");
      expect(selection.detail).toContain("ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS");
    }
  });

  it("selects OpenAI once the base provider and token-rate contract is configured", () => {
    const selection = selectProvider(configuredEnv);
    expect(selection.ok).toBe(true);
    if (selection.ok) expect(selection.adapter.modelId).toBe("gpt-test");
  });

  it("uses the adapter's bound environment rather than ambient process.env at invocation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(successfulResponse([
      { type: "message", content: [{ type: "output_text", text: "ok" }] },
    ]));
    const adapter = createOpenAIResponsesAdapter(configuredEnv);

    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "wrong-ambient-key";
    try {
      await adapter.invoke(request());
    } finally {
      if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalKey;
    }

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer bound-test-key" });
  });

  it("blocks web search before fetch when its paid call rate is unknown", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL: _rate, ...withoutRate } = configuredEnv;
    await expect(createOpenAIResponsesAdapter(withoutRate).invoke(request({ allowWebSearch: true })))
      .rejects.toThrow("ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks file search before fetch when its paid call rate is unknown", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { ZUMI_OPENAI_FILE_SEARCH_MICRO_USD_PER_CALL: _rate, ...withoutRate } = configuredEnv;
    await expect(createOpenAIResponsesAdapter(withoutRate).invoke(request({ allowKnowledgeSearch: true })))
      .rejects.toThrow("ZUMI_OPENAI_FILE_SEARCH_MICRO_USD_PER_CALL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks Code Interpreter before fetch when its session rate is unknown", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { ZUMI_OPENAI_CODE_INTERPRETER_MICRO_USD_PER_SESSION: _rate, ...withoutRate } = configuredEnv;
    await expect(createOpenAIResponsesAdapter(withoutRate).invoke(request({ allowCodeInterpreter: true })))
      .rejects.toThrow("ZUMI_OPENAI_CODE_INTERPRETER_MICRO_USD_PER_SESSION");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks non-positive token pricing before any provider call even when strings are present", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const adapter = createOpenAIResponsesAdapter({
      ...configuredEnv,
      ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS: "0",
    });
    await expect(adapter.invoke(request())).rejects.toThrow("OpenAI token pricing must be configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds model, web-search, file-search and one interpreter-session cost into the turn", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(successfulResponse([
      { type: "web_search_call", action: { sources: [{ url: "https://example.com" }] } },
      { type: "file_search_call" },
      { type: "file_search_call" },
      { type: "code_interpreter_call" },
      { type: "code_interpreter_call" },
      { type: "message", content: [{ type: "output_text", text: "verified" }] },
    ]));

    const result = await createOpenAIResponsesAdapter(configuredEnv).invoke(request({
      allowWebSearch: true,
      allowKnowledgeSearch: true,
      allowCodeInterpreter: true,
      maxToolCalls: 8,
    }));

    // Tokens: 1,000 * $5/M = 5,000 micro-USD; 200 * $30/M = 6,000.
    // Tools: web 10,000 + file 2 * 2,500 + one CI session 30,000.
    expect(result.costMicroUsd).toBe(56_000);
    expect(result.toolsUsed).toEqual(expect.arrayContaining(["web_search", "file_search", "code_interpreter"]));
    expect(result.sources).toEqual([{ url: "https://example.com" }]);
  });
});
