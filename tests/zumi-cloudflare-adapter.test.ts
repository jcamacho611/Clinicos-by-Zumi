import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareZumiAdapter } from "@/features/zumi/adapters/cloudflare";
import { resetProviderRegistry, selectProvider } from "@/features/zumi/providers";

const configuredEnv = {
  ZUMI_PROVIDER: "cloudflare",
  ZUMI_CLOUDFLARE_ACCOUNT_ID: "account-123",
  ZUMI_CLOUDFLARE_API_TOKEN: "token-123",
  ZUMI_CLOUDFLARE_MODEL: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
  // Dated test fixtures based on the model's public per-million-token rates at the
  // time this invariant was added. Runtime deployments must configure current rates.
  ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS: "45000",
  ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS: "384000",
};

afterEach(() => {
  vi.restoreAllMocks();
  resetProviderRegistry();
});

describe("Cloudflare Zumi adapter", () => {
  it("stays pending until credentials, model, and explicit cost rates all exist", () => {
    const selection = selectProvider({ ZUMI_PROVIDER: "cloudflare" });
    expect(selection).toMatchObject({ ok: false, reason: "not_configured" });
    if (!selection.ok) {
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_ACCOUNT_ID");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_API_TOKEN");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_MODEL");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS");
    }
  });

  it("refuses to call a configured provider when cost-rate configuration is omitted", () => {
    const { ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS: _input, ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS: _output, ...withoutRates } = configuredEnv;
    const selection = selectProvider(withoutRates);
    expect(selection).toMatchObject({ ok: false, reason: "not_configured" });
    if (!selection.ok) expect(selection.detail).toMatch(/MICRO_USD_PER_M_TOKENS/);
  });

  it("selects Cloudflare explicitly once configuration and rates are present", () => {
    const selection = selectProvider(configuredEnv);
    expect(selection.ok).toBe(true);
    if (selection.ok) {
      expect(selection.adapter.key).toBe("cloudflare");
      expect(selection.adapter.baaOnFile).toBe(false);
      expect(selection.adapter.modelId).toBe("@cf/meta/llama-3.1-8b-instruct-fp8-fast");
    }
  });

  it("meters token cost and sends the required AI Gateway privacy headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        model: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
        choices: [{ message: { content: "{\"summary\":\"ready\"}" } }],
        usage: { prompt_tokens: 12, completion_tokens: 4 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );

    const adapter = createCloudflareZumiAdapter(configuredEnv);
    const result = await adapter.invoke({
      system: "Use only supplied operational facts.",
      prompt: "Summarize the queue.",
      maxOutputTokens: 128,
      timeoutMs: 10_000,
    });

    // round((12 * 45,000 + 4 * 384,000) / 1,000,000) = 2 micro-USD.
    expect(result).toMatchObject({ text: "{\"summary\":\"ready\"}", inputTokens: 12, outputTokens: 4, costMicroUsd: 2 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/account-123/ai/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer token-123",
      "content-type": "application/json",
      "cf-aig-gateway-id": "default",
      "cf-aig-collect-log-payload": "false",
    });
  });

  it("keeps large requests visible to the same micro-USD budget used by deep cognition", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: "ok" } }],
        usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      }), { status: 200 }),
    );

    const result = await createCloudflareZumiAdapter(configuredEnv).invoke({
      system: "system",
      prompt: "prompt",
      maxOutputTokens: 1_000_000,
      timeoutMs: 10_000,
    });

    expect(result.costMicroUsd).toBe(429_000);
  });

  it("honours an explicitly configured gateway ID", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 0, completion_tokens: 0 } }), { status: 200 }),
    );
    const adapter = createCloudflareZumiAdapter({ ...configuredEnv, ZUMI_CLOUDFLARE_GATEWAY_ID: "klinikos" });
    await adapter.invoke({ system: "system", prompt: "prompt", maxOutputTokens: 32, timeoutMs: 10_000 });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      "cf-aig-gateway-id": "klinikos",
      "cf-aig-collect-log-payload": "false",
    });
  });
});
