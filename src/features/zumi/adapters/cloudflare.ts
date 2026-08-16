import type { ProviderAdapter, ProviderRequest, ProviderResult, ZumiEnv } from "@/features/zumi/providers";

const REQUIRED_ENV = [
  "ZUMI_CLOUDFLARE_ACCOUNT_ID",
  "ZUMI_CLOUDFLARE_API_TOKEN",
  "ZUMI_CLOUDFLARE_MODEL",
] as const;

type ChatCompletionResponse = {
  model?: unknown;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };
};

function configuredValue(env: ZumiEnv, name: string) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

function integerUsage(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function endpointFor(accountId: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`;
}

async function invokeCloudflare(
  request: ProviderRequest,
  config: { accountId: string; apiToken: string; model: string; gatewayId: string },
): Promise<ProviderResult> {
  if (!config.accountId || !config.apiToken || !config.model) {
    throw new Error("Cloudflare Workers AI is not configured.");
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${config.apiToken}`,
    "content-type": "application/json",
  };
  if (config.gatewayId) headers["cf-aig-gateway-id"] = config.gatewayId;

  const response = await fetch(endpointFor(config.accountId), {
    method: "POST",
    headers,
    signal: request.signal,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxOutputTokens,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare Workers AI returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Cloudflare Workers AI returned no assistant content.");
  }

  return {
    text,
    inputTokens: integerUsage(payload.usage?.prompt_tokens),
    outputTokens: integerUsage(payload.usage?.completion_tokens),
    // Workers AI billing is infrastructure/provider usage and may include free-tier
    // allowance. Do not fabricate a per-request dollar amount from token counts.
    costMicroUsd: 0,
    modelId: typeof payload.model === "string" && payload.model.trim() ? payload.model : config.model,
  };
}

/**
 * Cloudflare Workers AI adapter for Zumi.
 *
 * Cloudflare exposes an OpenAI-compatible /ai/v1/chat/completions endpoint, so the
 * application can keep using native fetch and the existing governed Zumi boundary.
 * No Cloudflare or OpenAI SDK is required in the Next.js process.
 *
 * PHI remains disabled. A Cloudflare account/token and model connection do not by
 * themselves establish the legal, contractual, logging, retention, and deployment
 * controls required for protected health information.
 */
export function createCloudflareZumiAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const accountId = configuredValue(env, "ZUMI_CLOUDFLARE_ACCOUNT_ID");
  const apiToken = configuredValue(env, "ZUMI_CLOUDFLARE_API_TOKEN");
  const model = configuredValue(env, "ZUMI_CLOUDFLARE_MODEL");
  const gatewayId = configuredValue(env, "ZUMI_CLOUDFLARE_GATEWAY_ID");

  return {
    key: "cloudflare",
    label: "Cloudflare Workers AI",
    modelId: model || "cloudflare-unconfigured",
    requiredEnv: REQUIRED_ENV,
    baaOnFile: false,
    invoke: (request) => invokeCloudflare(request, { accountId, apiToken, model, gatewayId }),
  };
}

export function cloudflareZumiRequested(env: ZumiEnv = process.env) {
  return (
    configuredValue(env, "ZUMI_PROVIDER") === "cloudflare" ||
    REQUIRED_ENV.some((name) => configuredValue(env, name).length > 0)
  );
}
