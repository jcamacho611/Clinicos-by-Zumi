import {
  APPROVED_PUBLIC_COPY,
  BANNED_PUBLIC_COPY,
  CLAIM_ONLY_TERMS,
  findBannedPublicCopy,
  findCopyViolations,
  findUnqualifiedClaims,
  HUMAN_REVIEW_NOTICE,
  NO_PHI_NOTICE,
} from "@/lib/design/command-system";

export {
  APPROVED_PUBLIC_COPY,
  BANNED_PUBLIC_COPY,
  CLAIM_ONLY_TERMS,
  findBannedPublicCopy,
  findCopyViolations,
  findUnqualifiedClaims,
  HUMAN_REVIEW_NOTICE,
  NO_PHI_NOTICE,
};

export const missionPhases = [
  { key: "brief", label: "Mission Brief" },
  { key: "interview", label: "Zumi Interview" },
  { key: "map", label: "Operating Map" },
  { key: "signal", label: "Qualification Signal" },
  { key: "offer", label: "Paid Audit" },
  { key: "review", label: "Specialist Review" },
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
    prompt: "What kind of clinic are you operating?",
    helper: "This sets which operating surfaces matter first.",
    multiSelect: false,
    options: [
      { value: "primary_care", label: "Primary care", signal: "Longitudinal follow-up" },
      { value: "specialty", label: "Specialty", signal: "Referral coordination" },
      { value: "med_spa", label: "Primary care + aesthetics / weight loss", signal: "Mixed insurance + cash-pay operations" },
      { value: "urgent_care", label: "Urgent care", signal: "Throughput control" },
      { value: "multi_site", label: "Multi-location group", signal: "Cross-site accountability" },
    ],
  },
  {
    key: "provider_scale",
    prompt: "How many providers work across the practice?",
    helper: "Provider scale sets the starting Operational Audit fee and helps us estimate operating complexity.",
    multiSelect: false,
    options: [
      { value: "1", label: "1 provider", signal: "Solo / micro practice" },
      { value: "2_5", label: "2–5 providers", signal: "Core founding-clinic scale" },
      { value: "6_15", label: "6–15 providers", signal: "Advanced operating complexity" },
      { value: "16_30", label: "16–30 providers", signal: "Multi-provider operating group" },
      { value: "30_plus", label: "30+ providers", signal: "Custom network review" },
    ],
  },
  {
    key: "location_scale",
    prompt: "How many locations are you coordinating?",
    helper: "Multiple sites increase handoffs, ownership, staffing and visibility requirements.",
    multiSelect: false,
    options: [
      { value: "1", label: "1 location", signal: "Single-site operations" },
      { value: "2", label: "2 locations", signal: "Cross-site coordination" },
      { value: "3_5", label: "3–5 locations", signal: "Multi-location command need" },
      { value: "6_plus", label: "6+ locations", signal: "Network-scale operations" },
    ],
  },
  {
    key: "bottleneck",
    prompt: "Where does work get stuck most often?",
    helper: "Choose everything that genuinely stalls. Zumi maps each answer to an operating surface.",
    multiSelect: true,
    options: [
      { value: "follow_ups", label: "Follow-ups", signal: "Follow-up Control" },
      { value: "paperwork", label: "Paperwork", signal: "Paperwork Readiness" },
      { value: "missed_calls", label: "Missed calls", signal: "Patient Access" },
      { value: "no_shows", label: "No-shows", signal: "Schedule Integrity" },
      { value: "billing_readiness", label: "Billing / claim readiness", signal: "Revenue Readiness" },
      { value: "results", label: "Results review", signal: "Results Tracking" },
      { value: "referrals", label: "Referrals", signal: "Referral Tracking" },
      { value: "staff_accountability", label: "Staff accountability", signal: "Staff Ownership" },
      { value: "provider_coordination", label: "Provider coordination", signal: "Provider Capacity" },
    ],
  },
  {
    key: "current_system",
    prompt: "What are you running the clinic on today?",
    helper: "Klinikos is designed to replace unnecessary bills and connect relationships that still need to remain external.",
    multiSelect: false,
    options: [
      { value: "many_systems", label: "Several disconnected systems", signal: "High fragmentation opportunity" },
      { value: "legacy_ehr", label: "Legacy EHR + add-ons", signal: "Integration and consolidation review" },
      { value: "modern_ehr", label: "Modern EHR + separate tools", signal: "Operating-layer opportunity" },
      { value: "paper_mixed", label: "Paper / spreadsheets / mixed tools", signal: "Greenfield workflow opportunity" },
    ],
  },
  {
    key: "software_spend",
    prompt: "About how much do the clinic's software and operating subscriptions cost each month?",
    helper: "A range is enough. We treat this as clinic-reported until the specialist audit verifies it.",
    multiSelect: false,
    options: [
      { value: "unknown", label: "I need to add it up", signal: "Cost stack not yet measured" },
      { value: "under_2k", label: "Under $2,000", signal: "Lower subscription burden" },
      { value: "2k_5k", label: "$2,000–$5,000", signal: "Meaningful cost stack" },
      { value: "5k_10k", label: "$5,000–$10,000", signal: "High cost-stack opportunity" },
      { value: "10k_plus", label: "$10,000+", signal: "Major cost-stack opportunity" },
    ],
  },
  {
    key: "revenue_belief",
    prompt: "Where do you believe money or capacity is being lost?",
    helper: "Zumi records this as a category to investigate. It is not treated as a verified finding yet.",
    multiSelect: true,
    options: [
      { value: "unbilled", label: "Work delivered but not billed cleanly", signal: "Claim readiness review" },
      { value: "denials", label: "Denials / unresolved A/R", signal: "Revenue follow-through review" },
      { value: "no_shows_rev", label: "No-shows / unused capacity", signal: "Schedule recovery review" },
      { value: "lost_leads", label: "Calls or leads that never converted", signal: "Lead recovery review" },
      { value: "referral_loss", label: "Referrals that never close", signal: "Referral leakage review" },
      { value: "unsure", label: "Not sure yet", signal: "Requires specialist audit" },
    ],
  },
  {
    key: "first_control",
    prompt: "What would make tomorrow feel easier first?",
    helper: "This becomes the first operating surface we recommend reviewing.",
    multiSelect: false,
    options: [
      { value: "follow_ups", label: "Stop losing follow-ups", signal: "Task and escalation layer" },
      { value: "front_desk", label: "Reduce front-desk strain", signal: "Access and scheduling layer" },
      { value: "billing", label: "Get cleaner revenue follow-through", signal: "Revenue readiness layer" },
      { value: "costs", label: "Cut unnecessary subscriptions", signal: "Cost consolidation layer" },
      { value: "coordination", label: "Control referrals and results", signal: "Care coordination layer" },
    ],
  },
];

