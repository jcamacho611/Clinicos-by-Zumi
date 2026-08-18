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
  "no_shows",
  "billing_readiness",
  "med_spa_leads",
  "results",
  "referrals",
  "staff_accountability",
  "provider_coordination",
] as const satisfies readonly SalesPainPoint[];

const reusableBottleneckSet = new Set<string>(reusableBottleneckCodes);

export type PaidAnalysisHandoff = {
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

function toHandoff(clinicCode: string | undefined, bottlenecks: readonly string[]): PaidAnalysisHandoff {
  const clinicType = isClinicCode(clinicCode) ? clinicTypeByGuidedCode[clinicCode] : null;
  const painPoints = reusablePainPoints(bottlenecks);
  const summaryLabels = [
    ...(clinicType ? [`Clinic type: ${clinicType}`] : []),
    ...(painPoints.length ? [`Carried bottlenecks: ${painPoints.map((key) => painPointLabel[key]).join(", ")}`] : []),
  ];

  return {
    clinicType,
    painPoints,
    biggestPainPoint: painPoints[0] ?? null,
    summaryLabels,
  };
}

/**
 * Builds a continuation URL from predefined guided-answer codes only.
 *
 * No free text, contact data, patient data, vendor names, revenue values, or exact
 * clinic-size values are placed in the URL. The destination validates the same
 * whitelist again before using these values as form defaults.
 */
export function buildPaidAnalysisHandoffHref(answers: GuidedSalesAnswers) {
  const clinicCode = answers.clinic_type?.[0];
  const painPoints = reusablePainPoints(answers.bottleneck ?? []);
  const params = new URLSearchParams();

  if (isClinicCode(clinicCode)) params.set("clinic", clinicCode);
  for (const painPoint of painPoints) params.append("pain", painPoint);

  const query = params.toString();
  return `/private-demo${query ? `?${query}` : ""}#reserve`;
}

/**
 * Server-safe parser for the public continuation query. Treats every URL value as
 * untrusted and returns only canonical enum values already accepted by the paid
 * intake. Unknown values are ignored rather than coerced.
 */
export function parsePaidAnalysisHandoffSearchParams(input: {
  clinic?: string | string[];
  pain?: string | string[];
}): PaidAnalysisHandoff {
  return toHandoff(firstParam(input.clinic), allParams(input.pain));
}
