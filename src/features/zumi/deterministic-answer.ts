import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import type { ZumiWorkspaceIntelligence } from "@/features/zumi/workspace-intelligence";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import { canOpen } from "@/lib/navigation-experience";

/**
 * Zumi without a model provider.
 *
 * Before this, a deployment with no inference provider configured returned 503 to every
 * question — including "hi". That is the wrong failure: the parts of Zumi people rely on
 * most are conversation and navigation, and both are answerable from state Klinikos
 * already owns. The route registry knows the journeys, workspace intelligence knows what
 * this role can open from here, and the intent engine already maps plain sentences onto
 * routes deterministically. None of that needs a model.
 *
 * So this is not a stub or a placeholder. It is a real answer built from real state, and
 * it is labelled honestly: `modelGenerated: false` travels with every reply so no surface
 * can present it as something a model said. When a provider is configured, the gateway
 * handles the request instead and this never runs.
 *
 * The rule it must not break: it navigates and explains, and it never claims to have done
 * anything. No sending, no scheduling, no money, no records. Every action it offers is a
 * link the person clicks themselves, and every link is one their role can already open.
 */

export interface DeterministicAnswer {
  answer: string;
  /** Always false. Callers use it to avoid attributing this to a model. */
  modelGenerated: false;
  /** Destinations the person can open, already filtered to their role. */
  destinations: Array<{ label: string; href: string }>;
  /** Which route the sentence resolved to, when one did. */
  routeId: string | null;
}

const GREETINGS = /^(hi|hey|hello|yo|good (morning|afternoon|evening)|howdy|sup)\b/i;
const THANKS = /^(thanks|thank you|ta|cheers|appreciate it|nice|great|perfect|cool|awesome)\b/i;
const AFFIRMATIONS = /^(ok|okay|k|yes|yep|yeah|sure|got it|understood|no|nope|nah)\b/i;
const CAPABILITY = /(what can you do|who are you|what are you|help me|how do (i|you) work|what is klinikos)/i;

/**
 * Operational lookups that a route journey answers badly.
 *
 * "Who hasn't completed intake tomorrow?" is not a journey from one state to another —
 * it is a question about a list, and the honest answer is the surface that holds that
 * list. Sending it through the route catalog produced a generic operational path, which
 * reads as understanding without being it. Pointing at the right surface and saying so
 * plainly is more useful and more truthful: Zumi is not claiming to have counted, it is
 * saying where the count lives.
 */
export const SURFACE_LOOKUPS: ReadonlyArray<{
  match: RegExp;
  href: string;
  label: string;
  answer: string;
}> = [
  {
    match: /\b(intake|forms?|paperwork|consent)\b/i,
    href: "/forms",
    label: "Intake & forms",
    answer: "Intake and form completion live in Intake & forms — that is where you can see who still has something outstanding.",
  },
  {
    match: /\b(today|tomorrow|schedule|appointments?|arriv|confirm)\b/i,
    href: "/front-desk",
    label: "Today",
    answer: "Today shows the visits and who is ready — that is where arrivals, confirmations and readiness are tracked.",
  },
  {
    match: /\b(unpaid|balance|owe|invoice|billing|claim|money|revenue)\b/i,
    href: "/billing",
    label: "Money",
    answer: "Money is where balances, claims and anything blocking payment are tracked.",
  },
  {
    match: /\b(referral|referred|specialist|handoff)\b/i,
    href: "/referrals",
    label: "Follow-up",
    answer: "Referrals that have not closed the loop are tracked in Follow-up.",
  },
  {
    match: /\b(task|assigned|owner|overdue|waiting on)\b/i,
    href: "/tasks",
    label: "Team",
    answer: "Team shows who owns what and what has been waiting.",
  },
];

function firstName(session: ClinicSession) {
  return session.name?.trim().split(/\s+/)[0] ?? null;
}

