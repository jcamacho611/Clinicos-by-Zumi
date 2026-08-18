import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

export type PublicLivingDestination = {
  key:
    | "clinic"
    | "grid"
    | "edu"
    | "patient"
    | "referrals"
    | "staffing"
    | "priorities"
    | "revenue"
    | "billing"
    | "insights"
    | "care";
  href: string;
  action: string;
};

export type PublicLivingResolution = {
  kind: "conversation" | "route";
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
    destination: { key: "priorities", href: "/tasks", action: "Show today’s priorities" },
    patterns: [
      /\b(?:today'?s?|my|our)\s+(?:priorities|tasks|work queue|to[- ]?do)\b/i,
      /\bwhat\s+(?:needs|requires)\s+(?:my|our)\s+attention\b/i,
      /\b(?:overdue|urgent|pending)\s+(?:tasks?|work|follow[- ]?ups?)\b/i,
    ],
    title: "Let’s look at what needs attention.",
    body: "I can take you to today’s owned work, due items, and escalations so you can start with what matters most.",
    assumption: "You want the work already tracked in Klinikos, not a general productivity list.",
  },
  {
    destination: { key: "revenue", href: "/crm", action: "Review revenue recovery" },
    patterns: [
      /\b(?:losing|lost|recover|recoverable)\s+(?:money|revenue|leads?|patients?|bookings?)\b/i,
      /\b(?:revenue opportunities?|missed leads?|dormant clients?|unbooked follow[- ]?ups?)\b/i,
      /\bwhere\s+(?:are|am)\s+(?:we|i)\s+losing\s+(?:money|revenue)\b/i,
    ],
    title: "Let’s find what is getting missed.",
    body: "I can take you to revenue recovery so missed follow-up and open opportunities are easier to see and act on.",
    assumption: "You want to work from recorded opportunities rather than estimate revenue from scratch.",
  },
  {
    destination: { key: "billing", href: "/billing", action: "Open billing" },
    patterns: [
      /\b(?:billing|claim|claims|payment|payments|invoice|invoices)\b/i,
      /\b(?:insurance|eligibility|authorization|claim readiness)\b/i,
      /\b(?:unpaid|outstanding|denied)\s+(?:claim|claims|balance|balances|payment|payments)\b/i,
    ],
    title: "Let’s check the billing work.",
    body: "I can take you to billing and claim-readiness work so you can see what is waiting, missing, or ready for the next step.",
    assumption: "You want to inspect or advance billing work already represented in Klinikos.",
  },
  {
    destination: { key: "insights", href: "/quality", action: "Open operational insights" },
    patterns: [
      /\b(?:insights?|analytics?|metrics?|performance|trends?)\b/i,
      /\b(?:care gaps?|quality|hedis|missed appointments?|network activity)\b/i,
      /\bshow\s+me\s+(?:what|where|how)\s+(?:is|are|we)\b/i,
    ],
    title: "Let’s look at what the operation is showing.",
    body: "I can take you to the recorded quality and operating signals that help explain where attention may be needed.",
    assumption: "You want an evidence-backed operating view, not a generic explanation.",
  },
  {
    destination: { key: "staffing", href: "/grid", action: "Find coverage in Grid" },
    patterns: [
      /\b(?:hire|hiring|staff|staffing|coverage)\b/i,
      /\b(?:need|find)\s+(?:an?\s+)?(?:nurse|injector|provider|assistant|receptionist)\b/i,
      /\b(?:open|unfilled)\s+(?:role|shift|position)\b/i,
    ],
    title: "Let’s find the coverage you need.",
    body: "Grid can help you look for the right kind of healthcare capacity by role, timing, location, and eligibility.",
    assumption: "You are looking for healthcare capacity rather than general hiring advice.",
  },
  {
    destination: { key: "referrals", href: "/referrals", action: "Review referrals and follow-up" },
    patterns: [
      /\breferrals?\b/i,
      /\b(?:follow[- ]?up|open loops?|missing results?|lost patients?)\b/i,
      /\b(?:results?|handoffs?)\s+(?:are\s+)?(?:missing|stuck|late|lost)\b/i,
    ],
    title: "Let’s close the loop.",
    body: "I can take you to referrals and follow-up so unresolved handoffs, results, and ownership are easier to see.",
    assumption: "You want to find where continuity is breaking and move the next step forward.",
  },
  {
    destination: { key: "patient", href: "/portal", action: "Continue to patient access" },
    patterns: [
      /\b(?:book|schedule|change|cancel)\s+(?:my\s+|an?\s+)?appointment\b/i,
      /\b(?:get|find|need)\s+(?:medical\s+)?care\b/i,
      /\b(?:patient portal|my appointment|my forms|message my provider|see a doctor)\b/i,
    ],
    title: "I can help you get to the patient side.",
    body: "Patient access keeps appointments, forms, messages, and next steps in the patient experience.",
    assumption: "You want to continue as a patient or client rather than operate a clinic workflow.",
  },
  {
    destination: { key: "care", href: "/provider", action: "Open the care workspace" },
    patterns: [
      /\b(?:encounter|clinical|provider workspace|care workflow|patient care)\b/i,
      /\b(?:labs?|imaging|medications?|telemedicine)\b/i,
      /\b(?:document|review|close)\s+(?:an?\s+)?encounter\b/i,
    ],
    title: "Let’s open the care workspace.",
    body: "I can take you to the provider-side workspace for the care work you are trying to review or complete.",
    assumption: "You are coordinating provider work rather than trying to enter the patient portal.",
  },
  {
    destination: { key: "edu", href: "/edu", action: "Explore Klinikos EDU" },
    patterns: [
      /\b(?:learn|training|course|class|study|student|teach me)\b/i,
      /\b(?:certification|credential|competenc(?:y|ies)|skills?|practice scenario)\b/i,
      /\b(?:become|train as|qualify as)\s+(?:an?\s+)?(?:nurse|injector|provider|professional)\b/i,
    ],
    title: "Let’s find the right learning path.",
    body: "Klinikos EDU can help you move from what you want to learn toward the training and readiness steps that fit.",
    assumption: "The next useful move is learning or demonstrating readiness.",
  },
  {
    destination: { key: "grid", href: "/grid", action: "Open Grid" },
    patterns: [
      /\b(?:job|work|shift|opportunity|gig|contract)\b/i,
      /\b(?:room|chair|space|equipment|service|capacity)\b/i,
      /\b(?:rent|offer|list|find)\s+(?:a\s+|an\s+)?(?:room|chair|space|equipment|service)\b/i,
    ],
    title: "Let’s find what you need.",
    body: "Grid is where you can look for or offer healthcare work, people, space, equipment, services, and other real capacity.",
    assumption: "You are trying to find or offer healthcare capacity, opportunity, or a resource.",
  },
  {
    destination: { key: "clinic", href: "/dashboard", action: "Open clinic operations" },
    patterns: [
      /\b(?:run|operate|manage|grow|fix|organize)\s+(?:my\s+|our\s+|a\s+)?clinic\b/i,
      /\b(?:front desk|intake|scheduling|clinic operations?)\b/i,
      /\b(?:patients?|paperwork|tasks?)\s+(?:are\s+)?(?:falling behind|getting lost|unorganized)\b/i,
    ],
    title: "Let’s get the clinic organized.",
    body: "I can take you into clinic operations so the work around patients, schedules, staff, follow-up, and revenue is easier to manage.",
    assumption: "You are trying to improve how a clinic operates rather than complete a single patient action.",
  },
];

