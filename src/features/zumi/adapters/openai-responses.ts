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

type OpenAIConfig = {
  apiKey: string;
  model: string;
  inputMicroUsdPerMillionTokens: number | null;
  outputMicroUsdPerMillionTokens: number | null;
  webSearchMicroUsdPerCall: number | null;
  fileSearchMicroUsdPerCall: number | null;
  codeInterpreterMicroUsdPerSession: number | null;
  vectorStoreId: string;
  codeInterpreterEnabled: boolean;
  webSearchContextSize: string;
  baaOnFile: boolean;
};

function configuredValue(env: ZumiEnv, name: string) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

function positiveEnvInt(env: ZumiEnv, key: string) {
  const value = Number.parseInt(env[key] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function validatedTokenRates(config: OpenAIConfig) {
  if (config.inputMicroUsdPerMillionTokens == null || config.outputMicroUsdPerMillionTokens == null) {
    throw new Error("OpenAI token pricing must be configured as positive integer micro-USD rates before paid inference can execute.");
  }
  return {
    inputMicroUsdPerMillionTokens: config.inputMicroUsdPerMillionTokens,
    outputMicroUsdPerMillionTokens: config.outputMicroUsdPerMillionTokens,
  };
}

function estimateTokenCostMicroUsd(inputTokens: number, outputTokens: number, config: OpenAIConfig) {
  const rates = validatedTokenRates(config);
  return Math.round((
    inputTokens * rates.inputMicroUsdPerMillionTokens +
    outputTokens * rates.outputMicroUsdPerMillionTokens
  ) / 1_000_000);
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

function countToolCalls(output: unknown, fragment: "web_search" | "file_search" | "code_interpreter") {
  if (!Array.isArray(output)) return 0;
  return output.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const type = (item as { type?: unknown }).type;
    return typeof type === "string" && type.includes(fragment);
  }).length;
}

function validateExecutionCostConfiguration(request: ProviderRequest, config: OpenAIConfig) {
  validatedTokenRates(config);
  if (request.allowWebSearch && config.webSearchMicroUsdPerCall == null) {
    throw new Error("ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL is required before OpenAI web search can be enabled.");
  }
  if (request.allowKnowledgeSearch && config.vectorStoreId && config.fileSearchMicroUsdPerCall == null) {
    throw new Error("ZUMI_OPENAI_FILE_SEARCH_MICRO_USD_PER_CALL is required before OpenAI file search can be enabled.");
  }
  if (request.allowCodeInterpreter && config.codeInterpreterEnabled && config.codeInterpreterMicroUsdPerSession == null) {
    throw new Error("ZUMI_OPENAI_CODE_INTERPRETER_MICRO_USD_PER_SESSION is required before OpenAI Code Interpreter can be enabled.");
  }
}

function toolsFor(request: ProviderRequest, config: OpenAIConfig) {
  validateExecutionCostConfiguration(request, config);
  const tools: Record<string, unknown>[] = [];

  if (request.allowKnowledgeSearch && config.vectorStoreId) {
    tools.push({ type: "file_search", vector_store_ids: [config.vectorStoreId] });
  }

  if (request.allowWebSearch) {
    const domains = request.allowedDomains?.map((domain) => domain.trim()).filter(Boolean) ?? [];
    tools.push({
      type: "web_search",
      ...(domains.length > 0 ? { filters: { allowed_domains: domains } } : {}),
      search_context_size: config.webSearchContextSize || "medium",
    });
  }

  if (request.allowCodeInterpreter && config.codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  return tools;
}

function toolCostMicroUsd(output: unknown, config: OpenAIConfig) {
  const webSearchCalls = countToolCalls(output, "web_search");
  const fileSearchCalls = countToolCalls(output, "file_search");
  const codeInterpreterCalls = countToolCalls(output, "code_interpreter");

  const webSearchCost = webSearchCalls * (config.webSearchMicroUsdPerCall ?? 0);
  const fileSearchCost = fileSearchCalls * (config.fileSearchMicroUsdPerCall ?? 0);
  const codeInterpreterCost = codeInterpreterCalls > 0 ? (config.codeInterpreterMicroUsdPerSession ?? 0) : 0;

  return webSearchCost + fileSearchCost + codeInterpreterCost;
}

export function createOpenAIResponsesAdapter(env: ZumiEnv = process.env): ProviderAdapter {
  const config: OpenAIConfig = {
    apiKey: configuredValue(env, "OPENAI_API_KEY"),
    model: configuredValue(env, "ZUMI_OPENAI_MODEL"),
    inputMicroUsdPerMillionTokens: positiveEnvInt(env, "ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS"),
    outputMicroUsdPerMillionTokens: positiveEnvInt(env, "ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS"),
    webSearchMicroUsdPerCall: positiveEnvInt(env, "ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL"),
    fileSearchMicroUsdPerCall: positiveEnvInt(env, "ZUMI_OPENAI_FILE_SEARCH_MICRO_USD_PER_CALL"),
    codeInterpreterMicroUsdPerSession: positiveEnvInt(env, "ZUMI_OPENAI_CODE_INTERPRETER_MICRO_USD_PER_SESSION"),
    vectorStoreId: configuredValue(env, "ZUMI_OPENAI_VECTOR_STORE_ID"),
    codeInterpreterEnabled: configuredValue(env, "ZUMI_OPENAI_CODE_INTERPRETER") === "1",
    webSearchContextSize: configuredValue(env, "ZUMI_WEB_SEARCH_CONTEXT_SIZE") || "medium",
    baaOnFile: configuredValue(env, "OPENAI_BAA_ON_FILE") === "1",
  };
  const modelId = config.model || "openai-unconfigured";

  return {
    key: "openai",
    label: "OpenAI Responses",
    modelId,
    requiredEnv: REQUIRED_ENV,
    baaOnFile: config.baaOnFile,
    async invoke(request): Promise<ProviderResult> {
      if (!config.apiKey || !config.model) throw new Error("OpenAI Zumi adapter is not configured.");

      const tools = toolsFor(request, config);
      const payload: Record<string, unknown> = {
        model: config.model,
        instructions: request.system,
        input: request.prompt,
        max_output_tokens: request.maxOutputTokens,
        // Authenticated callers preserve the existing retained-response default. Public
        // anonymous callers explicitly pass false because they do not need provider-native
        // continuation and should not retain a response merely to support it.
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
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
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
      return {
        text,
        inputTokens,
        outputTokens,
        costMicroUsd: estimateTokenCostMicroUsd(inputTokens, outputTokens, config) + toolCostMicroUsd(data.output, config),
        modelId: data.model ?? config.model,
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
