import { afterEach, describe, expect, it, vi } from "vitest";
import { createSelfHostedZumiAdapter } from "@/features/zumi/adapters/self-hosted";
import { phiEgressPermitted, resetProviderRegistry, selectProvider } from "@/features/zumi/providers";

const request = {
  system: "You are Zumi.",
  prompt: "Summarize the operational queue.",
  maxOutputTokens: 400,
  timeoutMs: 5_000,
};

afterEach(() => {
  vi.unstubAllGlobals();
  resetProviderRegistry();
});

describe("self-hosted Zumi provider", () => {
  it("registers only when explicitly selected or partially configured", () => {
    resetProviderRegistry();
    expect(selectProvider({})).toMatchObject({ ok: false, reason: "no_providers" });

    resetProviderRegistry();
    expect(selectProvider({ ZUMI_PROVIDER: "self_hosted" })).toMatchObject({
      ok: false,
      reason: "not_configured",
      statuses: [
        {
          key: "self_hosted",
          missingEnv: ["ZUMI_SELF_HOSTED_BASE_URL", "ZUMI_SELF_HOSTED_MODEL"],
        },
      ],
    });
  });

  it("becomes selectable when the inference endpoint and model are configured", () => {
    const selection = selectProvider({
      ZUMI_PROVIDER: "self_hosted",
      ZUMI_SELF_HOSTED_BASE_URL: "http://inference.internal:8080",
      ZUMI_SELF_HOSTED_MODEL: "zumi-ops",
    });
    expect(selection).toMatchObject({
      ok: true,
      adapter: { key: "self_hosted", modelId: "zumi-ops", baaOnFile: false },
      status: { state: "CONFIGURED" },
    });
  });

  it("uses an OpenAI-compatible chat endpoint without requiring a vendor SDK", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toEqual({ "content-type": "application/json" });
      expect(JSON.parse(String(init?.body))).toEqual({
        model: "zumi-ops",
        messages: [
          { role: "system", content: "You are Zumi." },
          { role: "user", content: "Summarize the operational queue." },
        ],
        max_tokens: 400,
        temperature: 0,
      });
      return new Response(JSON.stringify({
        model: "zumi-ops-q4",
        choices: [{ message: { content: "{\"recommendations\":[]}" } }],
        usage: { prompt_tokens: 41, completion_tokens: 9 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = createSelfHostedZumiAdapter({
      ZUMI_SELF_HOSTED_BASE_URL: "http://inference.internal:8080/",
      ZUMI_SELF_HOSTED_MODEL: "zumi-ops",
    });
    const result = await adapter.invoke(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://inference.internal:8080/v1/chat/completions");
    expect(result).toEqual({
      text: "{\"recommendations\":[]}",
      inputTokens: 41,
      outputTokens: 9,
      costMicroUsd: 0,
      modelId: "zumi-ops-q4",
    });
  });

  it("adds an authorization header only when the internal inference service requires one", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        "content-type": "application/json",
        authorization: "Bearer internal-token",
      });
      return new Response(JSON.stringify({
        choices: [{ message: { content: "{}" } }],
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = createSelfHostedZumiAdapter({
      ZUMI_SELF_HOSTED_BASE_URL: "https://zumi-inference.internal",
      ZUMI_SELF_HOSTED_MODEL: "zumi-ops",
      ZUMI_SELF_HOSTED_API_KEY: "internal-token",
    });
    await adapter.invoke(request);
  });

  it("fails closed on an HTTP error or malformed inference response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status: 503 })));
    const adapter = createSelfHostedZumiAdapter({
      ZUMI_SELF_HOSTED_BASE_URL: "http://inference.internal",
      ZUMI_SELF_HOSTED_MODEL: "zumi-ops",
    });
    await expect(adapter.invoke(request)).rejects.toThrow("HTTP 503");

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })));
    await expect(adapter.invoke(request)).rejects.toThrow("no assistant content");
  });

  it("does not treat self-hosting as PHI approval", () => {
    const adapter = createSelfHostedZumiAdapter({
      ZUMI_SELF_HOSTED_BASE_URL: "http://inference.internal",
      ZUMI_SELF_HOSTED_MODEL: "zumi-ops",
    });
    expect(phiEgressPermitted(adapter, { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(false);
  });
});
