import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

import {
  answerProductQuestion,
  productAnswerOnlyStatesRole,
  escalatingFallback,
  looksLikePrivateDataRequest,
  privateDataAnswer,
} from "@/lib/orchestration/public-living-context";

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
    | "care"
    /* Public-only destinations. `explore` covers the product-explanation routes a
       visitor asks for by name; `signin` is where a request for real clinic data has to
       go, because this page has none. */
    | "explore"
    | "signin";
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
      // Two separate signals on purpose. Rules are ranked by how many patterns match and
      // ties break toward whichever rule is declared first, which is staffing. "My staff
      // keeps forgetting callbacks" is a continuity problem that happens to mention
      // staff, and one weak token should not outrank two strong ones.
      /\b(?:call[- ]?backs?|calling back|call(?:ing)? them back)\b/i,
      /\b(?:forget(?:ting|s)?|forgot|slip(?:ping|s)? through|falling through|never (?:called|contacted|followed))\b/i,
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
  explore: "the product overview",
  signin: "signing in",
};

const exactGreeting = /^(?:hey|hi|hello|yo|sup|what'?s up|good morning|good afternoon|good evening)[!.? ]*$/i;
const exactThanks = /^(?:thanks|thank you|appreciate it|got it|perfect|cool)[!.? ]*$/i;
const exactHowAreYou = /^(?:how are you|how'?s it going|you good)[!.? ]*$/i;
const identityQuestion = /^(?:who are you|what are you|what is zumi|who is zumi)[?.! ]*$/i;
const capabilityQuestion = /^(?:what can (?:you|i) do(?: here)?|what should i do(?: here)?|how can you help|what can klinikos do|what does klinikos do)[?.! ]*$/i;
// "on" is optional because the reported failure was literally "whats going" — a real
// person trailing off mid-phrase. The anchored form without it never matched, so the
// page-context answer could not fire on the exact input it was written for.
const pageContextQuestion = /^(?:what'?s? going(?: on)?(?: here)?|what is going(?: on)?(?: here)?|what is this(?: page)?|where am i|what am i looking at)[?.! ]*$/i;

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
  if (pageContextQuestion.test(prompt)) {
    return conversationResolution(
      "You’re in Klinikos.",
      "This is the public front door to Klinikos. Tell me what you are trying to run, fix, find, learn, or get done and I’ll point you toward the most useful next step. Private clinic records and actions stay behind sign-in.",
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
  unresolvedTurns = 0,
): PublicLivingResolution {
  const prompt = rawPrompt.trim();

  // Before anything else, and never sticky. A request for real clinical or personal
  // data has exactly one honest answer on a page with no access to it. This used to
  // fall through to the prior-destination branch, so "show me Mrs. Smith's patient
  // record" returned "Got it." and routed to EDU because the previous turn had been
  // about training.
  if (looksLikePrivateDataRequest(prompt)) {
    const refusal = privateDataAnswer();
    return {
      kind: "route",
      title: refusal.title,
      body: refusal.body,
      assumption: null,
      destination: refusal.destination,
      confidence: 0.95,
    };
  }

  const casual = casualResponse(prompt);
  if (casual) return casual;

  // Questions about the product itself. These were unmatched by every routing rule,
  // because no rule described the product, so "what is this" and "what can I do" both
  // reached the generic fallback.
  // A product answer normally wins: these are real questions about Klinikos, and one of
  // them — whether the AI makes clinical decisions — must never be answered with a route.
  // The exception is a bare role acknowledgement, which is deferred until the routing
  // rules have had their turn, so a problem stated alongside the role still gets found.
  const product = answerProductQuestion(prompt);
  const productYieldsToRouting = product !== null && productAnswerOnlyStatesRole(prompt);
  if (product && !productYieldsToRouting) {
    return {
      kind: product.destination ? "route" : "conversation",
      title: product.title,
      body: product.body,
      assumption: null,
      destination: product.destination,
      confidence: 0.8,
    };
  }

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

  // A destination-less product answer — "I run a med spa", "I'm a nurse" — is the right
  // reply to a bare role statement, but it must not outrank a routable problem stated in
  // the same breath. "I run a med spa and my staff keeps forgetting callbacks" names a
  // continuity problem; answering "tell me where time is wasted" ignores what the person
  // just said and offers nowhere to go. So the role answer is the fallback here, taken
  // only once the routing rules have found nothing.
  if (product) {
    return {
      kind: "conversation",
      title: product.title,
      body: product.body,
      assumption: null,
      destination: null,
      confidence: 0.8,
    };
  }

  // `signin` is only ever reached by refusing a private-data request, and `explore` is
  // a generic product route. Neither is an intent the visitor was pursuing, so neither
  // should capture the next unmatched message — otherwise typing nonsense straight
  // after a refusal answers "Got it." and points at sign-in.
  const stickyPrior = priorResolution?.destination
    && priorResolution.destination.key !== "signin"
    && priorResolution.destination.key !== "explore"
    ? priorResolution
    : null;

  if (stickyPrior?.destination) {
    const destination = stickyPrior.destination;
    const label = destinationLabels[destination.key];
    return {
      kind: "conversation",
      title: "Got it.",
      body: `I’ll keep that with your ${label} request. What else should I know?`,
      assumption: `Your latest message refines the previous ${label} request rather than starting an unrelated goal.`,
      destination,
      confidence: Math.max(0.52, stickyPrior.confidence * 0.9),
    };
  }

  // Main added a single follow-on prompt keyed to the literal title "Tell me a little
  // more.". That title no longer exists — it was the repeated sentence this replaces —
  // so the check could never fire. The escalation below generalises it: each successive
  // miss asks for something more specific than the last and offers a route by the third.
  // Derive escalation from the conversation itself rather than trusting the caller to
  // count. `unresolvedTurns` lets the UI carry an exact streak, but a caller that passes
  // nothing must still not repeat itself, and the prior turn already says whether it was
  // a fallback: fallbacks are the only resolutions that end at this confidence.
  const priorWasFallback = priorResolution !== null
    && priorResolution.confidence <= 0.25
    && priorResolution.destination === null;
  const fallback = escalatingFallback(Math.max(unresolvedTurns, priorWasFallback ? 1 : 0));
  return {
    kind: fallback.destination ? "route" : "conversation",
    title: fallback.title,
    body: fallback.body,
    assumption: null,
    destination: fallback.destination,
    confidence: 0.25,
  };
}
