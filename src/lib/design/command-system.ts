/**
 * Klinikos Command Design System — cinematic rose operating environment.
 *
 * Shared visual law for authenticated, EDU, operational, and public command surfaces.
 * The approved Klinikos reference establishes the product language: obsidian, black cherry,
 * oxblood, warm ivory, dusty rose, muted coral, and restrained ember highlights.
 *
 * Pure module. No database, no network.
 */

export const commandPalette = {
  ground: "#050303",
  groundRaised: "#0c0607",
  aegean: "#712b31",
  aegeanDeep: "#18090b",
  cyan: "#e6817b",
  cyanDim: "rgba(230,129,123,.08)",
  violet: "#9d5f72",
  gold: "#efaaa1",
  goldDim: "rgba(239,170,161,.08)",
  rose: "#ef7771",
  marble: "#f8efed",
  stone: "#b89f9b",
} as const;

export const commandSurfaces = {
  shell: "min-h-screen bg-[#050303] text-[#f8efed]",
  aegeanField: "pointer-events-none fixed inset-x-0 top-0 h-px bg-[#e6817b]/30",
  panel: "border border-[#e28b85]/15 bg-[#12090b]/70 backdrop-blur-sm",
  panelRaised: "border border-[#e28b85]/15 bg-[#0c0607]",
  panelAi: "border border-[#e6817b]/30 bg-[#e6817b]/[.06]",
  panelReview: "border border-[#efaaa1]/30 bg-[#efaaa1]/[.07]",
  panelBoundary: "border border-[#ef7771]/30 bg-[#ef7771]/[.07]",
  divider: "border-[#e28b85]/15",
  interactive:
    "min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6817b]",
  eyebrow: "text-[11px] font-extrabold uppercase tracking-[.18em] text-[#efaaa1]",
  eyebrowAi: "text-[11px] font-extrabold uppercase tracking-[.18em] text-[#e6817b]",
  headline: "font-light tracking-[-.055em] text-[#f8efed]",
  body: "text-sm leading-7 text-[#cbb6b2]",
  meta: "text-[11px] leading-5 text-[#9f8985]",
} as const;

export const BANNED_PUBLIC_COPY = [
  "start free",
  "free trial",
  "submit form",
  "try our platform",
  "automatically approved",
  "instant approval",
  "instantly live",
  "monetization os",
  "klinikos by zumi",
  "clinicos by zumi",
  "clinicos os",
] as const;

export const CLAIM_ONLY_TERMS = [
  "hipaa compliant",
  "certified ehr",
  "guaranteed revenue",
  "patient data accepted here",
] as const;

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

const NEGATION_WINDOW = 140;

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

export function findCopyViolations(text: string): string[] {
  return [...findBannedPublicCopy(text), ...findUnqualifiedClaims(text)];
}

export const APPROVED_PUBLIC_COPY = [
  "Klinikos",
  "Zumi",
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

export function findBannedPublicCopy(text: string): string[] {
  const haystack = text.toLowerCase();
  return BANNED_PUBLIC_COPY.filter((phrase) => haystack.includes(phrase));
}

export const NO_PHI_NOTICE =
  "Do not enter patient names, records, dates of birth, diagnoses, insurance identifiers, or any other protected health information. This captures clinic operations and software context only.";

export const HUMAN_REVIEW_NOTICE =
  "Submitting a request or a payment does not activate production clinical use, approve PHI workflows, guarantee results, replace licensed judgment, or authorize clinical services. A human reviews every request.";

export const PLATFORM_BOUNDARY_NOTICE =
  "Klinikos is an engineering foundation built toward regulated healthcare deployment. Zumi is Klinikos Intelligence, the assistance layer inside Klinikos, not the product name. Klinikos is not a certified electronic health record, a production clinical system, a clearinghouse, a diagnostic tool, or a substitute for licensed clinical judgment. Production activation requires review.";

export const ELEMENT_ADMISSION_TEST = [
  "Would a clinic owner understand why this is here?",
  "Does this move the user forward?",
  "Does Zumi explain what is happening?",
  "Is the wording premium and business-useful, not internal or developer-facing?",
  "Is the safety boundary clear?",
  "Does it avoid PHI?",
  "Does it look worthy of a high-ticket clinic operating system?",
] as const;

export const GOVERNED_PUBLIC_SURFACES = [
  "src/app/about/page.tsx",
  "src/app/capabilities/page.tsx",
  "src/app/founding-clinic/page.tsx",
  "src/app/grid/join/page.tsx",
  "src/app/how-it-works/page.tsx",
  "src/app/login/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/private-demo/page.tsx",
  "src/app/sales/page.tsx",
  "src/app/start/page.tsx",
] as const;
