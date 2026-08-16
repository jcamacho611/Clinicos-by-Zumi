import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareZumiAdapter } from "@/features/zumi/adapters/cloudflare";
import { resetProviderRegistry, selectProvider } from "@/features/zumi/providers";

const configuredEnv = {
  ZUMI_PROVIDER: "cloudflare",
  ZUMI_CLOUDFLARE_ACCOUNT_ID: "account-123",
  ZUMI_CLOUDFLARE_API_TOKEN: "token-123",
  ZUMI_CLOUDFLARE_MODEL: "@cf/meta/llama-3.1-8b-instruct",
};

afterEach(() => {
  vi.restoreAllMocks();
  resetProviderRegistry();
});

describe("Cloudflare Zumi adapter", () => {
  it("stays pending until every required Cloudflare value exists", () => {
    resetProviderRegistry();
    const selection = selectProvider({ ZUMI_PROVIDER: "cloudflare" });
    expect(selection).toMatchObject({ ok: false, reason: "not_configured" });
    if (!selection.ok) {
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_ACCOUNT_ID");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_API_TOKEN");
      expect(selection.detail).toContain("ZUMI_CLOUDFLARE_MODEL");
    }
  });

  it("selects Cloudflare explicitly once configured", () => {
    resetProviderRegistry();
    const selection = selectProvider(configuredEnv);
    expect(selection.ok).toBe(true);
    if (selection.ok) {
      expect(selection.adapter.key).toBe("cloudflare");
      expect(selection.adapter.baaOnFile).toBe(false);
      expect(selection.adapter.modelId).toBe("@cf/meta/llama-3.1-8b-instruct");
    }
  });

  it("uses Cloudflare's OpenAI-compatible chat-completions contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "@cf/meta/llama-3.1-8b-instruct",
          choices: [{ message: { content: "{\"summary\":\"ready\"}" } }],
          usage: { prompt_tokens: 12, completion_tokens: 4 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const adapter = createCloudflareZumiAdapter({
      ...configuredEnv,
      ZUMI_CLOUDFLARE_GATEWAY_ID: "default",
    });

    const result = await adapter.invoke({
      system: "Use only supplied operational facts.",
      prompt: "Summarize the queue.",
      maxOutputTokens: 128,
      timeoutMs: 10_000,
    });

    expect(result).toMatchObject({
      text: "{\"summary\":\"ready\"}",
      inputTokens: 12,
      outputTokens: 4,
      modelId: "@cf/meta/llama-3.1-8b-instruct",
      costMicroUsd: 0,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/account-123/ai/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer token-123",
      "content-type": "application/json",
      "cf-aig-gateway-id": "default",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "@cf/meta/llama-3.1-8b-instruct",
      max_tokens: 128,
      temperature: 0,
    });
  });
});
