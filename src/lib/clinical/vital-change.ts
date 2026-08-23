import type { PatientVital } from "@/lib/clinical/vital-types";

export type VitalChangeDirection = "increased" | "decreased" | "unchanged";

export type VitalChangeMetricKey =
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic"
  | "heart_rate"
  | "temperature"
  | "oxygen_percent"
  | "weight"
  | "bmi";

export interface VitalChangeMetric {
  key: VitalChangeMetricKey;
  label: string;
  prior: number;
  current: number;
  delta: number;
  direction: VitalChangeDirection;
  unit: string;
}

export interface VitalChangeUnavailable {
  status: "not_available";
  message: string;
}

export interface VitalChangePartial {
  status: "partial";
  source: "vital_comparison";
  previousMeasuredAt: string;
  currentMeasuredAt: string;
  metrics: VitalChangeMetric[];
  message: string;
}

export type VitalChangeState = VitalChangeUnavailable | VitalChangePartial;

type NumericVitalKey = Exclude<keyof PatientVital, "id" | "measuredAt" | "heightInches">;

type MetricDefinition = {
  key: VitalChangeMetricKey;
  source: NumericVitalKey;
  label: string;
  unit: string;
};

const METRICS: readonly MetricDefinition[] = [
  { key: "blood_pressure_systolic", source: "bloodPressureSystolic", label: "Systolic blood pressure", unit: "mmHg" },
  { key: "blood_pressure_diastolic", source: "bloodPressureDiastolic", label: "Diastolic blood pressure", unit: "mmHg" },
  { key: "heart_rate", source: "heartRate", label: "Heart rate", unit: "bpm" },
  { key: "temperature", source: "temperatureF", label: "Temperature", unit: "°F" },
  { key: "oxygen_percent", source: "oxygenPercent", label: "Oxygen saturation", unit: "%" },
  { key: "weight", source: "weightLbs", label: "Weight", unit: "lb" },
  { key: "bmi", source: "bmi", label: "BMI", unit: "" },
];

function roundedDelta(prior: number, current: number) {
  return Math.round((current - prior) * 100) / 100;
}

function direction(delta: number): VitalChangeDirection {
  if (delta > 0) return "increased";
  if (delta < 0) return "decreased";
  return "unchanged";
}

export function buildVitalChangeSet(
  previous: PatientVital | null | undefined,
  current: PatientVital | null | undefined,
): VitalChangeState {
  if (!previous || !current) {
    return {
      status: "not_available",
      message: "A persisted prior and current vital measurement are both required before Klinikos can show a vital change comparison.",
    };
  }

  const metrics = METRICS.flatMap<VitalChangeMetric>((definition) => {
    const prior = previous[definition.source];
    const now = current[definition.source];
    if (prior === null || now === null) return [];
    const delta = roundedDelta(prior, now);
    return [{
      key: definition.key,
      label: definition.label,
      prior,
      current: now,
      delta,
      direction: direction(delta),
      unit: definition.unit,
    }];
  });

  if (metrics.length === 0) {
    return {
      status: "not_available",
      message: "The prior and current vital records do not contain overlapping measurements that can be compared truthfully.",
    };
  }

  return {
    status: "partial",
    source: "vital_comparison",
    previousMeasuredAt: previous.measuredAt,
    currentMeasuredAt: current.measuredAt,
    metrics,
    message: "This comparison shows only persisted numeric vital changes. Klinikos has not interpreted whether a change is clinically better, worse, significant, or causal.",
  };
}
