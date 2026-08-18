import { demoOffers, type DemoOfferKey } from "@/lib/sales-demo-rules";

/**
 * Zumi command experience.
 *
 * The public intake stops being a form and becomes a guided operating analysis:
 * Zumi asks one focused question at a time, converts each answer into a structured
 * clinic signal, and builds a live operating map the owner can read.
 *
 * Pure module. No database, no network, no AI provider. The signal derivation is
 * deterministic — it is an organised reflection of what the operator told us, not a
 * prediction — which is what lets the interface describe it honestly.
 */

/**
 * Copy law lives in the design system so every surface shares one definition.
 * Re-exported here because the sales flow was its first consumer and these are the
 * import paths its call sites already use.
 */
export {
  APPROVED_PUBLIC_COPY,
  BANNED_PUBLIC_COPY,
  CLAIM_ONLY_TERMS,
  findBannedPublicCopy,
  findCopyViolations,
  findUnqualifiedClaims,
  HUMAN_REVIEW_NOTICE,
  NO_PHI_NOTICE,
} from "@/lib/design/command-system";

// ---------------------------------------------------------------------------
// Mission phases
// ---------------------------------------------------------------------------

export const missionPhases = [
  { key: "brief", label: "Mission Brief" },
  { key: "interview", label: "Zumi Interview" },
  { key: "map", label: "Operating Map" },
  { key: "signal", label: "Signal Analysis" },
  { key: "offer", label: "Engagement" },
  { key: "submit", label: "Private Review" },
  { key: "review", label: "Human Review" },
] as const;

export type MissionPhaseKey = (typeof missionPhases)[number]["key"];

// ---------------------------------------------------------------------------
// The interview
// ---------------------------------------------------------------------------

export type GuidedQuestion = {
  key: string;
  /** Asked in Zumi's voice, one at a time. */
  prompt: string;
  helper: string;
  multiSelect: boolean;
  options: readonly { value: string; label: string; signal: string }[];
};

export const guidedQuestions: readonly GuidedQuestion[] = [
  {
    key: "clinic_type",
    prompt: "What kind of clinic are you operating?",
    helper: "This sets which operating modules matter first.",
    multiSelect: false,
    options: [
      { value: "primary_care", label: "Primary care", signal: "Longitudinal follow-up and results control" },
      { value: "specialty", label: "Specialty", signal: "Referral intake and consultation return" },
      { value: "med_spa", label: "Med spa / aesthetics", signal: "Lead capture and package revenue" },
      { value: "urgent_care", label: "Urgent care", signal: "Throughput and disposition tracking" },
      { value: "multi_site", label: "Multi-location group", signal: "Cross-site capacity and accountability" },
    ],
  },
  {
    key: "bottleneck",
    prompt: "Where does work get stuck most often?",
    helper: "Choose everything that genuinely stalls. Zumi maps each one to an operating surface.",
    multiSelect: true,
    options: [
      { value: "follow_ups", label: "Follow-ups", signal: "Follow-up Control" },
      { value: "paperwork", label: "Paperwork", signal: "Paperwork Readiness" },
      { value: "missed_calls", label: "Missed calls", signal: "Patient Access" },
      { value: "no_shows", label: "No-shows", signal: "Schedule Integrity" },
      { value: "billing_readiness", label: "Billing readiness", signal: "Billing Readiness" },
      { value: "med_spa_leads", label: "Med spa leads", signal: "Med Spa Revenue" },
      { value: "results", label: "Results review", signal: "Referral / Results Tracking" },
      { value: "referrals", label: "Referrals", signal: "Referral / Results Tracking" },
      { value: "staff_accountability", label: "Staff accountability", signal: "Staff Ownership" },
      { value: "provider_coordination", label: "Provider coordination", signal: "Provider Availability" },
    ],
  },
  {
    key: "current_system",
    prompt: "What are you running the clinic on today?",
    helper: "Integration readiness depends on what already exists.",
    multiSelect: false,
    options: [
      { value: "legacy_ehr", label: "A legacy EHR", signal: "Migration and interface review required" },
      { value: "modern_ehr", label: "A modern EHR", signal: "Adapter review required" },
      { value: "paper_mixed", label: "Paper and spreadsheets", signal: "Greenfield operating build" },
      { value: "none", label: "Nothing consistent", signal: "Greenfield operating build" },
    ],
  },
  {
    key: "manual_tracking",
    prompt: "What does your staff still track by hand?",
    helper: "Manual tracking is where work quietly disappears.",
    multiSelect: true,
    options: [
      { value: "sticky_notes", label: "Notes and whiteboards", signal: "No durable task ownership" },
      { value: "spreadsheets", label: "Spreadsheets", signal: "Parallel record risk" },
      { value: "inbox", label: "A shared inbox", signal: "Unrouted inbound work" },
      { value: "memory", label: "Staff memory", signal: "Single-point-of-failure ownership" },
      { value: "nothing", label: "Nothing manual", signal: "Existing process discipline" },
    ],
  },
  {
    key: "revenue_belief",
    prompt: "Where do you believe money is being lost?",
    helper: "Zumi records this as a category to review, not as a finding.",
    multiSelect: true,
    options: [
      { value: "unbilled", label: "Work delivered but never billed", signal: "Claim readiness gap" },
      { value: "denials", label: "Denials never reworked", signal: "Denial recovery gap" },
      { value: "no_shows_rev", label: "Empty chairs and no-shows", signal: "Schedule utilisation gap" },
      { value: "lost_leads", label: "Leads that never converted", signal: "Lead follow-up gap" },
      { value: "unsure", label: "Not sure yet", signal: "Requires operating review" },
    ],
  },
  {
    key: "first_control",
    prompt: "What would you want Klinikos to take control of first?",
    helper: "This becomes the recommended starting module.",
    multiSelect: false,
    options: [
      { value: "follow_ups", label: "Follow-up control", signal: "Task and escalation layer" },
      { value: "front_desk", label: "Front desk and access", signal: "Access and scheduling layer" },
      { value: "billing", label: "Billing readiness", signal: "Claim readiness layer" },
      { value: "med_spa", label: "Med spa revenue", signal: "Luxe Medi layer" },
      { value: "coordination", label: "Referrals and results", signal: "Care coordination layer" },
    ],
  },
];

