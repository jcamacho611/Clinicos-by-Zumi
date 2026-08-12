import { z } from "zod";

export const zumiResearchDepths = ["direct", "research", "deep"] as const;
export type ZumiResearchDepth = (typeof zumiResearchDepths)[number];

export type ResearchComplexity = {
  score: number;
  depth: ZumiResearchDepth;
  reasons: string[];
};

const CURRENTNESS = /\b(today|current|currently|latest|recent|now|price|law|rule|regulation|schedule|available|availability|version|release|update|news)\b/i;
const QUANTITATIVE = /\b(calculate|compute|estimate|compare|probability|percent|percentage|rate|cost|revenue|forecast|model|statistics?|statistical|optimi[sz]e)\b/i;
const HIGH_STAKES = /\b(medical|clinical|diagnosis|treatment|drug|medication|legal|lawsuit|contract|tax|financial advice|credential|license|compliance|HIPAA|insurance coverage|security|breach|incident)\b/i;
const MULTI_SOURCE = /\b(compare|versus|vs\.?|evidence|prove|verify|sources?|research|why|tradeoffs?|best option|recommend|audit)\b/i;
const BUILD = /\b(code|debug|architecture|system design|API|database|security|implementation|build|integrate|deploy|repository)\b/i;

export function estimateResearchComplexity(question: string): ResearchComplexity {
  let score = 0;
  const reasons: string[] = [];
  const normalized = question.trim();

  if (normalized.length > 500) { score += 1; reasons.push("long_or_multi-part_question"); }
  if (CURRENTNESS.test(normalized)) { score += 2; reasons.push("time_sensitive"); }
  if (QUANTITATIVE.test(normalized)) { score += 2; reasons.push("computation_or_comparison"); }
  if (HIGH_STAKES.test(normalized)) { score += 3; reasons.push("high_stakes_domain"); }
  if (MULTI_SOURCE.test(normalized)) { score += 2; reasons.push("multi_source_verification"); }
  if (BUILD.test(normalized)) { score += 2; reasons.push("technical_or_build_work"); }
  if ((normalized.match(/[?]/g) ?? []).length > 1) { score += 1; reasons.push("multiple_questions"); }

  return { score, depth: score >= 5 ? "deep" : score >= 2 ? "research" : "direct", reasons };
}

export const zumiResearchPlanSchema = z.object({
  question: z.string().trim().min(3).max(8_000),
  unknowns: z.array(z.string().trim().min(2).max(500)).max(20),
  searches: z.array(z.object({
    query: z.string().trim().min(2).max(500),
    purpose: z.string().trim().min(2).max(500),
    preferredDomains: z.array(z.string().trim().min(3).max(200)).max(20).default([]),
  })).max(20),
  computations: z.array(z.object({
    task: z.string().trim().min(2).max(1_000),
    why: z.string().trim().min(2).max(500),
  })).max(10).default([]),
  verificationQuestions: z.array(z.string().trim().min(2).max(500)).max(20),
  stopConditions: z.array(z.string().trim().min(2).max(500)).max(10),
});

export type ZumiResearchPlan = z.infer<typeof zumiResearchPlanSchema>;

export function buildResearchPlannerInstruction(question: string) {
  return [
    "You are Zumi's research planner. Do not answer the user's question yet.",
    "Identify what must be known, which evidence would resolve it, which tools/calculations may help, and how the answer should be verified.",
    "Prefer authoritative primary sources for consequential or current claims.",
    "Do not expose hidden chain-of-thought. Return only a concise operational research plan as JSON.",
    `Question: ${question}`,
    "Return JSON matching: {question, unknowns[], searches:[{query,purpose,preferredDomains[]}], computations:[{task,why}], verificationQuestions[], stopConditions[]}.",
  ].join("\n");
}

export function buildResearchCriticInstruction(input: { question: string; draft: string }) {
  return [
    "You are Zumi's verification critic.",
    "Audit the draft for unsupported claims, stale facts, missing perspectives, calculation mistakes, ambiguous wording, source-quality problems, and conclusions stronger than the evidence.",
    "Do not reveal hidden chain-of-thought. Return VERIFIED, NEEDS_MORE_RESEARCH, or FAIL plus only actionable gaps.",
    `Original question: ${input.question}`,
    `Draft answer:\n${input.draft}`,
  ].join("\n\n");
}
