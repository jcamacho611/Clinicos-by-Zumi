import "server-only";

import {
  registerProvider,
  type ProviderAdapter,
  type ProviderRequest,
  type ProviderResult,
  type ZumiEnv,
  type ZumiExternalSource,
} from "@/features/zumi/providers";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5-mini";

function envInt(env: ZumiEnv, key: string, fallback = 0) {
  const value = Number.parseInt(env[key] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function estimateTokenCostMicroUsd(inputTokens: number, outputTokens: number, env: ZumiEnv) {
  const inputPerMillion = envInt(env, "ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS");
  const outputPerMillion = envInt(env, "ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS");
  return Math.round((inputTokens * inputPerMillion + outputTokens * outputPerMillion) / 1_000_000);
}

function collectText(output: unknown) {
  if (!Array.isArray(output)) return "";
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as { type?: unknown; content?: unknown };
    if (record.type !== "message" || !Array.isArray(record.content)) continue;
    for (const part of record.content) {
      if (!part || typeof part !== "object") continue;
      const content = part as { type?: unknown; text?: unknown };
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function collectSources(output: unknown): ZumiExternalSource[] {
  if (!Array.isArray(output)) return [];
  const byUrl = new Map<string, ZumiExternalSource>();

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as { type?: unknown; action?: unknown; content?: unknown };

    if (record.type === "web_search_call" && record.action && typeof record.action === "object") {
      const sources = (record.action as { sources?: unknown }).sources;
      if (Array.isArray(sources)) {
        for (const source of sources) {
          if (!source || typeof source !== "object") continue;
          const url = (source as { url?: unknown }).url;
          if (typeof url === "string" && /^https?:\/\//i.test(url)) byUrl.set(url, { url });
        }
      }
    }

    if (record.type === "message" && Array.isArray(record.content)) {
      for (const part of record.content) {
        if (!part || typeof part !== "object") continue;
        const annotations = (part as { annotations?: unknown }).annotations;
        if (!Array.isArray(annotations)) continue;
        for (const annotation of annotations) {
          if (!annotation || typeof annotation !== "object") continue;
          const typed = annotation as { type?: unknown; url?: unknown; title?: unknown };
          if (typed.type !== "url_citation" || typeof typed.url !== "string") continue;
          byUrl.set(typed.url, {
            url: typed.url,
            title: typeof typed.title === "string" ? typed.title : null,
          });
        }
      }
    }
  }

  return [...byUrl.values()];
}

function toolsFor(request: ProviderRequest, env: ZumiEnv) {
  const tools: Record<string, unknown>[] = [];
  const vectorStoreId = env.ZUMI_OPENAI_VECTOR_STORE_ID?.trim();

  if (request.allowKnowledgeSearch && vectorStoreId) {
    tools.push({ type: "file_search", vector_store_ids: [vectorStoreId] });
  }

  if (request.allowWebSearch) {
    const domains = request.allowedDomains?.map((domain) => domain.trim()).filter(Boolean) ?? [];
    tools.push({
      type: "web_search",
      ...(domains.length > 0 ? { filters: { allowed_domains: domains } } : {}),
      search_context_size: env.ZUMI_WEB_SEARCH_CONTEXT_SIZE ?? "medium",
    });
  }

  return tools;
}

export function createOpenAIProvider(env: ZumiEnv = process.env): ProviderAdapter {
  const modelId = env.ZUMI_OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  return {
    key: "openai",
    label: "OpenAI",
    modelId,
    requiredEnv: [
      "OPENAI_API_KEY",
      "ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS",
      "ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS",
    ],
    baaOnFile: env.OPENAI_BAA_ON_FILE === "1",
    async invoke(request): Promise<ProviderResult> {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

      const runtimeEnv: ZumiEnv = process.env;
      const tools = toolsFor(request, runtimeEnv);
      const payload: Record<string, unknown> = {
        model: process.env.ZUMI_OPENAI_MODEL?.trim() || modelId,
        instructions: request.system,
        input: request.prompt,
        max_output_tokens: request.maxOutputTokens,
        store: true,
        ...(request.previousResponseId ? { previous_response_id: request.previousResponseId } : {}),
        ...(tools.length > 0 ? {
          tools,
          tool_choice: "auto",
          max_tool_calls: Math.max(1, Math.min(envInt(runtimeEnv, "ZUMI_MAX_TOOL_CALLS", 4), 8)),
        } : {}),
      };

      const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: request.signal,
      });

      if (!response.ok) {
        const requestId = response.headers.get("x-request-id");
        throw new Error(`OpenAI Responses request failed (${response.status}${requestId ? `, ${requestId}` : ""}).`);
      }

      const data = await response.json() as {
        id?: string;
        model?: string;
        output?: unknown;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const inputTokens = Math.max(0, data.usage?.input_tokens ?? 0);
      const outputTokens = Math.max(0, data.usage?.output_tokens ?? 0);
      const text = collectText(data.output);
      if (!text) throw new Error("OpenAI returned no text output.");

      const sources = collectSources(data.output);
      const webSearchCalls = Array.isArray(data.output)
        ? data.output.filter((item) => item && typeof item === "object" && (item as { type?: unknown }).type === "web_search_call").length
        : 0;
      const webSearchCost = webSearchCalls * envInt(runtimeEnv, "ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL");

      return {
        text,
        inputTokens,
        outputTokens,
        costMicroUsd: estimateTokenCostMicroUsd(inputTokens, outputTokens, runtimeEnv) + webSearchCost,
        modelId: data.model ?? modelId,
        responseId: data.id ?? null,
        sources,
      };
    },
  };
}

export function registerOpenAIProvider(env: ZumiEnv = process.env) {
  return registerProvider(createOpenAIProvider(env));
}
