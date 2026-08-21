import {
  KLINIKOS_ECOSYSTEM,
  KLINIKOS_HUMAN_AUTHORITY,
  KLINIKOS_ONE_LINE,
  KLINIKOS_SUPPORTING,
} from "@/lib/brand/canonical-messaging";

/**
 * What public Zumi can answer from, and what it must refuse.
 *
 * Two defects motivate this module, both reproduced before it was written.
 *
 * The public resolver is a synchronous regex matcher with no model behind it, so any
 * phrase its rules did not match fell through to one hardcoded sentence. "whats going"
 * and "what can i do" both returned "Tell me a little more.", which is how three turns
 * in a row felt like talking to a wall. Ordinary questions about the product were
 * unmatched simply because no rule described the product.
 *
 * Worse, a sticky branch attached any unmatched follow-up to the previous destination.
 * "show me Mrs. Smith's patient record" returned "Got it." and routed to EDU, because
 * the turn before it had been about training. A request for a patient record must never
 * be absorbed into whatever the last topic happened to be — on a page that cannot see
 * patient data, the only correct answer is to say so.
 *
 * So: the private-data check runs first and is never sticky, and the product answers
 * come from the canonical messaging rather than a second copy of the marketing text.
 */

export interface PublicAnswer {
  readonly title: string;
  readonly body: string;
  /** A public route to offer, or null when the answer is complete on its own. */
  readonly destination: { readonly key: "explore" | "signin" | "grid" | "edu"; readonly href: string; readonly action: string } | null;
}

/**
 * Phrases that mean "show me real clinical or personal data".
 *
 * Deliberately broad. A false positive costs one honest sentence explaining that this
 * page cannot see records; a false negative means public Zumi answered as though it
 * could, or quietly filed the request under an unrelated topic.
 */
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

/** The one honest answer to a records request on a page with no access to records. */
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
 * Questions about the product itself, answered from the canonical description.
 *
 * These are not conversation scripts. Each is a real question a visitor asks in the
 * first thirty seconds, and every one of them used to hit the generic fallback.
 */
const PRODUCT_QUESTIONS: ReadonlyArray<{ match: RegExp; answer: () => PublicAnswer }> = [
  {
    match: /\b(?:what(?:'s| is)?\s+(?:this|klinikos|zumi)|who are you|what do you do|what does klinikos do|whats going|what(?:'s| is) going on)\b/i,
    answer: () => ({
      title: KLINIKOS_ONE_LINE,
      body: `${KLINIKOS_SUPPORTING} ${KLINIKOS_HUMAN_AUTHORITY}`,
      destination: null,
    }),
  },
  {
    // Deliberately not a bare "help me". That hijacked real requests — "help me run my
    // clinic" is a clinic-operations intent and belongs to the routing rules, not to a
    // generic capability answer.
    match: /\b(?:what can i do|what can you do|how can you help|what are my options|where do i start|how do i start)\b/i,
    answer: () => ({
      title: "Here’s what this page can actually do.",
      body:
        "Tell me what your clinic is dealing with and I’ll point you at the part of Klinikos that owns it — "
        + "cover for a shift, a room or equipment you need, follow-up that keeps slipping, or training. "
        + "You can also see what Klinikos would replace in your current software, or read how it works.",
      destination: { key: "explore", href: "/operational-audit", action: "See what Klinikos would replace" },
    }),
  },
  {
    match: /\b(?:how much|price|pricing|cost|expensive|afford)\b/i,
    answer: () => ({
      title: "Pricing depends on what it replaces.",
      body:
        "Klinikos is priced against the whole stack a clinic already pays for, not against a single EHR seat. "
        + "The quickest honest answer is to put your current software costs in and see the difference.",
      destination: { key: "explore", href: "/operational-audit", action: "See what Klinikos would replace" },
    }),
  },
  {
    match: /\b(?:is (?:this|it) an ehr|replace my ehr|do i need an ehr|instead of (?:an )?ehr)\b/i,
    answer: () => ({
      title: "It runs the operation around the chart.",
      body:
        "An EHR stores and documents clinical information. Klinikos coordinates the work that happens around "
        + "it — scheduling, follow-up, tasks, documents, referrals and revenue work — and connects to the "
        + "systems that have to stay external, like your clearinghouse and eRx.",
      destination: { key: "explore", href: "/how-it-works", action: "See how it works" },
    }),
  },
  {
    match: /\b(?:what is|what'?s|tell me about)\s+(?:the\s+)?grid\b/i,
    answer: () => ({
      title: "Grid is the network.",
      body: `${KLINIKOS_ECOSYSTEM[2].sentence} Listing and searching are free, and declining an offer costs nothing.`,
      destination: { key: "grid", href: "/grid", action: "Open Grid" },
    }),
  },
  {
    match: /\b(?:what is|what'?s|tell me about)\s+(?:klinikos\s+)?edu\b/i,
    answer: () => ({
      title: "EDU is the learning system.",
      body: KLINIKOS_ECOSYSTEM[3].sentence,
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

/**
 * The last resort, which must not be the same sentence every time.
 *
 * Repeating one fallback is what made the conversation feel broken: two different
 * questions produced identical text, so the page looked like it had stopped listening.
 * These rotate on how many times the conversation has already failed to land, and each
 * one asks for something more specific than the last.
 */
const ESCALATING_FALLBACKS: readonly PublicAnswer[] = [
  {
    title: "Say a bit more and I’ll point you somewhere useful.",
    body:
      "Are you asking what Klinikos does for a clinic, or what you can do from this page? Either is fine — "
      + "a sentence about what you are trying to get done is enough.",
    destination: null,
  },
  {
    title: "Let me offer some directions.",
    body:
      "People usually arrive here for one of four things: cover for a shift, space or equipment, follow-up "
      + "that keeps slipping, or training. If none of those fit, tell me what your clinic is struggling with.",
    destination: null,
  },
  {
    title: "It might be quicker to look around.",
    body:
      "I am not picking up enough to route you well. How it works explains the product end to end, and the "
      + "operating analysis shows what Klinikos would replace in your current software.",
    destination: { key: "explore", href: "/how-it-works", action: "See how it works" },
  },
];

/** Pick a fallback that has not just been used. `attempt` is how many have preceded it. */
export function escalatingFallback(attempt: number): PublicAnswer {
  const index = Math.min(Math.max(attempt, 0), ESCALATING_FALLBACKS.length - 1);
  return ESCALATING_FALLBACKS[index];
}

export const FALLBACK_COUNT = ESCALATING_FALLBACKS.length;
