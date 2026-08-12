import fs from "node:fs/promises";
import path from "node:path";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

type CurriculumTopic = {
  topic: string;
  freshnessDays: number;
  allowedDomains: string[];
};

type Curriculum = {
  version: number;
  tracks: Array<{
    key: string;
    level: string;
    topics: CurriculumTopic[];
  }>;
};

type KnowledgeCapsule = {
  version: 1;
  topic: string;
  summary: string;
  claims: Array<{ text: string; confidence: "low" | "moderate" | "high"; sourceUrls: string[] }>;
  sources: Array<{ url: string; domain: string; title?: string | null; capturedAt: string }>;
  tags: string[];
  capturedAt: string;
  freshnessDays: number;
  supersedes: string[];
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function envInt(name: string, fallback?: number) {
  const raw = process.env[name]?.trim();
  if (!raw && fallback !== undefined) return fallback;
  const value = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
  return value;
}

function outputText(output: unknown) {
  if (!Array.isArray(output)) return "";
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as { type?: unknown; content?: unknown };
    if (record.type !== "message" || !Array.isArray(record.content)) continue;
    for (const part of record.content) {
      if (!part || typeof part !== "object") continue;
      const typed = part as { type?: unknown; text?: unknown };
      if (typed.type === "output_text" && typeof typed.text === "string") chunks.push(typed.text);
    }
  }
  return chunks.join("\n").trim();
}

function unwrapJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function assertCapsule(input: unknown, topic: CurriculumTopic): KnowledgeCapsule {
  if (!input || typeof input !== "object") throw new Error("Learning response was not an object.");
  const capsule = input as Partial<KnowledgeCapsule>;
  if (capsule.version !== 1 || typeof capsule.topic !== "string" || typeof capsule.summary !== "string") {
    throw new Error("Learning response did not match the knowledge capsule contract.");
  }
  if (!Array.isArray(capsule.claims) || capsule.claims.length === 0 || !Array.isArray(capsule.sources) || capsule.sources.length === 0) {
    throw new Error("Knowledge capsule must contain claims and sources.");
  }
  for (const claim of capsule.claims) {
    if (!claim || typeof claim.text !== "string" || !["low", "moderate", "high"].includes(claim.confidence) || !Array.isArray(claim.sourceUrls) || claim.sourceUrls.length === 0) {
      throw new Error("Knowledge capsule contains an invalid claim.");
    }
  }
  for (const source of capsule.sources) {
    if (!source || typeof source.url !== "string" || !/^https?:\/\//i.test(source.url) || typeof source.domain !== "string") {
      throw new Error("Knowledge capsule contains an invalid source.");
    }
  }
  return {
    version: 1,
    topic: capsule.topic,
    summary: capsule.summary,
    claims: capsule.claims as KnowledgeCapsule["claims"],
    sources: capsule.sources as KnowledgeCapsule["sources"],
    tags: Array.isArray(capsule.tags) ? capsule.tags.filter((tag): tag is string => typeof tag === "string") : [],
    capturedAt: typeof capsule.capturedAt === "string" ? capsule.capturedAt : new Date().toISOString(),
    freshnessDays: typeof capsule.freshnessDays === "number" ? capsule.freshnessDays : topic.freshnessDays,
    supersedes: Array.isArray(capsule.supersedes) ? capsule.supersedes.filter((id): id is string => typeof id === "string") : [],
  };
}

function renderCapsule(capsule: KnowledgeCapsule) {
  return [
    `# Zumi Knowledge Capsule: ${capsule.topic}`,
    "",
    `Captured: ${capsule.capturedAt}`,
    `Freshness window: ${capsule.freshnessDays} days`,
    `Tags: ${capsule.tags.join(", ") || "none"}`,
    "",
    "## Summary",
    capsule.summary,
    "",
    "## Claims",
    ...capsule.claims.map((claim, index) => `${index + 1}. [${claim.confidence}] ${claim.text}\n   Sources: ${claim.sourceUrls.join(", ")}`),
    "",
    "## Sources",
    ...capsule.sources.map((source, index) => `${index + 1}. ${source.url} — captured ${source.capturedAt}`),
  ].join("\n");
}

