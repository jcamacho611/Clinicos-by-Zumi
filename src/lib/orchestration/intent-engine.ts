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
    phrases: ["extra work", "pick up shifts", "pick up a shift", "work friday", "weekend work", "available friday", "available saturday", "healthcare work"],
    outcome: "Find eligible healthcare work that fits professional readiness and availability.",
  },
  {
    pathId: "become-grid-ready",
    actor: "learner" as const,
    phrases: ["become an injector", "graduated nursing school", "new rn", "become grid ready", "grid-ready", "learn aesthetics", "qualify for grid", "injector training", "learn next"],
    outcome: "Map learning, competency, professional readiness, and the requirements for eligible injector opportunities.",
  },
  {
    pathId: "student-clinical-placement",
    actor: "learner" as const,
    phrases: ["clinical placement", "need a preceptor", "find a preceptor", "find me a preceptor", "clinical hours", "get placed", "student placement"],
    outcome: "Move from learner readiness into governed clinical placement capacity without implying guaranteed placement.",
  },
  {
    pathId: "clinician-independent-practice",
    actor: "professional" as const,
    phrases: ["work independently", "independent practitioner", "independent practice", "become independent", "open my own practice", "my own practice"],
    outcome: "Map the professional, business, and operating requirements for independent practice.",
  },
  {
    pathId: "provider-to-clinic-owner",
    actor: "professional" as const,
    phrases: ["own a clinic", "clinic owner", "start a healthcare business", "start my own practice"],
    outcome: "Move from provider practice into a governed clinic ownership and operating path.",
  },
  {
    pathId: "fill-staffing-need",
    actor: "clinic" as const,
    phrases: ["need an injector", "need a nurse", "need staff", "need coverage", "staffing gap", "coverage saturday", "coverage friday", "find coverage", "coverage for"],
    outcome: "Fill a clinic staffing or professional-capacity need with an eligible available match.",
  },
  {
    pathId: "clinic-monetize-capacity",
    actor: "clinic" as const,
    phrases: ["empty room", "unused room", "unused space", "unused capacity", "monetize capacity", "monetize my space", "what can my clinic sell"],
    outcome: "Turn legitimate unused clinic capacity into governed Grid supply and transaction visibility.",
  },
  {
    pathId: "clinic-operational-optimization",
    actor: "clinic" as const,
    phrases: ["clinic is disorganized", "fix our workflow", "dropping follow ups", "dropping follow-ups", "optimize our clinic", "operational problems"],
    outcome: "Turn recurring clinic friction into owned operating work and measurable follow-through.",
  },
  {
    pathId: "clinic-add-service",
    actor: "clinic" as const,
    phrases: ["add a service", "new service", "add a treatment", "expand what my clinic offers", "new treatment"],
    outcome: "Map a new clinic service through requirements, capacity, workflow, and launch readiness.",
  },
  {
    pathId: "clinic-improve-revenue",
    actor: "operations" as const,
    phrases: ["losing money", "improve revenue", "unpaid balances", "revenue leakage", "money delayed", "why are we losing money"],
    outcome: "Find where revenue is delayed or lost and route each blocker to an owned next action.",
  },
  {
    pathId: "clinic-expand-locations",
    actor: "clinic" as const,
    phrases: ["second location", "expand locations", "add another clinic", "multi location", "multi-location"],
    outcome: "Map a second location into a separate but connected governed operating context.",
  },
  {
    pathId: "fix-referral-leakage",
    actor: "operations" as const,
    phrases: ["referral", "losing patients", "stuck referrals", "open loops", "referral leakage", "missing results"],
    outcome: "Find and close unresolved referral and follow-up loops.",
  },
  {
    pathId: "organization-education-partner",
    actor: "clinic" as const,
    phrases: ["want students", "education partner", "offer clinical placements", "host trainees", "host students"],
    outcome: "Prepare real organizational learning capacity for governed education participation.",
  },
  {
    pathId: "school-placement-network",
    actor: "learner" as const,
    phrases: ["school needs placements", "sites for our students", "placement network", "our students need clinical sites"],
    outcome: "Connect institutional learner demand with governed placement capacity and agreements.",
  },
  {
    pathId: "educator-preceptor-opportunity",
    actor: "professional" as const,
    phrases: ["be a preceptor", "teach students", "teaching opportunities", "preceptor opportunity"],
    outcome: "Map teaching readiness and availability into eligible education opportunities.",
  },
  {
    pathId: "grid-higher-value-opportunity",
    actor: "professional" as const,
    phrases: ["better opportunities", "higher paying work", "higher-value work", "advance on grid", "grow my grid career"],
    outcome: "Use verified readiness, experience, and availability to find higher-value eligible opportunities.",
  },
  {
    pathId: "patient-find-care",
    actor: "patient" as const,
    phrases: ["need a service", "find me a clinic", "need an appointment", "where should i go for care", "looking for care"],
    outcome: "Guide the person to an appropriate patient-safe care or service entry point.",
  },
  {
    pathId: "launch-another-organization",
    actor: "clinic" as const,
    phrases: ["launch another organization", "start another clinic", "create a new healthcare company", "another organization"],
    outcome: "Define a separate governed organization context without carrying tenant assumptions across boundaries.",
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