function destinationsFor(workspace: ZumiWorkspaceIntelligence, limit = 4) {
  // Primary first, then related, de-duplicated by href.
  const seen = new Set<string>();
  return [...workspace.primaryDestinations, ...workspace.relatedDestinations]
    .filter((destination) => {
      if (seen.has(destination.href)) return false;
      seen.add(destination.href);
      return true;
    })
    .slice(0, limit)
    .map((destination) => ({ label: destination.label, href: destination.href }));
}

/**
 * The surface that answers a direct operational question, if there is one.
 *
 * Shared so Living Home's composer and the Zumi conversation give the same answer. They
 * had separate logic, and Living Home's was worse: an unmatched sentence was met with
 * "I need the outcome rather than the topic", which turns a clear question into an
 * interrogation. Returns null when nothing fits, so callers keep their own last resort.
 */
export function resolveSurfaceLookup(question: string, role: ClinicRole) {
  const lookup = SURFACE_LOOKUPS.find((candidate) => candidate.match.test(question));
  if (!lookup || !canOpen(role, lookup.href)) return null;
  return { answer: lookup.answer, label: lookup.label, href: lookup.href };
}

/**
 * Answer a turn without a model.
 *
 * Ordered so the cheapest and most certain interpretations win: a greeting is a greeting,
 * and running it through route resolution would produce a confident answer to a question
 * nobody asked. Only once the social turns are handled does it try to resolve intent.
 */
export function answerDeterministically(input: {
  question: string;
  session: ClinicSession;
  workspace: ZumiWorkspaceIntelligence;
}): DeterministicAnswer {
  const question = input.question.trim();
  const name = firstName(input.session);
  const destinations = destinationsFor(input.workspace);

  const base = { modelGenerated: false as const, destinations, routeId: null };

  if (GREETINGS.test(question)) {
    return { ...base, answer: `${name ? `Hello ${name}. ` : "Hello. "}What would you like to work on?` };
  }
  if (THANKS.test(question)) {
    return { ...base, answer: "Any time. What next?" };
  }
  if (AFFIRMATIONS.test(question) && question.length <= 24) {
    // A bare acknowledgment is not a request. Answering it with a workspace tour is the
    // conversational equivalent of shouting.
    return { ...base, answer: "Got it." };
  }
  if (CAPABILITY.test(question)) {
    const list = destinations.map((destination) => destination.label).join(", ");
    return {
      ...base,
      answer: `I can help you find what needs attention and take you to the right place in Klinikos.${list ? ` From here that's ${list}.` : ""} Tell me what you are trying to get done.`,
    };
  }

  // A direct operational lookup, answered by naming the surface that holds it. Checked
  // before route resolution because a question about a list is not a journey, and the
  // catalog would answer it with a confident-sounding path to somewhere else.
  const lookup = resolveSurfaceLookup(question, input.session.role);
  if (lookup) {
    return {
      ...base,
      answer: lookup.answer,
      destinations: [{ label: lookup.label, href: lookup.href }, ...destinations.filter((d) => d.href !== lookup.href)].slice(0, 4),
    };
  }

  // A real request. Resolve it against the route catalog.
  const intent = resolveIntentDeterministically(question);
  const routeId = intent.candidatePathIds[0] ?? null;
  const route = routeId ? klinikosPathCatalog.find((candidate) => candidate.id === routeId) : null;

  if (route) {
    const steps = route.nodes.filter((node) => node.href).slice(0, 3);
    const routeDestinations = steps.map((node) => ({ label: node.label, href: node.href! }));
    return {
      answer: intent.requiresClarification && intent.clarificationQuestions.length
        ? `${intent.clarificationQuestions[0]}`
        : `${route.summary} Here is where that happens.`,
      modelGenerated: false,
      destinations: routeDestinations.length ? routeDestinations : destinations,
      routeId,
    };
  }

  // Nothing matched. Say so plainly and offer what is actually here, rather than
  // inventing an interpretation or apologising at length.
  return {
    ...base,
    answer: destinations.length
      ? `I am not sure what you need yet. Tell me the outcome you are after, or start from one of these.`
      : "I am not sure what you need yet. Tell me the outcome you are after.",
  };
}
