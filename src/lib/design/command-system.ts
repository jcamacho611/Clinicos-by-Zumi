/**
 * Klinikos Command Design System — "Black Ops x Aegean Medical Intelligence".
 *
 * This module is design law, not a suggestion. Every authenticated and public
 * Klinikos surface renders its ground, panels, and accents from these tokens, and
 * a test asserts the public surfaces obey the copy rules below.
 *
 * The reason it lives in code rather than a style guide: a palette written in a
 * document drifts the moment two people build two pages. A palette imported by both
 * pages cannot.
 *
 * Pure module. No database, no network.
 */

/**
 * Palette.
 *
 * Graphite/navy ground, Aegean blue structure, cyan reserved for the AI layer,
 * gold used sparingly for human-review and value moments, rose for boundaries the
 * operator must not cross. Cyan is never decorative — if it glows, Zumi is involved.
 */
export const commandPalette = {
  ground: "#05090f",
  groundRaised: "#070d15",
  aegean: "#174ea6",
  aegeanDeep: "#0b1e3a",
  cyan: "#67e8f9",
  cyanDim: "rgba(103,232,249,.08)",
  violet: "#7c6bd6",
  gold: "#e6c55b",
  goldDim: "rgba(230,197,91,.08)",
  rose: "#fb7185",
  marble: "#f7f8fa",
  stone: "#94a3b8",
} as const;

/**
 * Surface recipes.
 *
 * Glass panels are translucent borders over the dark ground — never a stacked
 * decorative gradient, and never a nested card inside another card.
 */
export const commandSurfaces = {
  shell: "min-h-screen bg-[#05090f] text-slate-100",
  /**
   * Flat ground. The design system permits no photographic imagery, illustration,
   * or repeating texture, and the only texture allowed is the Zumi orb's own
   * geometry — so the Aegean presence is a hairline horizon, not a gradient wash.
   */
  aegeanField: "pointer-events-none fixed inset-x-0 top-0 h-px bg-[#174ea6]/40",
  panel: "border border-white/10 bg-white/[.04] backdrop-blur-sm",
  panelRaised: "border border-white/10 bg-[#070d15]",
  panelAi: "border border-cyan-300/30 bg-cyan-400/[.06]",
  panelReview: "border border-[#e6c55b]/30 bg-[#e6c55b]/[.07]",
  panelBoundary: "border border-rose-400/30 bg-rose-500/[.07]",
  divider: "border-white/10",
  /** Minimum 44px target, visible focus ring, no colour-only state. */
  interactive:
    "min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
  eyebrow: "text-[11px] font-extrabold uppercase tracking-[.18em] text-[#e6c55b]",
  eyebrowAi: "text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300",
  headline: "font-extrabold tracking-[-.065em] text-white",
  body: "text-sm leading-7 text-slate-300",
  meta: "text-[11px] leading-5 text-slate-400",
} as const;

// ---------------------------------------------------------------------------
// Copy law
// ---------------------------------------------------------------------------

/**
 * Vocabulary that may never appear on a public Klinikos surface.
 *
 * Several of these are regulatory claims the product cannot support; the rest
 * misrepresent what a payment or a submission actually does. Enforced by test
 * across every public page, not left to review.
 */
export const BANNED_PUBLIC_COPY = [
  "start free",
  "free trial",
  "submit form",
  "try our platform",
  "automatically approved",
  "instant approval",
  "instantly live",
  "monetization os",
] as const;

/**
 * Regulatory terms that are forbidden as *claims* but required in *disclaimers*.
 *
 * "Klinikos is not a certified EHR" is the sentence we most need to be able to
 * write; "Klinikos is a certified EHR" is the sentence that must never ship. A flat
 * substring ban cannot tell those apart, and banning the phrase outright would
 * push pages into vaguer disclaimers — the opposite of the intent.
 */
export const CLAIM_ONLY_TERMS = [
  "hipaa compliant",
  "certified ehr",
  "guaranteed revenue",
  "patient data accepted here",
] as const;

/** Cues that mark the surrounding sentence as a denial rather than an assertion. */
const NEGATION_CUES = [
  "not ",
  "never",
  "no ",
  "without",
  "cannot",
  "does not",
  "is not",
  "are not",
  "prohibit",
  "exclude",
  "outside",
] as const;

/** How far back to look for a negation cue. One clause, not one page. */
const NEGATION_WINDOW = 140;

