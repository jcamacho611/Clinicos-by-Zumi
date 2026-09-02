import {
  clinicTypeOptions,
  painPointLabel,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";

export type GuidedSalesAnswers = Record<string, readonly string[] | undefined>;
export type ClinicTypeOption = (typeof clinicTypeOptions)[number];

const clinicTypeByGuidedCode = {
  primary_care: "Primary care",
  specialty: "Specialty practice",
  med_spa: "Medical spa",
  urgent_care: "Urgent care",
  multi_site: "Multi-location group",
} as const satisfies Record<string, ClinicTypeOption>;

const reusableBottleneckCodes = [
  "follow_ups",
  "paperwork",
  "missed_calls",
  "no_shows",
  "billing_readiness",
  "med_spa_leads",
  "results",
  "referrals",
  "staff_accountability",
  "provider_coordination",
] as const satisfies readonly SalesPainPoint[];

const reusableBottleneckSet = new Set<string>(reusableBottleneckCodes);

export type FirstValueHandoff = {
  clinicType: ClinicTypeOption | null;
  painPoints: SalesPainPoint[];
  biggestPainPoint: SalesPainPoint | null;
  summaryLabels: string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function allParams(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function isClinicCode(value: string | undefined): value is keyof typeof clinicTypeByGuidedCode {
  return Boolean(value && Object.prototype.hasOwnProperty.call(clinicTypeByGuidedCode, value));
}

function reusablePainPoints(values: readonly string[]) {
  return [...new Set(values.filter((value): value is SalesPainPoint => reusableBottleneckSet.has(value)))];
}

function toHandoff(clinicCode: string | undefined, bottlenecks: readonly string[]): FirstValueHandoff {
  const clinicType = isClinicCode(clinicCode) ? clinicTypeByGuidedCode[clinicCode] : null;
  const painPoints = reusablePainPoints(bottlenecks);
  const summaryLabels = [
    ...(clinicType ? [`Organization type: ${clinicType}`] : []),
    ...(painPoints.length ? [`Reported unfinished work: ${painPoints.map((key) => painPointLabel[key]).join(", ")}`] : []),
  ];

  return {
    clinicType,
    painPoints,
    biggestPainPoint: painPoints[0] ?? null,
    summaryLabels,
  };
}

/**
 * Continuation URL contains predefined guided-answer codes only. No contact data,
 * patient data, free text, vendor names, revenue values, or exact organization-size
 * values are placed in the URL.
 */
export function buildFirstValueHandoffHref(answers: GuidedSalesAnswers) {
  const clinicCode = answers.clinic_type?.[0];
  const painPoints = reusablePainPoints(answers.bottleneck ?? []);
  const params = new URLSearchParams();
  if (isClinicCode(clinicCode)) params.set("clinic", clinicCode);
  for (const painPoint of painPoints) params.append("pain", painPoint);
  const query = params.toString();
  return `/private-demo${query ? `?${query}` : ""}#first-value`;
}

export function parseFirstValueHandoffSearchParams(input: {
  clinic?: string | string[];
  pain?: string | string[];
}): FirstValueHandoff {
  return toHandoff(firstParam(input.clinic), allParams(input.pain));
}
