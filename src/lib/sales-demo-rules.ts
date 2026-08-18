import { z } from "zod";

export const productStatusLabels = [
  "Live",
  "Demo",
  "Manual fallback",
  "Pending connection",
  "Roadmap",
  "Requires production review",
  "Human review required",
] as const;

export const demoOfferKeys = [
  "private_workflow_demo",
  "founding_clinic_evaluation",
  "founding_clinic_program",
] as const;

export const demoOfferSchema = z.enum(demoOfferKeys);
export type DemoOfferKey = z.infer<typeof demoOfferSchema>;

/**
 * Compatibility keys remain stable for persisted sales history. Customer-facing
 * labels mirror the current Klinikos commercial canon so historical/internal keys
 * never leak legacy product names into UI or API projections.
 */
export const demoOffers: Record<DemoOfferKey, {
  name: string;
  priceCents: number;
  shortPrice: string;
  creditForward: string;
  status: (typeof productStatusLabels)[number];
}> = {
  private_workflow_demo: {
    name: "Clinic Operating Analysis",
    priceCents: 50_000,
    shortPrice: "$500",
    creditForward: "100% credited toward an Implementation Blueprint or qualifying implementation when the clinic proceeds within 30 days.",
    status: "Demo",
  },
  founding_clinic_evaluation: {
    name: "Implementation Blueprint",
    priceCents: 150_000,
    shortPrice: "$1,500",
    creditForward: "100% credited toward a qualifying Klinikos implementation when the clinic proceeds within 30 days.",
    status: "Human review required",
  },
  founding_clinic_program: {
    name: "Founding Clinic Implementation",
    priceCents: 800_000,
    shortPrice: "from $8,000",
    creditForward: "Eligible analysis and blueprint fees are credited after human review.",
    status: "Requires production review",
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

export const salesIntakeSchema = z.object({
  clinicName: z.string().trim().min(2).max(140),
  contactName: z.string().trim().min(2).max(120),
  contactRole: z.string().trim().min(2).max(100),
  contactEmail: z.string().trim().email().max(180),
  contactPhone: z.string().trim().min(7).max(40),
  clinicType: z.enum(clinicTypeOptions),
  providerCount: z.number().int().min(1).max(10_000),
  locationCount: z.number().int().min(1).max(1_000),
  currentSystems: currentSystemsSchema,
  estimatedSoftwareSpendDollars: z.number().int().min(0).max(10_000_000).nullable().default(null),
  biggestPainPoint: painPointSchema,
  painPoints: z.array(painPointSchema).min(1).max(salesPainPoints.length),
  selectedOffer: demoOfferSchema.default("private_workflow_demo"),
  wantsFreeIntro: z.boolean().default(false),
  wantsPaidDemo: z.boolean().default(true),
  wantsFoundingEvaluation: z.boolean().default(false),
  wantsFoundingProgram: z.boolean().default(false),
  acknowledgesSyntheticData: z.literal(true),
  website: z.string().max(0).optional(),
}).strict();

export type SalesIntake = z.infer<typeof salesIntakeSchema>;

export const demoReservationStatuses = [
  "inquiry",
  "qualified",
  "payment_pending",
  "reserved",
  "scheduled",
  "completed",
  "no_show",
  "moved_to_evaluation",
  "moved_to_founding",
  "closed_lost",
] as const;

export const demoReservationStatusSchema = z.enum(demoReservationStatuses);
export type DemoReservationStatus = z.infer<typeof demoReservationStatusSchema>;

export const demoPaymentStatuses = [
  "not_started",
  "manual_link_required",
  "payment_pending",
  "payment_recorded",
  "credited_forward",
  "waived",
  "refunded",
] as const;

export const demoPaymentStatusSchema = z.enum(demoPaymentStatuses);

const reservationTransitions: Record<DemoReservationStatus, readonly DemoReservationStatus[]> = {
  inquiry: ["qualified", "closed_lost"],
  qualified: ["payment_pending", "reserved", "closed_lost"],
  payment_pending: ["reserved", "closed_lost"],
  reserved: ["scheduled", "closed_lost"],
  scheduled: ["completed", "no_show", "closed_lost"],
  completed: ["moved_to_evaluation", "moved_to_founding", "closed_lost"],
  no_show: ["scheduled", "closed_lost"],
  moved_to_evaluation: ["moved_to_founding", "closed_lost"],
  moved_to_founding: [],
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
  referrals: {
    title: "The referral that never disappears",
    summary: "A synthetic primary-care referral moves from order to partner acknowledgment, scheduling, returned consultation note, and staff follow-through.",
    revenueLabel: "Referral leakage and repeat staff outreach",
  },
  injury_cases: {
    title: "One injury case, every handoff visible",
    summary: "A synthetic no-fault episode connects intake, missing forms, MRI, physical therapy, attorney contact, result review, and billing readiness.",
    revenueLabel: "Case packet delay and unbilled work",
  },
  med_spa_leads: {
    title: "From inquiry to booked treatment workflow",
    summary: "A synthetic med-spa lead moves through response, consultation, consent, deposit placeholder, provider review, booking, and rebooking follow-up.",
    revenueLabel: "Unbooked consultation and missed reactivation",
  },
  diagnostic_tracking: {
    title: "Results move with an owner and a next step",
    summary: "A synthetic imaging request shows capacity, manual delivery, report receipt, provider review, portal release control, and patient notification.",
    revenueLabel: "Repeat calls and delayed result follow-through",
  },
  owner_visibility: {
    title: "Every location, one operational pulse",
    summary: "A synthetic multi-location clinic reveals overdue work, responsible staff, referral bottlenecks, result queues, and revenue risk in one owner view.",
    revenueLabel: "Invisible backlog across locations",
  },
  staff_accountability: {
    title: "Every task has an owner",
    summary: "A synthetic patient journey turns verbal follow-up into assigned, time-bound, escalated work with an audit receipt.",
    revenueLabel: "Unowned tasks and missed follow-up",
  },
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
    requestedPainPoints,
    title: blueprint.title,
    summary: blueprint.summary,
    syntheticPatient: { name: "Synthetic patient A", ageBand: "40–49", mrn: "DEMO-0001" },
    syntheticAppointment: { reason: "Illustrative follow-up visit", status: "scheduled" },
    syntheticDocument: { missingItem: "Signed acknowledgment", status: "pending" },
    syntheticReferral: { status: "awaiting partner acknowledgment", destination: "Synthetic partner organization" },
    syntheticTask: { owner: "Front desk role", status: "open", due: "Today" },
    syntheticResult: { status: "awaiting provider review", releaseState: "not released" },
    syntheticBillingItem: { status: "not ready", reason: blueprint.revenueLabel },
    syntheticOwnerAlert: { severity: "medium", message: `${blueprint.revenueLabel} is still unresolved.` },
    syntheticRevenueLeak: { label: blueprint.revenueLabel, estimateRange: "$0–$0 (demo only)" },
    recommendedWorkflow: {
      title: "Human-owned workflow",
      steps: ["capture", "assign", "review", "complete", "audit"],
      humanReviewRequired: true,
    },
    status: "Demo" as const,
  };
}

export function buildDemoRecapDraft(input: {
  clinicName: string;
  selectedOffer: DemoOfferKey;
  biggestPainPoint: SalesPainPoint;
  painPoints: SalesPainPoint[];
  currentSystems: Record<string, unknown>;
}) {
  const offer = demoOffers[input.selectedOffer];
  const visiblePains = input.painPoints.map((key) => painPointLabel[key]);
  return {
    title: `${input.clinicName} — ${offer.name} recap draft`,
    summary: `The clinic reported ${visiblePains.join(", ")}. The controlled synthetic review focused on ${painPointLabel[input.biggestPainPoint]}.`,
    findings: [
      "The walkthrough used synthetic data only.",
      "The workflow illustrated explicit ownership, status, and audit state rather than autonomous action.",
      "External integrations remain subject to production readiness and clinic-specific implementation.",
    ],
    recommendations: [
      "Validate the highest-cost manual handoff with clinic staff.",
      "Choose one workflow for a measured implementation milestone.",
      "Confirm vendor, security, legal, and training gates before production use.",
    ],
    limitations: [
      "No live PHI was used.",
      "No external claim, prescription, result, or patient message was transmitted.",
      "No certification or guaranteed financial outcome is implied.",
    ],
  };
}
