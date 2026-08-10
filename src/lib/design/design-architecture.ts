/**
 * Klinikos design architecture.
 *
 * The design system says *what things look like*. This says *which discipline
 * governs which surface*, which is the part that drifts fastest — the failure mode
 * is averaging four references into generic futuristic SaaS.
 *
 * Four references, each with one job:
 *
 *   Jensen Huang    the skeleton. Rigorous grid, contained widths, restrained type,
 *                   function over form. Roughly 60% of the interface.
 *   Virgil Abloh    the signature. Exactly one memorable visual idea — the Zumi orb.
 *                   One exceptional recurring idea beats ten mediocre ones.
 *   Christopher Nolan  the experience. Scroll-driven narrative where motion teaches
 *                   the product. Marketing only.
 *   Steve Jobs      the editor. If removing it strengthens the message, remove it.
 *
 * Pure module. No database, no network.
 */

/**
 * Surface classes.
 *
 * The distinction that matters: a visitor is being *taught* what Klinikos is; an
 * operator already knows and is trying to get work done. Motion that teaches the
 * first person interrupts the second.
 */
export const surfaceClasses = ["marketing", "product", "marketplace"] as const;
export type SurfaceClass = (typeof surfaceClasses)[number];

export type SurfaceGovernance = {
  klass: SurfaceClass;
  /** Which reference leads on this surface. */
  primary: "nolan" | "jensen" | "jensen-paper";
  /** What motion is permitted to do here. */
  motionBudget: "narrative" | "state-change-only" | "feedback-only";
  ground: "obsidian" | "paper";
  rationale: string;
};

export const surfaceGovernance: Record<SurfaceClass, SurfaceGovernance> = {
  marketing: {
    klass: "marketing",
    primary: "nolan",
    motionBudget: "narrative",
    ground: "obsidian",
    rationale:
      "A visitor has to understand fragmentation becoming continuity before they read a paragraph. Scroll-driven transformation is the argument, not decoration around it.",
  },
  product: {
    klass: "product",
    primary: "jensen",
    motionBudget: "state-change-only",
    ground: "obsidian",
    rationale:
      "An operator already knows what Klinikos is and is working a queue. Motion here can only report that something changed. Narrative motion in a workspace is an interruption wearing a costume.",
  },
  marketplace: {
    klass: "marketplace",
    primary: "jensen-paper",
    motionBudget: "feedback-only",
    ground: "paper",
    rationale:
      "Discovery is scanning many unfamiliar options. It needs Jensen's grid discipline on the system's paper surface, and motion confined to confirming a tap landed.",
  },
};

/** Route prefixes, longest match wins. */
const ROUTE_CLASSES: ReadonlyArray<[string, SurfaceClass]> = [
  ["/grid/browse", "marketplace"],
  ["/sales", "marketing"],
  ["/start", "marketing"],
  ["/founding-clinic", "marketing"],
  ["/private-demo", "marketing"],
  ["/edu", "marketing"],
  ["/grid/join", "marketing"],
  ["/edu/dashboard", "product"],
  ["/edu/courses", "product"],
  ["/edu/cohorts", "product"],
  ["/edu/scenarios", "product"],
  ["/edu/lab", "product"],
  ["/edu/grading", "product"],
  ["/edu/competencies", "product"],
  ["/edu/settings", "product"],
  ["/dashboard", "product"],
  ["/grid", "product"],
  ["/admin", "product"],
  ["/patients", "product"],
  ["/network", "product"],
];

export function classifySurface(route: string): SurfaceClass {
  const match = ROUTE_CLASSES
    .filter(([prefix]) => route === prefix || route.startsWith(`${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  // Unclassified routes default to product: the stricter budget. A new workspace
  // that nobody classified should not inherit permission to animate.
  return match ? match[1] : "product";
}

export function governanceFor(route: string) {
  return surfaceGovernance[classifySurface(route)];
}

/**
 * The motion rule, as a check rather than a maxim.
 *
 * Before any animation: what does this motion teach? If the answer is nothing, it
 * comes out. Encoded so a reviewer can point at the failing case instead of
 * relitigating taste.
 */
export type MotionProposal = {
  /** What the visitor or operator learns because this moved. Empty means decoration. */
  teaches: string;
  /** True when the movement reports a real state transition. */
  reportsStateChange: boolean;
  /** True when the movement only acknowledges direct input, e.g. a press. */
  isInputFeedback: boolean;
};

export function motionIsPermitted(route: string, proposal: MotionProposal) {
  const budget = governanceFor(route).motionBudget;

  if (!proposal.teaches.trim() && !proposal.isInputFeedback) {
    return { permitted: false as const, reason: "teaches_nothing" as const };
  }

  switch (budget) {
    case "narrative":
      return { permitted: true as const, reason: "narrative" as const };
    case "state-change-only":
      return proposal.reportsStateChange || proposal.isInputFeedback
        ? { permitted: true as const, reason: "state_change" as const }
        : { permitted: false as const, reason: "narrative_motion_in_workspace" as const };
    case "feedback-only":
      return proposal.isInputFeedback
        ? { permitted: true as const, reason: "input_feedback" as const }
        : { permitted: false as const, reason: "motion_beyond_feedback" as const };
  }
}

/**
 * The four acceptance tests, kept where the code is rather than in a chat message.
 * These are for humans; nothing automated can answer them.
 */
export const QUALITY_TESTS = [
  {
    name: "Jensen",
    question: "Is this credible enough to put in front of investors, physicians, and enterprise partners?",
  },
  {
    name: "Virgil",
    question: "Is there one visual idea someone will still remember tomorrow?",
  },
  {
    name: "Nolan",
    question: "Does interacting with this produce a genuine moment of discovery?",
  },
  {
    name: "Jobs",
    question: "Can anything else be removed without weakening the message? If yes, remove it.",
  },
] as const;

/**
 * The marketing narrative, in order. The site is this sequence; sections are its
 * beats rather than a stack of independent panels.
 */
export const NARRATIVE_SEQUENCE = [
  "fragmentation",
  "observation",
  "connection",
  "intelligence",
  "action",
  "accountability",
  "control",
] as const;

export type NarrativeBeat = (typeof NARRATIVE_SEQUENCE)[number];

/** Zumi orb state for a narrative beat, so the signature tracks the story. */
export const beatOrbState: Record<NarrativeBeat, string> = {
  fragmentation: "dormant",
  observation: "observing",
  connection: "mapping",
  intelligence: "analyzing",
  action: "signal",
  accountability: "signal",
  control: "resolved",
};

/**
 * Visual devices the system permits exactly one of, and where.
 *
 * Virgil's rule inverted into a constraint: the moment a second signature device
 * appears, neither is memorable.
 */
export const SIGNATURE_DEVICE = "zumi-orb";

export const BANNED_VISUAL_DEVICES = [
  "photographic imagery",
  "illustration",
  "repeating pattern or texture",
  "decorative gradient wash",
  "pill buttons",
  "shadow-pop on hover",
  "stacked card shadows",
  "avatars",
  "emoji",
] as const;