export type InterviewAnswers = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Operating map
// ---------------------------------------------------------------------------

export const operatingMapSurfaces = [
  { key: "follow_up_control", label: "Follow-up Control", triggers: ["follow_ups", "results"] },
  { key: "paperwork_readiness", label: "Paperwork Readiness", triggers: ["paperwork"] },
  { key: "staff_ownership", label: "Staff Ownership", triggers: ["staff_accountability", "sticky_notes", "memory"] },
  { key: "billing_readiness", label: "Billing Readiness", triggers: ["billing_readiness", "unbilled", "denials"] },
  { key: "med_spa_revenue", label: "Med Spa Revenue", triggers: ["med_spa_leads", "lost_leads", "med_spa"] },
  { key: "referral_results", label: "Referral / Results Tracking", triggers: ["referrals", "results"] },
  { key: "patient_access", label: "Patient Access", triggers: ["missed_calls", "no_shows", "no_shows_rev"] },
  { key: "provider_availability", label: "Provider Availability", triggers: ["provider_coordination"] },
] as const;

export type OperatingSignalStatus = "attention" | "review" | "stable";

export type OperatingSignal = {
  key: string;
  label: string;
  status: OperatingSignalStatus;
  detected: string;
  whyItMatters: string;
  humanReview: string;
};

const whyItMatters: Record<string, string> = {
  follow_up_control: "Work that leaves the room without an owner is the most common place a clinic loses continuity.",
  paperwork_readiness: "Incomplete paperwork blocks the visit, the note, and the claim behind it.",
  staff_ownership: "Tasks held in memory or on paper cannot be reassigned, escalated, or audited.",
  billing_readiness: "Revenue is decided before the claim goes out, by whether the encounter was ready.",
  med_spa_revenue: "Aesthetic demand is time-sensitive; an unworked lead is usually a lost one.",
  referral_results: "An unclosed referral or unreviewed result is both a care risk and an operational gap.",
  patient_access: "Access failures are invisible in most systems because the patient simply never appears.",
  provider_availability: "Coordination gaps show up as idle capacity in one place and backlog in another.",
};