async function researchTopic(topic: CurriculumTopic, apiKey: string) {
  const model = process.env.ZUMI_LEARNING_MODEL?.trim() || process.env.ZUMI_OPENAI_MODEL?.trim() || "gpt-5-mini";
  const capturedAt = new Date().toISOString();
  const instruction = [
    "You are the controlled public-knowledge research process for Zumi, Klinikos Intelligence.",
    "Use web search to study only the requested public topic.",
    "Prefer primary, authoritative, current sources. Do not use patient data, PHI, secrets, private accounts, or private credentials.",
    "Return JSON only. Preserve exact source URLs. Do not invent citations. Record disagreement or uncertainty rather than smoothing it over.",
    "Use this exact object shape:",
    JSON.stringify({
      version: 1,
      topic: topic.topic,
      summary: "reusable summary",
      claims: [{ text: "claim", confidence: "high", sourceUrls: ["https://example.com"] }],
      sources: [{ url: "https://example.com", domain: "example.com", title: "source title", capturedAt }],
      tags: ["tag"],
      capturedAt,
      freshnessDays: topic.freshnessDays,
      supersedes: [],
    }),
  ].join("\n");

  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: instruction,
      input: topic.topic,
      tools: [{
        type: "web_search",
        filters: { allowed_domains: topic.allowedDomains },
        search_context_size: process.env.ZUMI_LEARNING_SEARCH_CONTEXT_SIZE?.trim() || "medium",
      }],
      tool_choice: "required",
      max_tool_calls: Math.max(1, Math.min(envInt("ZUMI_LEARNING_MAX_TOOL_CALLS", 4), 8)),
      max_output_tokens: Math.max(800, Math.min(envInt("ZUMI_LEARNING_MAX_OUTPUT_TOKENS", 2200), 5000)),
      store: false,
    }),
  });

  if (!response.ok) throw new Error(`Research request failed with HTTP ${response.status}.`);
  const data = await response.json() as { output?: unknown; usage?: { input_tokens?: number; output_tokens?: number } };
  const text = outputText(data.output);
  const capsule = assertCapsule(JSON.parse(unwrapJson(text)), topic);
  return {
    capsule,
    inputTokens: Math.max(0, data.usage?.input_tokens ?? 0),
    outputTokens: Math.max(0, data.usage?.output_tokens ?? 0),
    webSearchCalls: Array.isArray(data.output)
      ? data.output.filter((item) => item && typeof item === "object" && (item as { type?: unknown }).type === "web_search_call").length
      : 0,
  };
}

function estimateMicroUsd(inputTokens: number, outputTokens: number, webSearchCalls: number) {
  const inputRate = envInt("ZUMI_OPENAI_INPUT_MICRO_USD_PER_M_TOKENS");
  const outputRate = envInt("ZUMI_OPENAI_OUTPUT_MICRO_USD_PER_M_TOKENS");
  const searchRate = envInt("ZUMI_OPENAI_WEB_SEARCH_MICRO_USD_PER_CALL", 0);
  return Math.round((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000) + webSearchCalls * searchRate;
}

async function uploadCapsule(capsule: KnowledgeCapsule, apiKey: string, vectorStoreId: string) {
  const body = renderCapsule(capsule);
  const form = new FormData();
  form.set("purpose", "assistants");
  form.set("file", new Blob([body], { type: "text/markdown" }), `zumi-${Date.now()}.md`);

  const upload = await fetch(`${OPENAI_BASE_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!upload.ok) throw new Error(`Knowledge file upload failed with HTTP ${upload.status}.`);
  const file = await upload.json() as { id?: string };
  if (!file.id) throw new Error("Knowledge file upload returned no file ID.");

  const attach = await fetch(`${OPENAI_BASE_URL}/vector_stores/${vectorStoreId}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      file_id: file.id,
      attributes: {
        knowledge_type: "zumi_capsule",
        topic: capsule.topic.slice(0, 512),
        captured_at: capsule.capturedAt,
        freshness_days: capsule.freshnessDays,
      },
    }),
  });
  if (!attach.ok) throw new Error(`Vector-store attach failed with HTTP ${attach.status}.`);
  return file.id;
}

async function main() {
  const apiKey = requiredEnv("OPENAI_API_KEY");
  const vectorStoreId = requiredEnv("ZUMI_OPENAI_VECTOR_STORE_ID");
  const budget = envInt("ZUMI_LEARNING_BUDGET_MICRO_USD");
  const estimatedPerTopic = envInt("ZUMI_LEARNING_RESERVED_MICRO_USD_PER_TOPIC");
  const maxTopics = Math.max(1, Math.min(envInt("ZUMI_LEARNING_MAX_TOPICS_PER_RUN", 2), 10));
  if (budget <= 0 || estimatedPerTopic <= 0) throw new Error("Learning requires a positive per-run budget and per-topic reservation.");

  const curriculumPath = path.join(process.cwd(), "config", "zumi-learning-curriculum.json");
  const curriculum = JSON.parse(await fs.readFile(curriculumPath, "utf8")) as Curriculum;
  const topics = curriculum.tracks.flatMap((track) => track.topics);
  if (topics.length === 0) throw new Error("Zumi curriculum is empty.");

  const day = Math.floor(Date.now() / 86_400_000);
  const start = day % topics.length;
  const selected: CurriculumTopic[] = [];
  for (let i = 0; i < Math.min(maxTopics, topics.length); i += 1) selected.push(topics[(start + i) % topics.length]);

  let reserved = 0;
  let observed = 0;
  let learned = 0;
  for (const topic of selected) {
    if (reserved + estimatedPerTopic > budget) break;
    reserved += estimatedPerTopic;
    const result = await researchTopic(topic, apiKey);
    const actual = estimateMicroUsd(result.inputTokens, result.outputTokens, result.webSearchCalls);
    observed += actual;
    if (observed > budget) throw new Error("Observed learning cost exceeded the configured run budget. Stopping before another topic.");
    await uploadCapsule(result.capsule, apiKey, vectorStoreId);
    learned += 1;
    console.log(`[zumi-learn] learned topic ${learned}/${selected.length}: ${topic.topic}`);
  }

  console.log(`[zumi-learn] complete: ${learned} capsule(s), observed estimated cost ${observed} micro-USD, run budget ${budget} micro-USD.`);
}

main().catch((error) => {
  console.error(`[zumi-learn] ${error instanceof Error ? error.message : "unknown failure"}`);
  process.exitCode = 1;
});
