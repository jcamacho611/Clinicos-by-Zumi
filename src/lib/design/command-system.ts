/**
 * Klinikos command design law.
 * Public command surfaces use the same restrained Aegean / Marble / Gold system.
 */
export const commandPalette = {
  ground: "#090d12",
  groundRaised: "#101720",
  aegean: "#1677a8",
  aegeanDeep: "#0b1e3a",
  intelligence: "#43d9ff",
  premium: "#b89a5b",
  marble: "#f1f0eb",
  stone: "#8d98a5",
  rose: "#fb7185",
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
] as const;

export const CLAIM_ONLY_TERMS = [
  "hipaa compliant",
  "certified ehr",
  "guaranteed revenue",
  "patient data accepted here",
] as const;

const NEGATION_CUES = ["not ", "never", "no ", "without", "cannot", "does not", "is not", "are not", "prohibit", "exclude", "outside"] as const;
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

export function findBannedPublicCopy(text: string): string[] {
  const haystack = text.toLowerCase();
  return BANNED_PUBLIC_COPY.filter((phrase) => haystack.includes(phrase));
}

export function findCopyViolations(text: string): string[] {
  return [...findBannedPublicCopy(text), ...findUnqualifiedClaims(text)];
}

export const APPROVED_PUBLIC_COPY = [
  "Klinikos by Zumi",
  "Clinic Operating Analysis",
  "Klinikos Operational Audit",
  "Founding Clinic Qualification",
  "AI Workflow Map",
  "Human Review Required",
  "No PHI",
  "Built toward HIPAA-regulated deployment",
  "Production activation requires review",
  "Operating map",
  "Command center",
] as const;

export const NO_PHI_NOTICE =
  "Do not enter patient names, records, dates of birth, diagnoses, insurance identifiers, or any other protected health information. This experience captures clinic operations and business-system context only.";

export const HUMAN_REVIEW_NOTICE =
  "Submitting a request or a payment does not activate production clinical use, approve PHI workflows, guarantee results, replace licensed judgment, or authorize clinical services. A human reviews every request.";

export const PLATFORM_BOUNDARY_NOTICE =
  "Klinikos by Zumi is built toward HIPAA-regulated deployment. It is not currently presented as a certified replacement EHR, diagnostic tool, clearinghouse, or substitute for licensed clinical judgment. Production activation requires separate review, configuration, contracts, and safeguards.";

export const ELEMENT_ADMISSION_TEST = [
  "Would a clinic owner understand why this is here?",
  "Does this move the user forward?",
  "Does Zumi explain what is happening?",
  "Is the wording premium and business-useful rather than developer-facing?",
  "Is the safety boundary clear?",
  "Does it avoid PHI?",
  "Does it look worthy of a high-ticket clinic operating system?",
] as const;
