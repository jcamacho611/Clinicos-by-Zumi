import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ZumiContextDomain } from "@/features/zumi/context-router";
import type { ZumiConversationPolicy } from "@/features/zumi/conversation-policy";

export type CanonicalContextDocument = {
  path: string;
  visibility: "customer_safe" | "founder";
  domains: ZumiContextDomain[];
  priority: number;
};

const DOCUMENTS: readonly CanonicalContextDocument[] = [
  { path: "docs/KLINIKOS_MASTER_CANON.md", visibility: "founder", domains: ["canon", "product_status", "grid", "clinic_operations", "clinical_workflows", "commercial", "education", "engineering", "security", "integrations", "compliance", "sales"], priority: 120 },
  { path: "docs/KLINIKOS_AUTHORITY_MAP.yaml", visibility: "founder", domains: ["canon", "product_status", "grid", "clinic_operations", "clinical_workflows", "commercial", "education", "engineering", "security", "integrations", "compliance"], priority: 115 },
  { path: "docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md", visibility: "customer_safe", domains: ["canon", "product_status", "grid", "clinic_operations", "clinical_workflows", "commercial", "education"], priority: 100 },
  { path: "docs/ZUMI_AMBIENT_INTELLIGENCE.md", visibility: "founder", domains: ["canon", "engineering", "security", "integrations", "grid", "clinic_operations", "commercial"], priority: 90 },
  { path: "docs/KLINIKOS_CONSTITUTION.md", visibility: "founder", domains: ["engineering", "security", "compliance"], priority: 80 },
  { path: "docs/KLINIKOS_ARCHITECTURE_INDEX.md", visibility: "founder", domains: ["engineering", "integrations", "security", "grid", "clinic_operations"], priority: 75 },
  { path: "docs/FEATURE_STATUS.md", visibility: "founder", domains: ["product_status", "engineering", "integrations"], priority: 70 },
  { path: "docs/EXTERNAL_DEPENDENCY_MATRIX.md", visibility: "founder", domains: ["integrations", "engineering", "commercial", "security"], priority: 70 },
  { path: "docs/CLINICAL_SAFETY.md", visibility: "founder", domains: ["clinical_workflows", "security", "compliance"], priority: 70 },
  { path: "docs/GRID_TRANSACTION_FLOW.md", visibility: "founder", domains: ["grid", "commercial", "engineering"], priority: 65 },
  { path: "docs/KLINIKOS_EDU_PRODUCT_SPEC.md", visibility: "founder", domains: ["education", "grid", "engineering"], priority: 65 },
  { path: "docs/CUSTOMER_FUNDED_ACCESS_MODEL.md", visibility: "founder", domains: ["commercial", "sales", "integrations"], priority: 60 },
  { path: "docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md", visibility: "founder", domains: ["product_status", "engineering", "clinic_operations", "commercial"], priority: 40 },
] as const;

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "what", "when", "where", "which", "will", "would", "could", "should", "have", "has", "had", "about", "into", "your", "you", "our", "their", "they", "them", "are", "was", "were", "how", "why", "who", "can", "not", "but", "all", "any",
]);

function tokens(text: string) {
  return new Set(
    text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g)?.filter((token) => !STOP_WORDS.has(token)) ?? [],
  );
}

function splitSections(content: string) {
  const lines = content.split(/\r?\n/);
  const sections: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^#{1,4}\s+/.test(line) && current.length) {
      sections.push(current.join("\n").trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current.join("\n").trim());
  return sections.filter((section) => section.length >= 30);
}

function sectionScore(section: string, queryTokens: Set<string>, doc: CanonicalContextDocument) {
  const sectionTokens = tokens(section);
  let overlap = 0;
  for (const token of queryTokens) if (sectionTokens.has(token)) overlap += 1;
  const headingBonus = /^#{1,4}\s+/m.test(section) ? 1 : 0;
  return overlap * 10 + headingBonus + doc.priority / 100;
}

function visible(doc: CanonicalContextDocument, policy: ZumiConversationPolicy) {
  if (doc.visibility === "customer_safe") return true;
  return policy.profile === "founder" && policy.internalStrategyAllowed;
}

export type CanonicalContextResult = {
  text: string;
  sources: string[];
  truncated: boolean;
};

/**
 * Lightweight local retrieval so deep Klinikos conversations work before a vector
 * store exists. The retrieval corpus is a fixed allowlist, so a user cannot turn a
 * question into arbitrary filesystem access.
 */
export async function retrieveCanonicalContext(input: {
  question: string;
  domains: readonly ZumiContextDomain[];
  policy: ZumiConversationPolicy;
  maxCharacters?: number;
  maxSections?: number;
}): Promise<CanonicalContextResult> {
  const maxCharacters = Math.max(2_000, Math.min(input.maxCharacters ?? 12_000, 24_000));
  const maxSections = Math.max(2, Math.min(input.maxSections ?? 12, 24));
  const domainSet = new Set(input.domains);
  const queryTokens = tokens(input.question);
  const candidates: { score: number; path: string; section: string }[] = [];

  for (const doc of DOCUMENTS) {
    if (!visible(doc, input.policy)) continue;
    if (!doc.domains.some((domain) => domainSet.has(domain))) continue;

    const absolute = path.join(process.cwd(), doc.path);
    const content = await readFile(absolute, "utf8").catch(() => null);
    if (!content) continue;
    for (const section of splitSections(content)) {
      const score = sectionScore(section, queryTokens, doc);
      if (score <= 1) continue;
      candidates.push({ score, path: doc.path, section });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const selected: string[] = [];
  const sources = new Set<string>();
  let used = 0;
  let truncated = false;

  for (const candidate of candidates.slice(0, maxSections * 3)) {
    const block = `[SOURCE ${candidate.path}]\n${candidate.section}`;
    if (used + block.length > maxCharacters) {
      truncated = true;
      continue;
    }
    selected.push(block);
    sources.add(candidate.path);
    used += block.length;
    if (selected.length >= maxSections) break;
  }

  return {
    text: selected.join("\n\n---\n\n"),
    sources: [...sources],
    truncated,
  };
}

export function canonicalContextManifest() {
  return DOCUMENTS.map((document) => ({ ...document }));
}
