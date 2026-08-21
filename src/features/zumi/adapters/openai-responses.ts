import type {
  ProviderAdapter,
  ProviderRequest,
  ProviderResult,
  ZumiEnv,
  ZumiExternalSource,
} from "@/features/zumi/providers";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const REQUIRED_ENV = [
  "OPENAI_API_KEY",
  "ZUMI_OPENAI_MODEL",
  "ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS",
  "ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS",
] as const;

function configuredValue(env: ZumiEnv, name: string) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

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

function collectToolsUsed(output: unknown) {
  if (!Array.isArray(output)) return [];
  const types = new Set<string>();
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const type = (item as { type?: unknown }).type;
    if (typeof type !== "string") continue;
    if (type.includes("web_search")) types.add("web_search");
    if (type.includes("file_search")) types.add("file_search");
    if (type.includes("code_interpreter")) types.add("code_interpreter");
    if (type.includes("mcp")) types.add("mcp");
    if (type.includes("function")) types.add("function");
  }
  return [...types];
}

function toolsFor(request: ProviderRequest, env: ZumiEnv) {
  const tools: Record<string, unknown>[] = [];
  const vectorStoreId = configuredValue(env, "ZUMI_OPENAI_VECTOR_STORE_ID");

  if (request.allowKnowledgeSearch && vectorStoreId) {
    tools.push({ type: "file_search", vector_store_ids: [vectorStoreId] });
  }

  if (request.allowWebSearch) {
    const domains = request.allowedDomains?.map((domain) => domain.trim()).filter(Boolean) ?? [];
    tools.push({
      type: "web_search",
      ...(domains.length > 0 ? { filters: { allowed_domains: domains } } : {}),
      search_context_size: configuredValue(env, "ZUMI_WEB_SEARCH_CONTEXT_SIZE") || "medium",
    });
  }

  if (request.allowCodeInterpreter && configuredValue(env, "ZUMI_OPENAI_CODE_INTERPRETER") === "1") {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  return tools;
}

export function createOpenAIResponsesAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const modelId = configuredValue(env, "ZUMI_OPENAI_MODEL") || "openai-unconfigured";
  return {
    key: "openai",
    label: "OpenAI Responses",
    modelId,
    requiredEnv: REQUIRED_ENV,
    baaOnFile: configuredValue(env, "OPENAI_BAA_ON_FILE") === "1",
    async invoke(request): Promise<ProviderResult> {
      const runtimeEnv: ZumiEnv = process.env;
      const apiKey = configuredValue(runtimeEnv, "OPENAI_API_KEY");
      const model = configuredValue(runtimeEnv, "ZUMI_OPENAI_MODEL");
      if (!apiKey || !model) throw new Error("OpenAI Zumi adapter is not configured.");

      const tools = toolsFor(request, runtimeEnv);
      const payload: Record<string, unknown> = {
        model,
        instructions: request.system,
        input: request.prompt,
        max_output_tokens: request.maxOutputTokens,
        // Authenticated callers preserve the existing retained-response default. Public
        // anonymous callers explicitly pass false so this request is not retained merely
        // to support provider-native continuation they do not use.
        store: request.storeResponse ?? true,
        ...(request.previousResponseId ? { previous_response_id: request.previousResponseId } : {}),
        ...(tools.length > 0 ? {
          tools,
          tool_choice: "auto",
          max_tool_calls: Math.max(1, Math.min(request.maxToolCalls ?? 4, 12)),
          include: ["web_search_call.action.sources"],
        } : {}),
      };

      const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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

      const toolsUsed = collectToolsUsed(data.output);
      const webSearchCalls = toolsUsed.includes("web_search")
        ? (Array.isArray(data.output)
            ? data.output.filter((item) => item && typeof item === "object" && String((item as { type?: unknown }).type).includes("web_search")).length
            : 0)
        : 0;
      const webSearchCost = webSearchCalls * envInt(runtimeEnv, "ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL");

      return {
        text,
        inputTokens,
        outputTokens,
        costMicroUsd: estimateTokenCostMicroUsd(inputTokens, outputTokens, runtimeEnv) + webSearchCost,
        modelId: data.model ?? model,
        responseId: data.id ?? null,
        sources: collectSources(data.output),
        toolsUsed,
      };
    },
  };
}

export function openAIResponsesRequested(env: ZumiEnv = process.env) {
  return configuredValue(env, "ZUMI_PROVIDER") === "openai" || REQUIRED_ENV.some((name) => configuredValue(env, name).length > 0);
}