const pathDestinationKeys: Record<string, PublicLivingDestination["key"]> = {
  "find-extra-work": "grid",
  "become-grid-ready": "edu",
  "fill-staffing-need": "staffing",
  "fix-referral-leakage": "referrals",
};

const destinationLabels: Record<PublicLivingDestination["key"], string> = {
  clinic: "clinic operations",
  grid: "Grid",
  edu: "Klinikos EDU",
  patient: "patient access",
  referrals: "referrals and follow-up",
  staffing: "staffing",
  priorities: "today’s priorities",
  revenue: "revenue recovery",
  billing: "billing",
  insights: "operational insights",
  care: "care",
};

const exactGreeting = /^(?:hey|hi|hello|yo|sup|what'?s up|good morning|good afternoon|good evening)[!.? ]*$/i;
const exactThanks = /^(?:thanks|thank you|appreciate it|got it|perfect|cool)[!.? ]*$/i;
const exactHowAreYou = /^(?:how are you|how'?s it going|you good)[!.? ]*$/i;
const identityQuestion = /^(?:who are you|what are you|what is zumi|who is zumi)[?.! ]*$/i;
const capabilityQuestion = /^(?:what can you do|how can you help|what can klinikos do|what does klinikos do)[?.! ]*$/i;

function conversationResolution(title: string, body: string): PublicLivingResolution {
  return {
    kind: "conversation",
    title,
    body,
    assumption: null,
    destination: null,
    confidence: 1,
  };
}

function casualResponse(prompt: string): PublicLivingResolution | null {
  if (exactGreeting.test(prompt)) {
    return conversationResolution("Hey.", "What can I help you with?");
  }
  if (exactThanks.test(prompt)) {
    return conversationResolution("Anytime.", "What else can I help you with?");
  }
  if (exactHowAreYou.test(prompt)) {
    return conversationResolution("I’m here and ready.", "What do you want to work on?");
  }
  if (identityQuestion.test(prompt)) {
    return conversationResolution(
      "I’m Zumi.",
      "I’m the intelligence inside Klinikos. You can talk to me naturally, and I’ll help you understand what to do next or get you to the right part of Klinikos.",
    );
  }
  if (capabilityQuestion.test(prompt)) {
    return conversationResolution(
      "Start with what you need.",
      "You can ask about running a clinic, follow-up, revenue, staffing, Grid, learning, patient access, or another healthcare workflow. I’ll help you find the next useful step.",
    );
  }
  return null;
}

function ruleForKey(key: PublicLivingDestination["key"]) {
  return publicRules.find((rule) => rule.destination.key === key) ?? null;
}

function matchScore(prompt: string, rule: PublicRule) {
  return rule.patterns.reduce((score, pattern) => score + (pattern.test(prompt) ? 1 : 0), 0);
}

export function resolvePublicLivingIntent(
  rawPrompt: string,
  priorResolution: PublicLivingResolution | null = null,
): PublicLivingResolution {
  const prompt = rawPrompt.trim();
  const casual = casualResponse(prompt);
  if (casual) return casual;

  const established = resolveIntentDeterministically(prompt);
  const establishedKey = established.candidatePathIds[0]
    ? pathDestinationKeys[established.candidatePathIds[0]]
    : null;
  const establishedRule = establishedKey ? ruleForKey(establishedKey) : null;

  if (establishedRule) {
    return {
      kind: "route",
      title: establishedRule.title,
      body: establishedRule.body,
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
      kind: "route",
      title: winner.rule.title,
      body: winner.rule.body,
      assumption: tied || winner.score === 1 ? winner.rule.assumption : null,
      destination: winner.rule.destination,
      confidence: Math.min(0.92, 0.56 + winner.score * 0.14),
    };
  }

  if (priorResolution?.destination) {
    const destination = priorResolution.destination;
    const label = destinationLabels[destination.key];
    return {
      kind: "conversation",
      title: "Got it.",
      body: `I’ll keep that with your ${label} request. What else should I know?`,
      assumption: `Your latest message refines the previous ${label} request rather than starting an unrelated goal.`,
      destination,
      confidence: Math.max(0.52, priorResolution.confidence * 0.9),
    };
  }

  return {
    kind: "conversation",
    title: "Tell me a little more.",
    body: "What’s going on, or what do you want to be different when we’re done?",
    assumption: null,
    destination: null,
    confidence: 0.25,
  };
}