/**
 * Derive the operating map from the interview answers.
 *
 * Deliberately deterministic. Each surface is marked for attention only because the
 * operator selected something that maps to it, which is why the copy says
 * "you reported" rather than "we detected".
 */
export function deriveOperatingMap(answers: InterviewAnswers): OperatingSignal[] {
  const selected = new Set(Object.values(answers).flat());

  return operatingMapSurfaces.map((surface) => {
    const hits = surface.triggers.filter((trigger) => selected.has(trigger));
    const status: OperatingSignalStatus = hits.length >= 2 ? "attention" : hits.length === 1 ? "review" : "stable";
    return {
      key: surface.key,
      label: surface.label,
      status,
      detected: hits.length
        ? `You reported ${hits.length} related pressure point${hits.length === 1 ? "" : "s"} here.`
        : "Nothing reported here yet.",
      whyItMatters: whyItMatters[surface.key] ?? "",
      humanReview: status === "stable"
        ? "No review requested."
        : "A Klinikos reviewer confirms this with you before any production activation.",
    };
  });
}

export type OperatingSignalSummary = {
  topBottleneck: string;
  leakageCategory: string;
  accountabilityGap: string;
  recommendedModule: string;
  nextBestAction: string;
  /** Rendered verbatim so the hedging cannot be edited away by a caller. */
  narrative: string;
};

const moduleForFirstControl: Record<string, string> = {
  follow_ups: "Task & Escalation Command",
  front_desk: "Front Desk & Access",
  billing: "Claim Readiness",
  med_spa: "Luxe Medi Studio",
  coordination: "Referral Relay & Results",
};

/**
 * Summarise the analysis.
 *
 * Every claim is hedged on purpose — "appears", "may", "should be reviewed". This is
 * an organised restatement of what the operator reported, and the language must not
 * imply Klinikos measured their clinic.
 */
export function deriveSignalSummary(answers: InterviewAnswers): OperatingSignalSummary {
  const map = deriveOperatingMap(answers);
  const ranked = [...map].sort((a, b) => {
    const weight = (status: OperatingSignalStatus) => (status === "attention" ? 2 : status === "review" ? 1 : 0);
    return weight(b.status) - weight(a.status);
  });

  const top = ranked[0]?.status === "stable" ? null : ranked[0];
  const revenue = answers.revenue_belief ?? [];
  const manual = answers.manual_tracking ?? [];
  const firstControl = answers.first_control?.[0] ?? "";

  const leakageCategory = revenue.includes("unbilled")
    ? "Encounters that may not have reached a billable state"
    : revenue.includes("denials")
      ? "Denials that may never have been reworked"
      : revenue.includes("lost_leads")
        ? "Inbound demand that may not have been followed up"
        : revenue.includes("no_shows_rev")
          ? "Schedule utilisation that may be below capacity"
          : "Not yet identified — requires operating review";

  const accountabilityGap = manual.includes("memory") || manual.includes("sticky_notes")
    ? "Task ownership appears to rely on individual staff memory rather than a durable queue"
    : manual.includes("spreadsheets") || manual.includes("inbox")
      ? "Work appears to live in parallel tools outside the clinic record"
      : "No significant manual-tracking gap reported";

  return {
    topBottleneck: top?.label ?? "No dominant bottleneck reported",
    leakageCategory,
    accountabilityGap,
    recommendedModule: moduleForFirstControl[firstControl] ?? "To be determined during review",
    nextBestAction: "Request a Private Workflow Review so a human can confirm this map against your actual operations.",
    narrative: top
      ? `Based on what you reported, your clinic appears to lose the most control around ${top.label.toLowerCase()}. ${leakageCategory} should be reviewed before any production workflow is activated. This is an estimated category derived from your answers, not a measurement of your clinic, and it requires human confirmation.`
      : "You have not yet reported a dominant operational bottleneck. A Private Workflow Review would establish a baseline before any production workflow is activated.",
  };
}

// ---------------------------------------------------------------------------
// Engagement options
// ---------------------------------------------------------------------------

export type EngagementOffer = {
  key: DemoOfferKey;
  name: string;
  shortPrice: string;
  bestFor: string;
  whatHappens: string;
  cta: string;
  creditForward: string;
};

