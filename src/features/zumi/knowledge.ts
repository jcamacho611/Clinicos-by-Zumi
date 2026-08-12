import "server-only";

import { z } from "zod";

export const zumiKnowledgeSourceSchema = z.object({
  url: z.string().url(),
  domain: z.string().trim().min(3).max(200),
  title: z.string().trim().min(1).max(300).optional().nullable(),
  capturedAt: z.string().datetime(),
});

export const zumiKnowledgeClaimSchema = z.object({
  text: z.string().trim().min(3).max(2_000),
  confidence: z.enum(["low", "moderate", "high"]),
  sourceUrls: z.array(z.string().url()).min(1).max(12),
});

export const zumiKnowledgeCapsuleSchema = z.object({
  version: z.literal(1),
  topic: z.string().trim().min(3).max(300),
  summary: z.string().trim().min(10).max(8_000),
  claims: z.array(zumiKnowledgeClaimSchema).min(1).max(40),
  sources: z.array(zumiKnowledgeSourceSchema).min(1).max(40),
  tags: z.array(z.string().trim().min(2).max(80)).max(30).default([]),
  capturedAt: z.string().datetime(),
  freshnessDays: z.number().int().min(1).max(3_650).default(30),
  supersedes: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
});

export type ZumiKnowledgeCapsule = z.infer<typeof zumiKnowledgeCapsuleSchema>;

export function knowledgeCapsuleIsFresh(capsule: ZumiKnowledgeCapsule, now = new Date()) {
  const captured = new Date(capsule.capturedAt).getTime();
  const ageMs = now.getTime() - captured;
  return ageMs >= 0 && ageMs <= capsule.freshnessDays * 24 * 60 * 60 * 1_000;
}

export function renderKnowledgeCapsule(capsuleInput: ZumiKnowledgeCapsule) {
  const capsule = zumiKnowledgeCapsuleSchema.parse(capsuleInput);
  const sourceLines = capsule.sources.map((source, index) => `${index + 1}. ${source.url} — captured ${source.capturedAt}`);
  const claimLines = capsule.claims.map((claim, index) => `${index + 1}. [${claim.confidence}] ${claim.text}\n   Sources: ${claim.sourceUrls.join(", ")}`);
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
    ...claimLines,
    "",
    "## Sources",
    ...sourceLines,
  ].join("\n");
}

export function buildZumiLearningInstruction(input: {
  topic: string;
  freshnessDays: number;
}) {
  return [
    "You are the public-knowledge research process for Zumi, Klinikos Intelligence.",
    "Research the requested topic using the available public web-search tool.",
    "Do not use or request patient information, PHI, private credentials, secrets, or private account data.",
    "Prefer primary and authoritative sources. Distinguish facts from interpretation. Preserve source URLs.",
    "If sources disagree, record the disagreement instead of forcing certainty.",
    "Return JSON only, matching this shape exactly:",
    JSON.stringify({
      version: 1,
      topic: input.topic,
      summary: "concise reusable summary",
      claims: [{ text: "claim", confidence: "high", sourceUrls: ["https://example.com"] }],
      sources: [{ url: "https://example.com", domain: "example.com", title: "source title", capturedAt: new Date().toISOString() }],
      tags: ["tag"],
      capturedAt: new Date().toISOString(),
      freshnessDays: input.freshnessDays,
      supersedes: [],
    }),
  ].join("\n");
}
