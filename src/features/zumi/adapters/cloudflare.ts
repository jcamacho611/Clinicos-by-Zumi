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

type CloudflareConfig = {
  accountId: string;
  apiToken: string;
  model: string;
  gatewayId: string;
  inputMicroUsdPerMillionTokens: number;
  outputMicroUsdPerMillionTokens: number;
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

function estimateTokenCostMicroUsd(
  inputTokens: number,
  outputTokens: number,
  config: Pick<CloudflareConfig, "inputMicroUsdPerMillionTokens" | "outputMicroUsdPerMillionTokens">,
) {
  return Math.round(
    (
      inputTokens * config.inputMicroUsdPerMillionTokens +
      outputTokens * config.outputMicroUsdPerMillionTokens
    ) / 1_000_000,
  );
}

function endpointFor(accountId: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`;
}

async function invokeCloudflare(
  request: ProviderRequest,
  config: CloudflareConfig,
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
    // Conservative marginal cost from the explicitly configured current model rates.
    // Account-wide free allocations/credits are deliberately not assigned to a single
    // request, so the cognition budget cannot silently treat paid inference as free.
    costMicroUsd: estimateTokenCostMicroUsd(inputTokens, outputTokens, config),
    modelId: typeof payload.model === "string" && payload.model.trim() ? payload.model : config.model,
  };
}

/** Cloudflare Workers AI adapter behind the governed Zumi boundary. PHI remains disabled. */
export function createCloudflareZumiAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const config: CloudflareConfig = {
    accountId: configuredValue(env, "ZUMI_CLOUDFLARE_ACCOUNT_ID"),
    apiToken: configuredValue(env, "ZUMI_CLOUDFLARE_API_TOKEN"),
    model: configuredValue(env, "ZUMI_CLOUDFLARE_MODEL"),
    gatewayId: configuredValue(env, "ZUMI_CLOUDFLARE_GATEWAY_ID") || DEFAULT_GATEWAY_ID,
    inputMicroUsdPerMillionTokens: envInt(env, "ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS"),
    outputMicroUsdPerMillionTokens: envInt(env, "ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS"),
  };

  return {
    key: "cloudflare",
    label: "Cloudflare Workers AI",
    modelId: config.model || "cloudflare-unconfigured",
    requiredEnv: REQUIRED_ENV,
    baaOnFile: false,
    invoke: (request) => invokeCloudflare(request, config),
  };
}

export function cloudflareZumiRequested(env: ZumiEnv = process.env) {
  return (
    configuredValue(env, "ZUMI_PROVIDER") === "cloudflare" ||
    configuredValue(env, "ZUMI_CLOUDFLARE_ACCOUNT_ID").length > 0 ||
    configuredValue(env, "ZUMI_CLOUDFLARE_API_TOKEN").length > 0
  );
}