/**
 * Flag a claim-only term unless the text immediately before it denies it.
 *
 * Deliberately conservative: an unqualified occurrence is reported, so the failure
 * mode is a reviewer being asked to confirm a disclaimer reads clearly, not a claim
 * slipping through.
 */
export function findUnqualifiedClaims(text: string): string[] {
  const haystack = text.toLowerCase();
  const found: string[] = [];

  for (const term of CLAIM_ONLY_TERMS) {
    let index = haystack.indexOf(term);
    while (index !== -1) {
      const preceding = haystack.slice(Math.max(0, index - NEGATION_WINDOW), index);
      if (!NEGATION_CUES.some((cue) => preceding.includes(cue))) {
        found.push(term);
        break;
      }
      index = haystack.indexOf(term, index + term.length);
    }
  }

  return found;
}

/** Everything a public surface must not say, checked with the right rule for each. */
export function findCopyViolations(text: string): string[] {
  return [...findBannedPublicCopy(text), ...findUnqualifiedClaims(text)];
}

export const APPROVED_PUBLIC_COPY = [
  "Klinikos by Zumi",
  "Clinic Operating Analysis",
  "Private Workflow Review",
  "Founding Clinic Qualification",
  "AI Workflow Map",
  "Human Review Required",
  "No PHI",
  "Built toward regulated healthcare deployment",
  "Production activation requires review",
  "Workflow signal",
  "Operating map",
  "Command center",
] as const;

/** Returns every banned phrase found, so a surface can be corrected in one pass. */
export function findBannedPublicCopy(text: string): string[] {
  const haystack = text.toLowerCase();
  return BANNED_PUBLIC_COPY.filter((phrase) => haystack.includes(phrase));
}

export const NO_PHI_NOTICE =
  "Do not enter patient names, records, dates of birth, diagnoses, insurance identifiers, or any other protected health information. This captures clinic operations and software context only.";

export const HUMAN_REVIEW_NOTICE =
  "Submitting a request or a payment does not activate production clinical use, approve PHI workflows, guarantee results, replace licensed judgment, or authorize clinical services. A human reviews every request.";

export const PLATFORM_BOUNDARY_NOTICE =
  "Klinikos by Zumi is an engineering foundation built toward regulated healthcare deployment. It is not a certified electronic health record, a production clinical system, a clearinghouse, a diagnostic tool, or a substitute for licensed clinical judgment. Production activation requires review.";

/**
 * The seven-question test every visible element must pass.
 *
 * Kept in code so a reviewer can point at it, and so it is versioned with the
 * product rather than living in a chat message.
 */
export const ELEMENT_ADMISSION_TEST = [
  "Would a clinic owner understand why this is here?",
  "Does this move the user forward?",
  "Does Zumi explain what is happening?",
  "Is the wording premium and business-useful, not internal or developer-facing?",
  "Is the safety boundary clear?",
  "Does it avoid PHI?",
  "Does it look worthy of a high-ticket clinic operating system?",
] as const;

/**
 * Public surfaces governed by this system. The design-law test reads this list, so
 * adding a page here is what brings it under enforcement.
 */
export const GOVERNED_PUBLIC_SURFACES = [
  "src/app/page.tsx",
  "src/app/sales/page.tsx",
  "src/app/start/page.tsx",
  "src/app/private-demo/page.tsx",
  "src/app/founding-clinic/page.tsx",
  "src/app/grid/join/page.tsx",
  // Growth Engine surfaces. Every public marketing route belongs here — copy law is
  // only enforced on what this list names, so an unlisted page is an unreviewed one.
  "src/app/how-it-works/page.tsx",
  "src/app/solutions/[segment]/page.tsx",
  "src/app/zumi/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/demo/page.tsx",
  "src/app/operational-audit/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/referral/[code]/page.tsx",
  // Content modules those pages render. A claim moved out of a page into a data file
  // would otherwise escape the check entirely.
  "src/lib/growth/demonstration.ts",
  "src/lib/growth/segments.ts",
  "src/lib/growth/pricing.ts",
  "src/lib/growth/audit-checkout.ts",
  "src/components/growth/marketing-shell.tsx",
  "src/components/growth/zumi-demonstration.tsx",
  "src/components/growth/guided-tour.tsx",
  "src/components/growth/lead-capture-form.tsx",
  "src/components/growth/audit-checkout.tsx",
] as const;