/** Offer copy layered over the existing server-controlled pricing. */
export const engagementOffers: readonly EngagementOffer[] = [
  {
    key: "private_workflow_demo",
    name: "Private Workflow Review",
    shortPrice: demoOffers.private_workflow_demo.shortPrice,
    bestFor: "Clinics that want Klinikos to map where work is getting lost before committing to implementation.",
    whatHappens: "Zumi prepares the workflow map, then a human reviews the clinic's operational fit.",
    cta: "Request Private Workflow Review",
    creditForward: demoOffers.private_workflow_demo.creditForward,
  },
  {
    key: "founding_clinic_evaluation",
    name: "Founding Clinic Evaluation",
    shortPrice: demoOffers.founding_clinic_evaluation.shortPrice,
    bestFor: "Operators seriously considering Klinikos as their clinic command layer.",
    whatHappens: "Klinikos reviews workflow needs, staff roles, current systems, implementation scope, and launch readiness.",
    cta: "Apply for Founding Evaluation",
    creditForward: demoOffers.founding_clinic_evaluation.creditForward,
  },
  {
    key: "founding_clinic_program",
    name: "Founding Clinic Implementation",
    shortPrice: demoOffers.founding_clinic_program.shortPrice,
    bestFor: "Clinics ready to become early founding partners.",
    whatHappens: "Founder-guided setup, workflow configuration, role mapping, initial operating system buildout, and priority implementation planning.",
    cta: "Apply for Founding Clinic Seat",
    creditForward: demoOffers.founding_clinic_program.creditForward,
  },
];

/** Interview completeness, used to gate the map and the summary. */
export function interviewProgress(answers: InterviewAnswers) {
  const answered = guidedQuestions.filter((question) => (answers[question.key]?.length ?? 0) > 0).length;
  return { answered, total: guidedQuestions.length, complete: answered === guidedQuestions.length };
}

// ---------------------------------------------------------------------------
// Audit pricing and preliminary qualification
// ---------------------------------------------------------------------------

/**
 * Price of the Clinic Operating Analysis from the canonical commercial offer.
 *
 * The legacy helper remains for compatible call sites, but provider scale cannot
 * change the price attached to the one configured GoDaddy paylink.
 */
export function auditPriceForAnswers(_answers: InterviewAnswers) {
  return demoOffers.private_workflow_demo.priceCents / 100;
}

/**
 * Preliminary audit-fit score, 0–100.
 *
 * Scored entirely from what the clinic reported about itself. It is a prioritisation
 * signal for a human, never a qualification decision — which is why the label below
 * never says "qualified".
 */
export function preliminaryAuditScore(answers: InterviewAnswers) {
  const provider = answers.provider_scale?.[0];
  const locations = answers.location_scale?.[0];
  const spend = answers.software_spend?.[0];
  const bottlenecks = answers.bottleneck ?? [];
  const revenue = answers.revenue_belief ?? [];

  let score = 0;
  score += provider === "30_plus" || provider === "16_30" ? 20 : provider === "6_15" ? 18 : provider === "2_5" ? 15 : 8;
  score += locations === "6_plus" || locations === "3_5" ? 15 : locations === "2" ? 10 : 4;
  score += Math.min(20, bottlenecks.length * 4);
  score += spend === "10k_plus" ? 15 : spend === "5k_10k" ? 13 : spend === "2k_5k" ? 9 : spend === "under_2k" ? 4 : 2;
  // "Unsure" is not evidence of revenue leakage and does not score.
  score += Math.min(15, revenue.filter((item) => item !== "unsure").length * 5);
  score += answers.current_system?.[0] === "many_systems" ? 10 : 6;
  score += answers.first_control?.length ? 5 : 0;
  return Math.min(100, score);
}

/**
 * The label shown for a score.
 *
 * Deliberately never says "qualified" or "approved". A person decides that, and the
 * copy law forbids implying an automatic approval.
 */
export function preliminaryQualificationLabel(score: number) {
  return score >= 70 ? "STRONG AUDIT CANDIDATE" : score >= 45 ? "SPECIALIST REVIEW RECOMMENDED" : "MORE QUALIFICATION NEEDED";
}
