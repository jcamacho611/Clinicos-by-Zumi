import { z } from "zod";
import type { StructuredIntent } from "@/lib/orchestration/contracts";

const structuredIntentSchema = z.object({
  raw: z.string(),
  actor: z.enum(["professional", "learner", "clinic", "operations", "patient", "unknown"]),
  goal: z.string(),
  outcome: z.string(),
  timing: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  constraints: z.array(z.string()),
  candidatePathIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  requiresClarification: z.boolean(),
  clarificationQuestions: z.array(z.string()),
});

const rules = [
  {
    pathId: "find-extra-work",
    actor: "professional" as const,
    phrases: ["extra work", "healthcare work", "pick up shifts", "pick up a shift", "work friday", "weekend work", "available friday", "available saturday"],
    outcome: "Find eligible healthcare work that fits professional readiness and availability.",
  },
  {
    pathId: "become-grid-ready",
    actor: "learner" as const,
    phrases: ["become an injector", "become grid ready", "grid-ready", "training", "learn aesthetics", "learn next", "qualify for grid", "build my skills"],
    outcome: "Build the education, competency, and credential readiness needed for Grid participation.",
  },
  {
    pathId: "fill-staffing-need",
    actor: "clinic" as const,
    phrases: ["need an injector", "need a nurse", "need staff", "need coverage", "find coverage", "coverage for", "staffing gap", "coverage saturday", "coverage friday"],
    outcome: "Fill a clinic staffing or professional-capacity need with an eligible available match.",
  },
  {
    pathId: "fix-referral-leakage",
    actor: "operations" as const,
    phrases: ["referral", "losing patients", "stuck referrals", "open loops", "referral leakage", "missing results"],
    outcome: "Find and close unresolved referral and follow-up loops.",
  },
] as const;

const timePatterns = [
  /\b(today|tomorrow|tonight|this morning|this afternoon|this evening)\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(this week|next week|this weekend|next weekend)\b/i,
  /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i,
];

const locationPatterns = [
  /\bin\s+([A-Z][A-Za-z .'-]{2,40})(?=\s+(?:on|at|this|next|today|tomorrow|for)\b|[,.!?]|$)/,
  /\bnear\s+([A-Z][A-Za-z .'-]{2,40})(?=\s+(?:on|at|this|next|today|tomorrow|for)\b|[,.!?]|$)/,
];

function extractFirst(input: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1].trim();
    if (match?.[0]) return match[0].trim();
  }
  return null;
}

function extractConstraints(input: string) {
  const constraints: string[] = [];
  const normalized = input.toLowerCase();
  if (normalized.includes("insurance")) constraints.push("insurance");
  if (normalized.includes("within ") || normalized.includes("miles")) constraints.push("distance");
  if (normalized.includes("weekend")) constraints.push("weekend");
  if (normalized.includes("only")) constraints.push("explicit limitation");
  if (normalized.includes("under $") || normalized.includes("budget")) constraints.push("budget");
  return constraints;
}

export function resolveIntentDeterministically(rawInput: string): StructuredIntent {
  const raw = rawInput.trim();
  const normalized = raw.toLowerCase();
  const matches = rules
    .map((rule) => ({ rule, hits: rule.phrases.filter((phrase) => normalized.includes(phrase)).length }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const winner = matches[0]?.rule;
  const timing = extractFirst(raw, timePatterns);
  const location = extractFirst(raw, locationPatterns);
  const candidatePathIds = matches.map((entry) => entry.rule.pathId);
  const ambiguous = matches.length > 1 && matches[0].hits === matches[1].hits;

  const result: StructuredIntent = {
    raw,
    actor: winner?.actor ?? "unknown",
    goal: raw || "Unknown goal",
    outcome: winner?.outcome ?? "Clarify the desired healthcare outcome before choosing a Path.",
    timing,
    location,
    constraints: extractConstraints(raw),
    candidatePathIds,
    confidence: winner ? Math.min(0.98, 0.55 + (matches[0]?.hits ?? 1) * 0.12) : 0.2,
    requiresClarification: !winner || ambiguous,
    clarificationQuestions: !winner
      ? ["What outcome are you trying to reach: run care, find work, learn, get care, or something else?"]
      : ambiguous
        ? ["I found more than one possible Path. Which outcome matters most right now?"]
        : [],
  };

  return structuredIntentSchema.parse(result);
}

/**
 * Validate any model-produced intent before the application is allowed to use it.
 * Authorization and eligibility are intentionally outside this schema and remain
 * deterministic application decisions.
 */
export function validateStructuredIntent(input: unknown) {
  return structuredIntentSchema.safeParse(input);
}

export type StructuredIntentInput = z.infer<typeof structuredIntentSchema>;