export type InterviewAnswers = Record<string, string[]>;
export type OperatingSignalStatus = "attention" | "review" | "stable";
export type OperatingSignal = { key: string; label: string; status: OperatingSignalStatus; detected: string; whyItMatters: string; humanReview: string };

const operatingMapSurfaces = [
  { key: "follow_up_control", label: "Follow-up Control", triggers: ["follow_ups", "results"] },
  { key: "paperwork_readiness", label: "Paperwork Readiness", triggers: ["paperwork"] },
  { key: "staff_ownership", label: "Staff Ownership", triggers: ["staff_accountability"] },
  { key: "revenue_readiness", label: "Revenue Readiness", triggers: ["billing_readiness", "unbilled", "denials"] },
  { key: "referral_results", label: "Referral / Results", triggers: ["referrals", "results", "referral_loss"] },
  { key: "patient_access", label: "Patient Access", triggers: ["missed_calls", "no_shows", "no_shows_rev", "lost_leads"] },
  { key: "provider_capacity", label: "Provider Capacity", triggers: ["provider_coordination", "3_5", "6_plus"] },
  { key: "cost_control", label: "Cost Control", triggers: ["many_systems", "legacy_ehr", "2k_5k", "5k_10k", "10k_plus", "costs"] },
] as const;

const whyItMatters: Record<string, string> = {
  follow_up_control: "Work that leaves the room without an owner can quietly disappear after the visit.",
  paperwork_readiness: "Incomplete paperwork can block care operations, documentation and revenue readiness.",
  staff_ownership: "Work held in memory is difficult to reassign, escalate or audit.",
  revenue_readiness: "Revenue problems often begin before a claim is sent, when required work is incomplete or unowned.",
  referral_results: "Unclosed referrals and unreviewed results create operational and care-coordination risk.",
  patient_access: "Missed access can become lost appointments, unused capacity and frustrated patients.",
  provider_capacity: "Multi-provider and multi-location work needs visible ownership and capacity.",
  cost_control: "Disconnected subscriptions can add cost while still leaving staff to bridge the gaps manually.",
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
      detected: hits.length ? `You reported ${hits.length} related pressure point${hits.length === 1 ? "" : "s"} here.` : "Nothing reported here yet.",
      whyItMatters: whyItMatters[surface.key] ?? "",
      humanReview: status === "stable" ? "No review requested." : "The paid Operational Audit verifies this with your clinic before any implementation recommendation.",
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
  billing: "Revenue Readiness",
  costs: "Cost & Connector Review",
  coordination: "Referral Relay & Results",
};

