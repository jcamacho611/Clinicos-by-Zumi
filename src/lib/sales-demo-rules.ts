import { z } from "zod";
import { commercialFabricOffers } from "@/lib/commercial/klinikos-commercial";

export const productStatusLabels = [
  "Live",
  "Demo",
  "Manual fallback",
  "Pending connection",
  "Roadmap",
  "Requires production review",
  "Human review required",
] as const;

export const demoOfferKeys = ["first_value", "deep_operating_audit", "proof_sprint"] as const;
export const demoOfferSchema = z.enum(demoOfferKeys);
export type DemoOfferKey = z.infer<typeof demoOfferSchema>;

type DemoOffer = {
  name: string;
  priceCents: number;
  shortPrice: string;
  status: (typeof productStatusLabels)[number];
  commercialRoute: "free_value" | "qualified_service";
  rule: string;
};

export const demoOffers: Record<DemoOfferKey, DemoOffer> = {
  first_value: {
    name: "First Useful Result",
    priceCents: 0,
    shortPrice: "Free",
    status: "Demo",
    commercialRoute: "free_value",
    rule: "Produce one legitimate bounded result before asking the customer to buy additional capability where policy permits.",
  },
  deep_operating_audit: {
    name: commercialFabricOffers.deepOperatingAudit.name,
    priceCents: commercialFabricOffers.deepOperatingAudit.priceCents,
    shortPrice: commercialFabricOffers.deepOperatingAudit.priceLabel,
    status: "Human review required",
    commercialRoute: "qualified_service",
    rule: "Independent scoped service. Offer only when the first-value evidence shows material operating complexity and an economic case.",
  },
  proof_sprint: {
    name: commercialFabricOffers.proofSprint.name,
    priceCents: commercialFabricOffers.proofSprint.priceCents,
    shortPrice: commercialFabricOffers.proofSprint.priceLabel,
    status: "Human review required",
    commercialRoute: "qualified_service",
    rule: "Independent bounded proof engagement. It is not a mandatory stage before software, implementation, or enterprise work.",
  },
};

export const salesPainPoints = [
  ["follow_ups", "Follow-ups"],
  ["referrals", "Referrals"],
  ["paperwork", "Paperwork"],
  ["results", "Results"],
  ["billing_readiness", "Billing readiness"],
  ["missed_calls", "Missed calls"],
  ["no_shows", "No-shows"],
  ["med_spa_leads", "Med spa leads"],
  ["owner_visibility", "Owner visibility"],
  ["injury_cases", "No-fault / workers' comp"],
  ["diagnostic_tracking", "Lab / imaging tracking"],
  ["provider_coordination", "Provider coordination"],
  ["patient_portal", "Patient portal"],
  ["payments", "Payments"],
  ["staff_accountability", "Staff task accountability"],
] as const;

export const painPointKeys = salesPainPoints.map(([key]) => key) as [
  (typeof salesPainPoints)[number][0],
  ...(typeof salesPainPoints)[number][0][],
];
export const painPointSchema = z.enum(painPointKeys);
export type SalesPainPoint = z.infer<typeof painPointSchema>;
export const painPointLabel = Object.fromEntries(salesPainPoints) as Record<SalesPainPoint, string>;

export const clinicTypeOptions = [
  "Primary care",
  "Medical spa",
  "No-fault / workers' compensation",
  "Physical therapy",
  "Imaging center",
  "Specialty practice",
  "Urgent care",
  "Multi-location group",
  "Other independent clinic",
] as const;

export const currentSystemsSchema = z.object({
  ehr: z.string().trim().max(120).default(""),
  scheduling: z.string().trim().max(120).default(""),
  billing: z.string().trim().max(120).default(""),
  crm: z.string().trim().max(120).default(""),
  patientMessaging: z.string().trim().max(120).default(""),
});

/**
 * Public intake captures enough context to create a truthful first useful result.
 * It does not require payment, commit a meeting, or force a customer into a service.
 */
export const salesIntakeSchema = z.object({
  clinicName: z.string().trim().min(2).max(140),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(180),
  clinicType: z.enum(clinicTypeOptions),
  biggestPainPoint: painPointSchema,
  acknowledgesSyntheticData: z.literal(true),
  selectedOffer: demoOfferSchema.default("first_value"),
  contactRole: z.string().trim().min(2).max(100).nullable().default(null),
  contactPhone: z.string().trim().min(7).max(40).nullable().default(null),
  providerCount: z.number().int().min(1).max(10_000).nullable().default(null),
  locationCount: z.number().int().min(1).max(1_000).nullable().default(null),
  currentSystems: currentSystemsSchema.nullable().default(null),
  estimatedSoftwareSpendDollars: z.number().int().min(0).max(10_000_000).nullable().default(null),
  painPoints: z.array(painPointSchema).max(salesPainPoints.length).nullable().default(null),
  wantsFirstValue: z.boolean().default(true),
  wantsProof: z.boolean().default(false),
  wantsDeepOperatingAudit: z.boolean().default(false),
  wantsDeployment: z.boolean().default(false),
  website: z.string().max(0).optional(),
}).strict();

