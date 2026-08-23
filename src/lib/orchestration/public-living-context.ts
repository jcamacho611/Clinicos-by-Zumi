import {
  KLINIKOS_ECOSYSTEM,
  KLINIKOS_HUMAN_AUTHORITY,
  KLINIKOS_ONE_LINE,
  KLINIKOS_SUPPORTING,
} from "@/lib/brand/canonical-messaging";

export interface PublicAnswer {
  readonly title: string;
  readonly body: string;
  readonly destination: { readonly key: "explore" | "signin" | "grid" | "edu"; readonly href: string; readonly action: string } | null;
}

const PRIVATE_DATA = [
  /\b(?:patient|medical|health)\s+(?:record|records|chart|charts|file|files|history|data|info|information)\b/i,
  /\b(?:show|pull|open|find|get|look\s*up|see)\b[^.?!]{0,40}\b(?:chart|record|records|labs?|results?|prescription|medication list)\b/i,
  /\b(?:mrs?|ms|dr|mister|missus)\.?\s+[A-Z][a-z]+/,
  /\b(?:my|their|his|her)\s+(?:diagnosis|labs?|results?|medications?|prescriptions?)\b/i,
  /\b(?:dob|date of birth|ssn|social security|mrn|insurance id|member id)\b/i,
];

export function looksLikePrivateDataRequest(prompt: string): boolean {
  return PRIVATE_DATA.some((pattern) => pattern.test(prompt));
}

export function privateDataAnswer(): PublicAnswer {
  return {
    title: "I can’t see patient information here.",
    body:
      "This page is public, so it has no access to any clinic’s records and cannot look anyone up. "
      + "Please don’t enter patient details here. If you work at a clinic using Klinikos, sign in and "
      + "Zumi can work with what your role allows.",
    destination: { key: "signin", href: "/login", action: "Sign in to Klinikos" },
  };
}

/**
 * Fast, public-safe answers used both as cheap deterministic Tier 0 responses and as the
 * browser's emergency path if the server conversation boundary cannot be reached. They
 * must therefore remain useful on their own rather than behaving like a routing menu.
 */
