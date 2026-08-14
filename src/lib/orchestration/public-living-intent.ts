import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

export type PublicLivingDestination = {
  key: "clinic" | "grid" | "edu" | "patient" | "referrals" | "staffing";
  href: string;
  action: string;
};

export type PublicLivingResolution = {
  title: string;
  body: string;
  assumption: string | null;
  destination: PublicLivingDestination | null;
  confidence: number;
};

type PublicRule = {
  destination: PublicLivingDestination;
  patterns: readonly RegExp[];
  title: string;
  body: string;
  assumption: string;
};

const publicRules: readonly PublicRule[] = [
  {
    destination: { key: "staffing", href: "/grid", action: "Find capacity" },
    patterns: [
      /\b(?:hire|hiring|staff|staffing|coverage)\b/i,
      /\b(?:need|find)\s+(?:an?\s+)?(?:nurse|injector|provider|assistant|receptionist)\b/i,
      /\b(?:open|unfilled)\s+(?:role|shift|position)\b/i,
    ],
    title: "I’m treating this as a capacity need.",
    body: "Klinikos can bring the Grid workflow for the role, timing, location, and eligibility requirements forward without claiming a match exists before one is verified.",
    assumption: "You are looking for qualified healthcare capacity rather than general information about staffing.",
  },
  {
    destination: { key: "referrals", href: "/start", action: "Open clinic operations" },
    patterns: [
      /\breferrals?\b/i,
      /\b(?:follow[- ]?up|open loops?|care gaps?|missing results?|lost patients?)\b/i,
      /\b(?:results?|handoffs?)\s+(?:are\s+)?(?:missing|stuck|late|lost)\b/i,
    ],
    title: "I’m treating this as a continuity problem.",
    body: "Klinikos can surface unresolved referrals, results, ownership, and follow-up as one operating thread, then keep the real next action visible.",
    assumption: "The immediate goal is to find where the care loop is breaking and establish ownership.",
  },
  {
    destination: { key: "patient", href: "/portal", action: "Open patient access" },
    patterns: [
      /\b(?:book|schedule|change|cancel)\s+(?:my\s+|an?\s+)?appointment\b/i,
      /\b(?:get|find|need)\s+(?:medical\s+)?care\b/i,
      /\b(?:patient portal|my appointment|my forms|message my provider|see a doctor)\b/i,
    ],
    title: "I’m treating this as a patient access request.",
    body: "The patient-facing experience keeps appointments, forms, messages, and the next requested step together. Sign-in and identity checks still happen before private information appears.",
    assumption: "You want to continue as a patient or client rather than operate a clinic workflow.",
  },
  {
    destination: { key: "edu", href: "/edu", action: "Open Klinikos EDU" },
    patterns: [
      /\b(?:learn|training|course|class|study|student|teach me)\b/i,
      /\b(?:certification|credential|competenc(?:y|ies)|skills?|practice scenario)\b/i,
      /\b(?:become|train as|qualify as)\s+(?:an?\s+)?(?:nurse|injector|provider|professional)\b/i,
    ],
    title: "I’m treating this as a learning and readiness goal.",
    body: "Klinikos EDU can bring forward the relevant learning, scenarios, evidence, and readiness steps while keeping real credential and eligibility decisions separate.",
    assumption: "The next useful move is building knowledge or demonstrated readiness.",
  },
  {
    destination: { key: "grid", href: "/grid", action: "Open Grid" },
    patterns: [
      /\b(?:job|work|shift|opportunity|gig|contract)\b/i,
      /\b(?:room|chair|space|equipment|service|capacity)\b/i,
      /\b(?:rent|offer|list|find)\s+(?:a\s+|an\s+)?(?:room|chair|space|equipment|service)\b/i,
    ],
    title: "I’m treating this as a Grid request.",
    body: "Grid is the place for healthcare work, people, rooms, services, equipment, education capacity, and other governed resources. Availability and eligibility remain verified rather than assumed.",
    assumption: "You are trying to find or offer healthcare capacity, opportunity, or a resource.",
  },
  {
    destination: { key: "clinic", href: "/start", action: "Open clinic operations" },
    patterns: [
      /\b(?:run|operate|manage|grow|fix|organize)\s+(?:my\s+|our\s+|a\s+)?clinic\b/i,
      /\b(?:front desk|intake|scheduling|billing|revenue|clinic operations?)\b/i,
      /\b(?:patients?|paperwork|tasks?)\s+(?:are\s+)?(?:falling behind|getting lost|unorganized)\b/i,
    ],
    title: "I’m treating this as a clinic operating goal.",
    body: "Klinikos can bring the relevant patient, schedule, staff work, follow-up, documentation, and revenue thread forward without dumping the entire operating system on the screen.",
    assumption: "You are trying to improve how a clinic operates rather than complete a single patient action.",
  },
];

const pathDestinationKeys: Record<string, PublicLivingDestination["key"]> = {
  "find-extra-work": "grid",
  "become-grid-ready": "edu",
  "fill-staffing-need": "staffing",
  "fix-referral-leakage": "referrals",
};

function ruleForKey(key: PublicLivingDestination["key"]) {
  return publicRules.find((rule) => rule.destination.key === key) ?? null;
}

function matchScore(prompt: string, rule: PublicRule) {
  return rule.patterns.reduce((score, pattern) => score + (pattern.test(prompt) ? 1 : 0), 0);
}

export function resolvePublicLivingIntent(rawPrompt: string): PublicLivingResolution {
  const prompt = rawPrompt.trim();
  const established = resolveIntentDeterministically(prompt);
  const establishedKey = established.candidatePathIds[0]
    ? pathDestinationKeys[established.candidatePathIds[0]]
    : null;
  const establishedRule = establishedKey ? ruleForKey(establishedKey) : null;

  if (establishedRule) {
    return {
      title: establishedRule.title,
      body: established.outcome,
      assumption: established.requiresClarification ? establishedRule.assumption : null,
      destination: establishedRule.destination,
      confidence: Math.max(established.confidence, 0.67),
    };
  }

  const ranked = publicRules
    .map((rule, index) => ({ rule, index, score: matchScore(prompt, rule) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const winner = ranked[0];

  if (winner) {
    const tied = ranked[1]?.score === winner.score;
    return {
      title: winner.rule.title,
      body: winner.rule.body,
      assumption: tied || winner.score === 1 ? winner.rule.assumption : null,
      destination: winner.rule.destination,
      confidence: Math.min(0.92, 0.56 + winner.score * 0.14),
    };
  }

  return {
    title: "I’m keeping this as the working goal.",
    body: "Klinikos has kept your request intact instead of forcing it into the wrong product category. Continue here with the outcome, deadline, or constraint that matters most, and the workspace will adapt around it.",
    assumption: "No clinic, Grid, EDU, patient, staffing, or referral destination is being selected yet.",
    destination: null,
    confidence: 0.25,
  };
}
