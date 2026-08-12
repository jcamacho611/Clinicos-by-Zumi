import "server-only";

import type { ZumiStrategyCapsule } from "@/features/zumi/research-strategy";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

function renderStrategy(capsule: ZumiStrategyCapsule) {
  return [
    `# Zumi Strategy Capsule: ${capsule.taskPattern}`,
    "",
    `Captured: ${capsule.capturedAt}`,
    `Observed quality: ${capsule.observedQuality}`,
    `Reuse until: ${capsule.reuseUntil ?? "no fixed expiration"}`,
    "",
    "## Successful approach",
    ...capsule.successfulApproach.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Preferred source types",
    ...capsule.preferredSourceTypes.map((source) => `- ${source}`),
    "",
    "## Useful tools",
    ...capsule.usefulTools.map((tool) => `- ${tool}`),
    "",
    "## Failure modes",
    ...capsule.failureModes.map((failure) => `- ${failure}`),
    "",
    "## Verification pattern",
    ...capsule.verificationPattern.map((check) => `- ${check}`),
  ].join("\n");
}

export async function persistZumiStrategy(capsule: ZumiStrategyCapsule, env = process.env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const vectorStoreId = env.ZUMI_OPENAI_VECTOR_STORE_ID?.trim();
  if (!apiKey || !vectorStoreId) return { persisted: false as const, reason: "knowledge_store_not_configured" as const };

  const form = new FormData();
  form.set("purpose", "assistants");
  form.set("file", new Blob([renderStrategy(capsule)], { type: "text/markdown" }), `zumi-strategy-${Date.now()}.md`);

  const upload = await fetch(`${OPENAI_BASE_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!upload.ok) return { persisted: false as const, reason: "upload_failed" as const };
  const file = await upload.json() as { id?: string };
  if (!file.id) return { persisted: false as const, reason: "upload_missing_id" as const };

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
        knowledge_type: "zumi_strategy",
        task_pattern: capsule.taskPattern.slice(0, 512),
        observed_quality: capsule.observedQuality,
        captured_at: capsule.capturedAt,
      },
    }),
  });
  if (!attach.ok) return { persisted: false as const, reason: "attach_failed" as const };
  return { persisted: true as const, fileId: file.id };
}