const PRODUCT_QUESTIONS: ReadonlyArray<{
  match: RegExp;
  answer: () => PublicAnswer;
  /**
   * True for entries that only acknowledge who the visitor is. A role statement is worth
   * answering warmly on its own, but it is not the point of a message that also names a
   * problem — "I run a med spa and my staff keeps forgetting callbacks" is a continuity
   * request. These yield to the routing rules; every other entry here answers a real
   * question about the product and must keep winning, so that asking whether the AI makes
   * clinical decisions gets the human-authority answer rather than a route.
   */
  statesRoleOnly?: true;
}> = [
  {
    match: /\b(?:what(?:'s| is)?\s+(?:this|klinikos|zumi)|who are you|what do you do|what does klinikos do|whats going|what(?:'s| is) going on)\b/i,
    answer: () => ({
      title: KLINIKOS_ONE_LINE,
      body: `${KLINIKOS_SUPPORTING} ${KLINIKOS_HUMAN_AUTHORITY}`,
      destination: null,
    }),
  },
  {
    match: /^\s*(?:like what|what else|give me examples?|such as what)[?.! ]*$/i,
    answer: () => ({
      title: "Here are concrete examples.",
      body:
        "If callbacks are missed, Klinikos can turn follow-up into owned work with a next step. If you need a nurse, room, equipment or extra work, that belongs in Grid. "
        + "If billing or claim-readiness work is stuck, Klinikos can organize the follow-through. If you are learning, EDU is the learning path. Tell me which example sounds closest and I’ll go deeper.",
      destination: null,
    }),
  },
  {
    match: /\b(?:what can (?:i|you|we) do|how can you help|how could you help|what are my options|where do i start|how do i start)\b/i,
    answer: () => ({
      title: "There are a few very different things we can solve.",
      body:
        "For a clinic, Klinikos can help organize scheduling, intake, team tasks, callbacks, referrals, documents, billing follow-through and revenue work. "
        + "Grid covers healthcare people, work, space, equipment and services. EDU covers learning and synthetic practice. "
        + "Tell me who you are or what keeps going wrong and I’ll tailor the next answer instead of making you pick a module.",
      destination: null,
    }),
  },
  {
    match: /\b(?:i(?:'m| am)|im)\s+(?:a\s+)?(?:doctor|physician|m\.?d\.?)\b/i,
    statesRoleOnly: true,
    answer: () => ({
      title: "That gives me a much better starting point.",
      body:
        "If you practice as a physician, Klinikos is most useful for the operational work around care rather than replacing your judgment: intake, scheduling, team tasks, follow-up, referrals, documents, billing follow-through and outside capacity through Grid. "
        + "If you also own or manage the practice, I can go deeper into staffing, missed revenue and operating workflow. Are you mainly practicing, running the business, or both?",
      destination: null,
    }),
  },
  {
    match: /\b(?:i own|i run|i operate)\s+(?:my\s+|a\s+|the\s+)?(?:clinic|practice|med spa|medical practice)\b/i,
    statesRoleOnly: true,
    answer: () => ({
      title: "Then we can focus on the operation, not just the software.",
      body:
        "I can help you work through where intake, staff ownership, callbacks, referrals, billing follow-through, capacity or revenue are getting stuck and connect that problem to the relevant Klinikos workflow. "
        + "A useful place to start is the part of the practice that wastes the most time or loses the most follow-through.",
      destination: null,
    }),
  },
  {
    match: /\b(?:i(?:'m| am)|im)\s+(?:an?\s+)?(?:nurse practitioner|np|physician assistant|pa|registered nurse|rn|nurse|therapist|injector)\b/i,
    statesRoleOnly: true,
    answer: () => ({
      title: "I can tailor this around your healthcare role.",
      body:
        "Klinikos can help with the operational work around care, including schedules, tasks, follow-up, referrals and documents, while Grid can help with healthcare capacity and opportunities. "
        + "Tell me whether you are trying to improve work inside a clinic, find opportunities, or solve a specific workflow and I’ll make the next step concrete.",
      destination: null,
    }),
  },
  {
    match: /\b(?:how much|price|pricing|cost|expensive|afford)\b/i,
    answer: () => ({
      title: "Pricing depends on what it replaces.",
      body:
        "Klinikos is priced against the whole stack a clinic already pays for, not against a single EHR seat. "
        + "The useful comparison is the scheduling, messaging, forms, documents, task, follow-up and revenue tools the clinic is already carrying alongside its clinical systems.",
      destination: { key: "explore", href: "/operational-audit", action: "Compare your current stack" },
    }),
  },
  {
    match: /\b(?:is (?:this|it) an ehr|replace my ehr|do i need an ehr|instead of (?:an )?ehr)\b/i,
    answer: () => ({
      title: "It runs the operation around the chart.",
      body:
        "An EHR stores and documents clinical information. Klinikos coordinates the work that happens around "
        + "it — scheduling, follow-up, tasks, documents, referrals and revenue work — and connects to the "
        + "systems that have to stay external.",
      destination: { key: "explore", href: "/how-it-works", action: "See how it works" },
    }),
  },
  {
    match: /\b(?:what is|what'?s|tell me about)\s+(?:the\s+)?grid\b/i,
    answer: () => ({
      title: "Grid is the network.",
      body: `${KLINIKOS_ECOSYSTEM[2].sentence} It is broader than staffing: healthcare work, people, rooms, space, equipment, services and other capacity can belong there, subject to the requirements for each opportunity.`,
      destination: { key: "grid", href: "/grid", action: "Open Grid" },
    }),
  },
  {
    match: /\b(?:what is|what'?s|tell me about)\s+(?:klinikos\s+)?edu\b/i,
    answer: () => ({
      title: "EDU is the learning system.",
      body: `${KLINIKOS_ECOSYSTEM[3].sentence} Learning and readiness do not by themselves verify a license, credential or eligibility for regulated work.`,
      destination: { key: "edu", href: "/edu", action: "Explore EDU" },
    }),
  },
  {
    match: /\b(?:is the ai|does the ai|ai deciding|clinical decision|does zumi decide)\b/i,
    answer: () => ({
      title: "Zumi organises work. People decide.",
      body: `${KLINIKOS_HUMAN_AUTHORITY} Zumi surfaces what needs attention and helps coordinate it; it does not make clinical calls.`,
      destination: null,
    }),
  },
];

export function answerProductQuestion(prompt: string): PublicAnswer | null {
  const hit = PRODUCT_QUESTIONS.find((entry) => entry.match.test(prompt));
  return hit ? hit.answer() : null;
}

/** Whether the matching product answer is a bare role acknowledgement — see `statesRoleOnly`. */
export function productAnswerOnlyStatesRole(prompt: string): boolean {
  const hit = PRODUCT_QUESTIONS.find((entry) => entry.match.test(prompt));
  return hit?.statesRoleOnly === true;
}

/**
 * Absolute last-resort responses for the deterministic/browser emergency path.
 *
 * These intentionally do not escalate toward "go read the site". Even without model
 * inference, each response provides substantive options and asks for one useful piece of
 * context. A provider outage may reduce sophistication; it must not erase helpfulness.
 */
const ESCALATING_FALLBACKS: readonly PublicAnswer[] = [
  {
    title: "I can still give you a useful starting point.",
    body:
      "If you are running a clinic, I can help with follow-up, staffing, scheduling, referrals, billing workflow, revenue recovery or the software stack. "
      + "If you are a healthcare professional, Grid can also help with healthcare opportunities and capacity. If you are learning, EDU is the relevant path. Which of those is closest to what you are trying to do?",
    destination: null,
  },
  {
    title: "Let’s narrow it from your role or the problem.",
    body:
      "You can tell me something as simple as ‘I’m a doctor,’ ‘I run the practice,’ ‘we miss callbacks,’ ‘I need a nurse Friday,’ ‘I need a room,’ or ‘I’m in nursing school.’ "
      + "Any one of those gives me enough context to make the next answer specific.",
    destination: null,
  },
  {
    title: "Here are the main problem types I can help unpack.",
    body:
      "Clinic operations covers intake, scheduling, team ownership, follow-up, referrals, documents, billing and revenue work. Grid covers people, work, space, equipment and services. EDU covers learning and synthetic practice. "
      + "Tell me the part of your day that is breaking and I’ll connect it to a concrete next step.",
    destination: null,
  },
];

export function escalatingFallback(attempt: number): PublicAnswer {
  const index = Math.min(Math.max(attempt, 0), ESCALATING_FALLBACKS.length - 1);
  return ESCALATING_FALLBACKS[index];
}

export const FALLBACK_COUNT = ESCALATING_FALLBACKS.length;