export const salesQualificationSchema = z.object({
  contactRole: z.string().trim().min(2).max(100).nullable().default(null),
  contactPhone: z.string().trim().min(7).max(40).nullable().default(null),
  providerCount: z.number().int().min(1).max(10_000).nullable().default(null),
  locationCount: z.number().int().min(1).max(1_000).nullable().default(null),
  currentSystems: currentSystemsSchema.nullable().default(null),
  estimatedSoftwareSpendDollars: z.number().int().min(0).max(10_000_000).nullable().default(null),
  painPoints: z.array(painPointSchema).max(salesPainPoints.length).nullable().default(null),
}).strict();

export type SalesQualification = z.infer<typeof salesQualificationSchema>;
export type SalesIntake = z.infer<typeof salesIntakeSchema>;

/**
 * These states describe value progression, not a consulting package ladder.
 * Historical rows may retain older strings; repository adapters treat those as
 * evidence-only and new writes use these states.
 */
export const demoReservationStatuses = [
  "inquiry",
  "qualified",
  "first_value_ready",
  "first_value_delivered",
  "paid_capability_review",
  "proof_in_progress",
  "measured",
  "expansion_ready",
  "closed_lost",
] as const;
export const demoReservationStatusSchema = z.enum(demoReservationStatuses);
export type DemoReservationStatus = z.infer<typeof demoReservationStatusSchema>;

export const demoPaymentStatuses = [
  "not_requested",
  "scope_pending",
  "payment_pending",
  "payment_recorded",
  "waived",
  "refunded",
] as const;
export const demoPaymentStatusSchema = z.enum(demoPaymentStatuses);

const reservationTransitions: Record<DemoReservationStatus, readonly DemoReservationStatus[]> = {
  inquiry: ["qualified", "closed_lost"],
  qualified: ["first_value_ready", "closed_lost"],
  first_value_ready: ["first_value_delivered", "closed_lost"],
  first_value_delivered: ["paid_capability_review", "measured", "closed_lost"],
  paid_capability_review: ["proof_in_progress", "measured", "closed_lost"],
  proof_in_progress: ["measured", "closed_lost"],
  measured: ["expansion_ready", "closed_lost"],
  expansion_ready: ["closed_lost"],
  closed_lost: ["qualified"],
};

export function canTransitionDemoReservation(from: string, to: string) {
  const parsedFrom = demoReservationStatusSchema.safeParse(from);
  const parsedTo = demoReservationStatusSchema.safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && reservationTransitions[parsedFrom.data].includes(parsedTo.data));
}

export function nextDemoReservationStatuses(from: string) {
  const parsed = demoReservationStatusSchema.safeParse(from);
  return parsed.success ? [...reservationTransitions[parsed.data]] : [];
}

export const transitionDemoReservationSchema = z.object({
  status: demoReservationStatusSchema,
  paymentStatus: demoPaymentStatusSchema.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  note: z.string().trim().min(4).max(1_000),
});

export const reviewDemoRecapSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().trim().min(4).max(2_000),
});

interface ScenarioInput {
  clinicType: string;
  biggestPainPoint: SalesPainPoint;
  painPoints: readonly SalesPainPoint[];
}

const scenarioBlueprints: Partial<Record<SalesPainPoint, { title: string; summary: string; revenueLabel: string }>> = {
  referrals: { title: "The referral that never disappears", summary: "A synthetic primary-care referral moves from order to partner acknowledgment, scheduling, returned consultation note, and staff follow-through.", revenueLabel: "Referral leakage and repeat staff outreach" },
  injury_cases: { title: "One injury case, every handoff visible", summary: "A synthetic no-fault episode connects intake, missing forms, MRI, physical therapy, attorney contact, result review, and billing readiness.", revenueLabel: "Case packet delay and unbilled work" },
  med_spa_leads: { title: "From inquiry to booked treatment workflow", summary: "A synthetic med-spa lead moves through response, consultation, consent, deposit placeholder, provider review, booking, and rebooking follow-up.", revenueLabel: "Unbooked consultation and missed reactivation" },
  diagnostic_tracking: { title: "Results move with an owner and a next step", summary: "A synthetic imaging request shows capacity, manual delivery, report receipt, provider review, portal release control, and patient notification.", revenueLabel: "Repeat calls and delayed result follow-through" },
  owner_visibility: { title: "Every location, one operational pulse", summary: "A synthetic multi-location clinic reveals overdue work, responsible staff, referral bottlenecks, result queues, and revenue risk in one owner view.", revenueLabel: "Invisible backlog across locations" },
  staff_accountability: { title: "Every task has an owner", summary: "A synthetic patient journey turns verbal follow-up into assigned, time-bound, escalated work with an audit receipt.", revenueLabel: "Unowned tasks and missed follow-up" },
};

