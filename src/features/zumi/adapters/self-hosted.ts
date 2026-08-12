import type { ProviderAdapter, ProviderRequest, ProviderResult, ZumiEnv } from "@/features/zumi/providers";

const REQUIRED_ENV = ["ZUMI_SELF_HOSTED_BASE_URL", "ZUMI_SELF_HOSTED_MODEL"] as const;

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

function endpointFor(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;
}

async function invokeOpenAiCompatible(
  request: ProviderRequest,
  config: { baseUrl: string; model: string; apiKey: string },
): Promise<ProviderResult> {
  if (!config.baseUrl || !config.model) {
    throw new Error("Self-hosted Zumi inference is not configured.");
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;

  const response = await fetch(endpointFor(config.baseUrl), {
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
    throw new Error(`Self-hosted inference returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Self-hosted inference returned no assistant content.");
  }

  return {
    text,
    inputTokens: integerUsage(payload.usage?.prompt_tokens),
    outputTokens: integerUsage(payload.usage?.completion_tokens),
    // This field tracks external per-invocation model charges. Self-hosted compute is
    // infrastructure spend and must be metered separately rather than fabricated here.
    costMicroUsd: 0,
    modelId: typeof payload.model === "string" && payload.model.trim() ? payload.model : config.model,
  };
}

/**
 * Adapter for a Klinikos-operated OpenAI-compatible inference endpoint.
 *
 * The endpoint may be backed by llama.cpp, vLLM, SGLang, Transformers serving, or a
 * later internal runtime. The rest of Klinikos does not need to know which engine is
 * underneath it. This is intentionally native `fetch`: no external model SDK is
 * introduced into the application process.
 *
 * PHI remains disabled. Operating the inference server ourselves does not by itself
 * prove that the deployment, storage, networking, logging, access controls, or legal
 * posture are approved for protected health information.
 */
export function createSelfHostedZumiAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const baseUrl = configuredValue(env, "ZUMI_SELF_HOSTED_BASE_URL");
  const model = configuredValue(env, "ZUMI_SELF_HOSTED_MODEL");
  const apiKey = configuredValue(env, "ZUMI_SELF_HOSTED_API_KEY");

  return {
    key: "self_hosted",
    label: "Klinikos self-hosted inference",
    modelId: model || "self-hosted-unconfigured",
    requiredEnv: REQUIRED_ENV,
    baaOnFile: false,
    invoke: (request) => invokeOpenAiCompatible(request, { baseUrl, model, apiKey }),
  };
}

export function selfHostedZumiRequested(env: ZumiEnv = process.env) {
  return (
    configuredValue(env, "ZUMI_PROVIDER") === "self_hosted" ||
    REQUIRED_ENV.some((name) => configuredValue(env, name).length > 0)
  );
}