export function deriveSignalSummary(answers: InterviewAnswers): OperatingSignalSummary {
  const map = deriveOperatingMap(answers);
  const weight = (status: OperatingSignalStatus) => status === "attention" ? 2 : status === "review" ? 1 : 0;
  const ranked = [...map].sort((a, b) => weight(b.status) - weight(a.status));
  const top = ranked[0]?.status === "stable" ? null : ranked[0];
  const revenue = answers.revenue_belief ?? [];
  const firstControl = answers.first_control?.[0] ?? "";
  const leakageCategory = revenue.includes("unbilled") ? "Work that may not be reaching a billable-ready state" : revenue.includes("denials") ? "Denials or A/R that may need stronger follow-through" : revenue.includes("lost_leads") ? "Inbound demand that may not be followed through" : revenue.includes("no_shows_rev") ? "Schedule capacity that may be going unused" : revenue.includes("referral_loss") ? "Referral activity that may not be closing" : "Not yet identified — specialist audit required";
  const accountabilityGap = (answers.bottleneck ?? []).includes("staff_accountability") ? "Task ownership appears to be an operating concern" : "No explicit staff-ownership issue reported yet";
  return {
    topBottleneck: top?.label ?? "No dominant bottleneck reported",
    leakageCategory,
    accountabilityGap,
    recommendedModule: moduleForFirstControl[firstControl] ?? "To be determined during the audit",
    nextBestAction: "If the clinic qualifies, secure the paid Klinikos Operational Audit so AI analysis and a specialist can verify the operating case.",
    narrative: top ? `Based on what you reported, ${top.label.toLowerCase()} appears to be a meaningful area to investigate. This is a preliminary operating signal from your answers, not a measured finding or guaranteed ROI. The paid audit verifies the actual cost, workflow and revenue case.` : "No dominant operating pressure has been established yet. A specialist should confirm whether a paid audit is justified before Klinikos recommends implementation.",
  };
}

export function interviewProgress(answers: InterviewAnswers) {
  const answered = guidedQuestions.filter((question) => (answers[question.key] ?? []).length > 0).length;
  return { answered, total: guidedQuestions.length, complete: answered === guidedQuestions.length };
}

export function auditPriceForAnswers(answers: InterviewAnswers) {
  switch (answers.provider_scale?.[0]) {
    case "1": return 750;
    case "2_5": return 1250;
    case "6_15": return 2500;
    case "16_30": return 4000;
    case "30_plus": return 5000;
    default: return 750;
  }
}

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
  score += Math.min(15, revenue.filter((item) => item !== "unsure").length * 5);
  score += answers.current_system?.[0] === "many_systems" ? 10 : 6;
  score += answers.first_control?.length ? 5 : 0;
  return Math.min(100, score);
}

export function preliminaryQualificationLabel(score: number) {
  return score >= 70 ? "STRONG AUDIT CANDIDATE" : score >= 45 ? "SPECIALIST REVIEW RECOMMENDED" : "MORE QUALIFICATION NEEDED";
}
