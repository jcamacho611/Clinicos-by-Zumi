import "server-only";

import { registerProvider, type ProviderAdapter, type ProviderRequest, type ProviderResult } from "@/features/zumi/providers";

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
 * deployment, so PHI must not reach it. The gateway enforces that independently;
 * this declaration is the adapter's own honest statement of its status.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

/**
 * Cost per million tokens, in micro-USD.
 *
 * Held here rather than computed from a live price list so the usage ledger records a
 * number even when nothing can be fetched. It is an estimate and the ledger column is
 * named accordingly — a cost figure that silently drifts from the invoice is worse
 * than one that is openly approximate.
 */
const INPUT_MICRO_USD_PER_MILLION = 3_000_000;
const OUTPUT_MICRO_USD_PER_MILLION = 15_000_000;

function estimateCostMicroUsd(inputTokens: number, outputTokens: number) {
  const input = Math.round((inputTokens / 1_000_000) * INPUT_MICRO_USD_PER_MILLION);
  const output = Math.round((outputTokens / 1_000_000) * OUTPUT_MICRO_USD_PER_MILLION);
  return input + output;
}

/**
 * The model this adapter calls.
 *
 * Overridable so a deployment can move to a cheaper or newer model without a code
 * change — model choice is an operational decision, not an architectural one.
 */
function modelId(env: NodeJS.ProcessEnv = process.env) {
  return env.ZUMI_ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";
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

  const model = modelId();

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
  modelId: modelId(),
  requiredEnv: ["ANTHROPIC_API_KEY"],
  // No BAA is executed for this deployment. Until one is, and until the deployment is
  // separately approved, the gateway refuses to send PHI here.
  baaOnFile: false,
  invoke,
};

export function registerAnthropicAdapter() {
  return registerProvider(anthropicAdapter);
}