export function buildSyntheticDemoScenario(input: ScenarioInput) {
  const blueprint = scenarioBlueprints[input.biggestPainPoint] ?? {
    title: "The clinic day, finally under control",
    summary: `A synthetic ${input.clinicType.toLowerCase()} workflow shows what is stuck, who owns it, and what happens next.`,
    revenueLabel: `${painPointLabel[input.biggestPainPoint]} workflow delay`,
  };
  const requestedPainPoints = [...new Set(input.painPoints)].map((key) => painPointLabel[key]);

  return {
    clinicType: input.clinicType,
    primaryPainPoint: input.biggestPainPoint,
    title: blueprint.title,
    summary: blueprint.summary,
    syntheticPatient: { synthetic: true, name: "Maya Thompson", identifier: "DEMO-28419", notice: "Not a real patient." },
    syntheticAppointment: { synthetic: true, type: "Workflow review visit", status: "Confirmed", nextStep: "Complete intake readiness check" },
    syntheticDocument: { synthetic: true, name: "Demo intake packet.pdf", status: "Human review required", missingItem: "Signed authorization" },
    syntheticReferral: { synthetic: true, destination: "Northstar Diagnostic Demo", status: "Pending acknowledgment", delivery: "Manual fallback" },
    syntheticTask: { synthetic: true, title: `Resolve ${painPointLabel[input.biggestPainPoint].toLowerCase()} gap`, owner: "Demo operations lead", due: "Today" },
    syntheticResult: { synthetic: true, type: "Demo imaging report", status: "Awaiting provider review", portalReleased: false },
    syntheticBillingItem: { synthetic: true, status: "Not ready", blocker: "Required workflow evidence is missing", submission: "Blocked from autonomous submission" },
    syntheticOwnerAlert: { synthetic: true, level: "Needs staff", message: `${requestedPainPoints.length} selected workflow areas need a named next action.` },
    syntheticRevenueLeak: { synthetic: true, category: blueprint.revenueLabel, estimateStatus: "Illustrative only", amountCents: 125_000 },
    recommendedWorkflow: {
      synthetic: true,
      steps: ["Capture", "Assign", "Confirm", "Escalate if late", "Close with an audit receipt"],
      selectedPainPoints: requestedPainPoints,
      productStatus: ["Demo", "Manual fallback", "Human review required"],
    },
    status: "ready" as const,
  };
}

export function buildDemoRecapDraft(input: {
  clinicName: string;
  clinicType: string;
  biggestPainPoint: SalesPainPoint;
  painPoints: readonly SalesPainPoint[];
  scenarioTitle: string;
}) {
  const selected = [...new Set(input.painPoints)].map((key) => painPointLabel[key]);
  return {
    painPoint: painPointLabel[input.biggestPainPoint],
    whatWasShown: [input.scenarioTitle, "Synthetic workflow command center", "Named owners and next actions", "Truthful integration and review states"],
    workflowGaps: selected.map((label) => `${label}: validate the current owner, handoff, baseline, and completion evidence.`),
    recommendedNextStep: `Confirm ${input.clinicName}'s real workflow, produce one bounded useful result, measure what changed, and only then decide which governed paid capability—if any—is justified.`,
    estimatedValueAreas: ["Staff time recovered", "Fewer dropped follow-ups", "Faster billing readiness", "Clearer owner visibility"],
    productStatusSnapshot: [
      { label: "ClinicOS workflow foundation", status: "Live" },
      { label: "Clinic-specific scenario", status: "Demo" },
      { label: "External vendor delivery", status: "Pending connection" },
      { label: "Clinical and financial decisions", status: "Human review required" },
    ],
    priceOption: {
      status: "not_selected",
      rule: "No paid capability is selected automatically. Human review chooses an independent service, subscription, implementation, or enterprise route only after additional economic value is established.",
    },
    callToAction: "Record the first useful result and decide whether a scoped paid capability is justified. Do not schedule a meeting without founder approval.",
    status: "draft" as const,
    reviewStatus: "human_review_required" as const,
    draftedBy: "deterministic_fallback" as const,
  };
}
