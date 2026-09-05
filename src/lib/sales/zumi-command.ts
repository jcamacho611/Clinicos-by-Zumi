import { demoOffers, type DemoOfferKey } from "@/lib/sales-demo-rules";

/**
 * Zumi's public commercial command is deterministic and outcome-first. It organizes
 * what an operator reported into unfinished-work signals, prepares a first useful
 * result, and leaves consequential commercial decisions to governed review.
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

export const missionPhases = [
  { key: "brief", label: "Mission Brief" },
  { key: "interview", label: "Zumi Interview" },
  { key: "map", label: "Unfinished Work Map" },
  { key: "signal", label: "Economic Signal" },
  { key: "first_value", label: "First Useful Result" },
  { key: "review", label: "Human Review" },
  { key: "next", label: "Governed Next Action" },
] as const;

export type MissionPhaseKey = (typeof missionPhases)[number]["key"];

export type GuidedQuestion = {
  key: string;
  prompt: string;
  helper: string;
  multiSelect: boolean;
  options: readonly { value: string; label: string; signal: string }[];
};

export const guidedQuestions: readonly GuidedQuestion[] = [
  {
    key: "clinic_type",
    prompt: "What kind of organization are you operating?",
    helper: "This sets which operating surfaces matter first.",
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
    helper: "Choose what genuinely stalls. Zumi maps each answer to unfinished work that can be reviewed.",
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
    prompt: "What are you running the organization on today?",
    helper: "Klinikos is designed to coordinate around existing systems; this tells us what must be reviewed, not what must be replaced.",
    multiSelect: false,
    options: [
      { value: "legacy_ehr", label: "A legacy EHR", signal: "Interface review required" },
      { value: "modern_ehr", label: "A modern EHR", signal: "Adapter review required" },
      { value: "paper_mixed", label: "Paper and spreadsheets", signal: "Greenfield coordination opportunity" },
      { value: "none", label: "Nothing consistent", signal: "Greenfield coordination opportunity" },
    ],
  },
  {
    key: "manual_tracking",
    prompt: "What does your staff still track by hand?",
    helper: "Manual tracking is often where work loses a durable owner or completion receipt.",
    multiSelect: true,
    options: [
      { value: "sticky_notes", label: "Notes and whiteboards", signal: "No durable task ownership" },
      { value: "spreadsheets", label: "Spreadsheets", signal: "Parallel work queue" },
      { value: "inbox", label: "A shared inbox", signal: "Unrouted inbound work" },
      { value: "memory", label: "Staff memory", signal: "Single-point-of-failure ownership" },
      { value: "nothing", label: "Nothing manual", signal: "Existing process discipline" },
    ],
  },
  {
    key: "revenue_belief",
    prompt: "Where do you believe money or capacity may be leaking?",
    helper: "Zumi records this as a category to investigate, not as a verified financial finding.",
    multiSelect: true,
    options: [
      { value: "unbilled", label: "Work delivered but never billed", signal: "Claim readiness gap" },
      { value: "denials", label: "Denials never reworked", signal: "Denial recovery gap" },
      { value: "no_shows_rev", label: "Empty chairs and no-shows", signal: "Schedule utilization gap" },
      { value: "lost_leads", label: "Leads that never converted", signal: "Lead follow-up gap" },
      { value: "unsure", label: "Not sure yet", signal: "Requires baseline review" },
    ],
  },
  {
    key: "first_control",
    prompt: "What would you want Klinikos to make more reliable first?",
    helper: "This becomes the first useful-result hypothesis, not an automatic product sale.",
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
  follow_up_control: "Work that leaves the room without an owner can lose continuity.",
  paperwork_readiness: "Incomplete paperwork can block the visit, note, or billing-readiness work behind it.",
  staff_ownership: "Tasks held in memory or on paper cannot be reliably reassigned, escalated, or evidenced.",
  billing_readiness: "Revenue can be delayed when encounter work does not reach a reviewable billing-ready state.",
  med_spa_revenue: "Time-sensitive demand can lose value when follow-up is delayed or unowned.",
  referral_results: "An unclosed referral or unreviewed result can create clinical and operating follow-through risk.",
  patient_access: "Access failures may show up as demand that never becomes a completed workflow.",
  provider_availability: "Coordination gaps can create unused capacity in one place and backlog in another.",
};

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
      humanReview: status === "stable" ? "No review requested." : "A Klinikos reviewer confirms the real workflow before production or commercial claims are made.",
    };
  });
}

export type OperatingSignalSummary = {
  topBottleneck: string;
  leakageCategory: string;
  accountabilityGap: string;
  recommendedModule: string;
  nextBestAction: string;
  narrative: string;
};

const moduleForFirstControl: Record<string, string> = {
  follow_ups: "Task & Escalation Command",
  front_desk: "Front Desk & Access",
  billing: "Claim Readiness",
  med_spa: "Luxe Medi Studio",
  coordination: "Referral Relay & Results",
};

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
      ? "Denials that may not have been reworked"
      : revenue.includes("lost_leads")
        ? "Inbound demand that may not have been followed up"
        : revenue.includes("no_shows_rev")
          ? "Schedule utilization that may be below available capacity"
          : "Not yet identified — requires a baseline";

  const accountabilityGap = manual.includes("memory") || manual.includes("sticky_notes")
    ? "Task ownership appears to rely on individual staff memory rather than a durable queue"
    : manual.includes("spreadsheets") || manual.includes("inbox")
      ? "Work appears to live in parallel tools outside the primary workflow"
      : "No significant manual-tracking gap reported";

  const recommendedModule = moduleForFirstControl[firstControl] ?? "To be determined during review";
  return {
    topBottleneck: top?.label ?? "No dominant bottleneck reported",
    leakageCategory,
    accountabilityGap,
    recommendedModule,
    nextBestAction: `Produce a bounded first useful result around ${recommendedModule} and record the baseline, completion evidence, and observed result before discussing paid expansion.`,
    narrative: top
      ? `Based on what you reported, ${top.label.toLowerCase()} appears to be a useful place to test whether Klinikos can improve control. ${leakageCategory} should be treated as a hypothesis until evidence is reviewed. The next step is a bounded first useful result, not an automatic purchase or meeting.`
      : "You have not reported a dominant operational bottleneck yet. Establish a baseline and one bounded first useful result before discussing paid capability.",
  };
}

export type EngagementOffer = {
  key: DemoOfferKey;
  name: string;
  shortPrice: string;
  bestFor: string;
  whatHappens: string;
  cta: string;
  rule: string;
};

export const engagementOffers: readonly EngagementOffer[] = [
  {
    key: "first_value",
    name: demoOffers.first_value.name,
    shortPrice: demoOffers.first_value.shortPrice,
    bestFor: "Organizations that want to see whether Klinikos can make one piece of unfinished work more reliable before they buy anything.",
    whatHappens: "Zumi organizes the reported workflow into a bounded first-result hypothesis. Human review prevents the result from being overstated.",
    cta: "Show Klinikos what needs to happen",
    rule: demoOffers.first_value.rule,
  },
  {
    key: "deep_operating_audit",
    name: demoOffers.deep_operating_audit.name,
    shortPrice: demoOffers.deep_operating_audit.shortPrice,
    bestFor: "Organizations whose first-value evidence reveals material workflow or economic complexity that deserves a deeper scoped review.",
    whatHappens: "Klinikos reviews the operating baseline, unfinished work, economic consequence, evidence, and prioritized actions.",
    cta: "Review whether a deep audit is justified",
    rule: demoOffers.deep_operating_audit.rule,
  },
  {
    key: "proof_sprint",
    name: demoOffers.proof_sprint.name,
    shortPrice: demoOffers.proof_sprint.shortPrice,
    bestFor: "Organizations that want to prove one bounded operating outcome before broader deployment.",
    whatHappens: "Klinikos defines the baseline, bounded work, completion evidence, and measured result for a reviewed proof scope.",
    cta: "Review whether a proof sprint fits",
    rule: demoOffers.proof_sprint.rule,
  },
];

export function interviewProgress(answers: InterviewAnswers) {
  const answered = guidedQuestions.filter((question) => (answers[question.key]?.length ?? 0) > 0).length;
  return { answered, total: guidedQuestions.length, complete: answered === guidedQuestions.length };
}

/**
 * A prioritization signal based only on what the organization reported. This is not an
 * approval, measurement, or product-selection engine.
 */
export function preliminaryOpportunityScore(answers: InterviewAnswers) {
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
  score += Math.min(15, revenue.filter((item) => item !== "unsure").length * 5);
  score += answers.current_system?.[0] === "many_systems" ? 10 : 6;
  score += answers.first_control?.length ? 5 : 0;
  return Math.min(100, score);
}

export function preliminaryQualificationLabel(score: number) {
  return score >= 70 ? "STRONG FIRST-VALUE SIGNAL" : score >= 45 ? "REVIEW RECOMMENDED" : "MORE CONTEXT NEEDED";
}
