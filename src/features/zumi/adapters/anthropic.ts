import "server-only";

import {
  registerProvider,
  type ProviderAdapter,
  type ProviderRequest,
  type ProviderResult,
  type ZumiEnv,
} from "@/features/zumi/providers";

/**
 * The first Zumi model provider adapter.
 *
 * This is the only place in Klinikos permitted to speak a vendor's HTTP dialect.
 * Everything above it — admission policy, redaction, usage metering, audit — happens
 * in the gateway and is unchanged by which vendor sits here.
 *
 * Deliberately written against the HTTP API rather than a vendor SDK. The gateway
 * already owns retries, timeouts, and error handling, and an SDK would duplicate
 * those with slightly different semantics while adding a dependency that is harder to
 * swap than forty lines of fetch.
 *
 * **`baaOnFile` is false.** No Business Associate Agreement is executed for this
 * deployment, so PHI must not reach it. That is enforced in `admitZumiRequest`, which
 * refuses every request while this is false — not merely noted in a message, which is
 * all it was until the gate was added. The practical consequence is deliberate: this
 * adapter can hold valid credentials and still send nothing, and Zumi reports
 * `pending_phi_approval` rather than claiming to be connected. Flipping this to true
 * is an assertion that counsel executed an agreement, and belongs to whoever can make
 * that statement truthfully.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

/**
 * The model this adapter calls.
 *
 * **There is no default.** Model identifiers are versioned vendor strings that go stale
 * — a name that was current when this file was written is not guaranteed to exist in
 * the API environment a deployment actually points at, and a hard-coded one fails at
 * runtime with a vendor 404 that surfaces to a clinic as a broken feature. Requiring
 * the operator to name the model they have approved makes the failure happen at
 * configuration time, where it is visible and fixable.
 *
 * `ZUMI_ANTHROPIC_MODEL` is listed in `requiredEnv`, so an unset value makes the
 * registry report NOT_CONFIGURED and Zumi says "Pending Connection" — the same honest
 * refusal it gives for a missing key.
 */
export const MODEL_ENV_VAR = "ZUMI_ANTHROPIC_MODEL";
const MODEL_NOT_CONFIGURED = "(not configured)";

function configuredModel(env: ZumiEnv = process.env): string | null {
  const value = env[MODEL_ENV_VAR]?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Cost per million tokens, in micro-USD.
 *
 * Held here rather than computed from a live price list so the usage ledger records a
 * number even when nothing can be fetched. It is an estimate and the ledger column is
 * named accordingly — a cost figure that silently drifts from the invoice is worse
 * than one that is openly approximate.
 *
 * Because the model is operator-chosen, the rate has to be operator-stated too: a rate
 * frozen for one model would quietly misprice every other one. The fallbacks below are
 * a mid-tier list price, used only so the ledger records something rather than zero.
 */
const FALLBACK_INPUT_MICRO_USD_PER_MILLION = 3_000_000;
const FALLBACK_OUTPUT_MICRO_USD_PER_MILLION = 15_000_000;

function rate(name: string, fallback: number, env: ZumiEnv = process.env) {
  const parsed = Number.parseInt(env[name]?.trim() ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function estimateCostMicroUsd(inputTokens: number, outputTokens: number, env: ZumiEnv = process.env) {
  const inputRate = rate("ZUMI_ANTHROPIC_INPUT_MICRO_USD_PER_MTOK", FALLBACK_INPUT_MICRO_USD_PER_MILLION, env);
  const outputRate = rate("ZUMI_ANTHROPIC_OUTPUT_MICRO_USD_PER_MTOK", FALLBACK_OUTPUT_MICRO_USD_PER_MILLION, env);
  return Math.round((inputTokens / 1_000_000) * inputRate) + Math.round((outputTokens / 1_000_000) * outputRate);
}

type AnthropicResponse = {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
  model?: string;
};

async function invoke(request: ProviderRequest): Promise<ProviderResult> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  // Belt and braces. The registry already refuses to select an unconfigured adapter;
  // this makes a direct call impossible to get wrong too.
  if (!key) throw new Error("Anthropic adapter invoked without credentials.");

  const model = configuredModel();
  // Fails here rather than sending a request with `model: undefined` and letting the
  // vendor decide what that means.
  if (!model) throw new Error(`Anthropic adapter invoked without ${MODEL_ENV_VAR}.`);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: [{ role: "user", content: request.prompt }],
    }),
    signal: request.signal,
  });

  if (!response.ok) {
    // The vendor's body is not forwarded. It echoes the request, which the gateway
    // has already redacted once and should not re-expose through an error path.
    throw new Error(`Model provider returned ${response.status}.`);
  }

  const payload = (await response.json()) as AnthropicResponse;
  const text = (payload.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  const inputTokens = payload.usage?.input_tokens ?? 0;
  const outputTokens = payload.usage?.output_tokens ?? 0;

  return {
    text,
    inputTokens,
    outputTokens,
    costMicroUsd: estimateCostMicroUsd(inputTokens, outputTokens),
    modelId: payload.model ?? model,
  };
}

export const anthropicAdapter: ProviderAdapter = {
  key: "anthropic",
  label: "Anthropic",
  // A getter, not a value: the environment is read when status is reported rather than
  // frozen at module load, so a status page never shows a model the process would not
  // actually call.
  get modelId() {
    return configuredModel() ?? MODEL_NOT_CONFIGURED;
  },
  requiredEnv: ["ANTHROPIC_API_KEY", MODEL_ENV_VAR],
  // No BAA is executed for this deployment. Until one is, and until the deployment is
  // separately approved, the gateway refuses to send PHI here.
  baaOnFile: false,
  invoke,
};

export function registerAnthropicAdapter() {
  return registerProvider(anthropicAdapter);
}
