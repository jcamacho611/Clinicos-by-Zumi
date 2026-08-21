import type { ProviderAdapter, ProviderRequest, ProviderResult, ZumiEnv } from "@/features/zumi/providers";

const REQUIRED_ENV = [
  "ZUMI_CLOUDFLARE_ACCOUNT_ID",
  "ZUMI_CLOUDFLARE_API_TOKEN",
  "ZUMI_CLOUDFLARE_MODEL",
  "ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS",
  "ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS",
] as const;

const DEFAULT_GATEWAY_ID = "default";

type ChatCompletionResponse = {
  model?: unknown;
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
};

function configuredValue(env: ZumiEnv, name: string) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

function integerUsage(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function envInt(env: ZumiEnv, key: string, fallback = 0) {
  const value = Number.parseInt(env[key] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function estimateTokenCostMicroUsd(inputTokens: number, outputTokens: number, env: ZumiEnv) {
  const inputPerMillion = envInt(env, "ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS");
  const outputPerMillion = envInt(env, "ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS");
  return Math.round((inputTokens * inputPerMillion + outputTokens * outputPerMillion) / 1_000_000);
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
    // Workers AI requests through Cloudflare's AI REST API require a gateway ID.
    // `default` is a documented first-use path and auto-creates the account gateway.
    "cf-aig-gateway-id": config.gatewayId || DEFAULT_GATEWAY_ID,
    // Preserve provider-side metadata while preventing raw prompts/completions from
    // being persisted in AI Gateway logs by default.
    "cf-aig-collect-log-payload": "false",
  };

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

  if (!response.ok) throw new Error(`Cloudflare Workers AI returned HTTP ${response.status}.`);

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Cloudflare Workers AI returned no assistant content.");
  }

  const inputTokens = integerUsage(payload.usage?.prompt_tokens);
  const outputTokens = integerUsage(payload.usage?.completion_tokens);

  return {
    text,
    inputTokens,
    outputTokens,
    // This is a conservative marginal-cost estimate using the operator-configured
    // current model rates. Account-wide free allocations/credits are deliberately not
    // netted out here because a single request cannot truthfully claim them. That keeps
    // Zumi's per-turn spend budget and customer-funded metering from treating paid
    // inference as free.
    costMicroUsd: estimateTokenCostMicroUsd(inputTokens, outputTokens, process.env),
    modelId: typeof payload.model === "string" && payload.model.trim() ? payload.model : config.model,
  };
}

/** Cloudflare Workers AI adapter behind the governed Zumi boundary. PHI remains disabled. */
export function createCloudflareZumiAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const accountId = configuredValue(env, "ZUMI_CLOUDFLARE_ACCOUNT_ID");
  const apiToken = configuredValue(env, "ZUMI_CLOUDFLARE_API_TOKEN");
  const model = configuredValue(env, "ZUMI_CLOUDFLARE_MODEL");
  const gatewayId = configuredValue(env, "ZUMI_CLOUDFLARE_GATEWAY_ID") || DEFAULT_GATEWAY_ID;

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
    configuredValue(env, "ZUMI_CLOUDFLARE_ACCOUNT_ID").length > 0 ||
    configuredValue(env, "ZUMI_CLOUDFLARE_API_TOKEN").length > 0
  );
}
