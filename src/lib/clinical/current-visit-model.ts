import {
  buildCloseVisitResolution,
  type AiReviewResolutionState,
  type AttestationResolutionState,
  type ChargeResolutionState,
  type CloseVisitResolution,
  type CodingResolutionState,
  type GovernedDomainEvaluation,
  type OrdersResultsResolutionState,
} from "@/lib/clinical/close-visit-resolution";
import type { PatientVital } from "@/lib/clinical/vital-types";
import { handoffAttributionFor, type ClinicalRecorder, type HandoffAttribution } from "@/lib/clinical/staff-handoff-attribution";
import { buildCurrentVisitChange, summariseClinicalChange, type CurrentVisitChangeState } from "@/lib/clinical/current-visit-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";
import { vitalHasMeasurement } from "@/lib/clinical/vital-types";
import type { Encounter, Patient } from "@/lib/types";

export const CURRENT_VISIT_SECTION_ORDER = [
  "patient_snapshot",
  "what_changed",
  "staff_handoff",
  "today",
  "clinical",
  "assessment_plan",
  "orders_results",
  "documentation_coding",
  "close_visit",
] as const;

export type CurrentVisitSectionKey = typeof CURRENT_VISIT_SECTION_ORDER[number];

export interface CurrentVisitUnavailableState {
  status: "not_available";
  message: string;
}

export interface CurrentVisitMedicationReconciliation {
  id: string;
  status: string;
  source: string;
  summary: string | null;
  medicationCount: number;
  discrepancyCount: number;
  completedAt: string | null;
}

export interface CurrentVisitPartialHandoffState {
  status: "partial";
  source: "encounter_vitals" | "medication_reconciliation" | "multiple";
  message: string;
  /**
   * Who recorded the vitals in this handoff. Present on every partial handoff so the
   * encounter always answers the question, including when the answer is that nobody
   * was recorded — silence would read as though attribution did not matter.
   */
  vitalAttribution: HandoffAttribution;
  vital?: PatientVital;
  medicationReconciliation?: CurrentVisitMedicationReconciliation;
}

export type CurrentVisitStaffHandoffState = CurrentVisitUnavailableState | CurrentVisitPartialHandoffState;

export interface CurrentVisitPatientSnapshot {
  patientName: string;
  mrn: string;
  age: number;
  sex: string;
  pronouns: string;
  preferredLanguage: string;
  riskLevel: Patient["riskLevel"];
  riskFlags: string[];
  allergies: string[];
  medications: string[];
  problems: string[];
  insurance: string;
  plan: string;
  lastVisit: string;
  provider: string;
  location: string;
}

export interface CurrentVisitCloseState {
  missingRequiredSections: string[];
  requiredDocumentationComplete: boolean;
  noteLocked: boolean;
  encounterStatus: Encounter["status"];
  diagnosisCount: number;
  procedureCount: number;
  externalCompletion: "not_inferred";
  presentationOnly: true;
  resolution: CloseVisitResolution;
}

export interface CurrentVisitModel {
  sectionOrder: CurrentVisitSectionKey[];
  patientSnapshot: CurrentVisitPatientSnapshot;
  /**
   * Longitudinal change. Previously a hardcoded "not captured" placeholder that ignored
   * the chart entirely; now derived from persisted body map versions when they exist.
   */
  change: CurrentVisitChangeState;
  changeSummary: string;
  staffHandoff: CurrentVisitStaffHandoffState;
  closeVisit: CurrentVisitCloseState;
}

export interface CurrentVisitCloseEvaluation {
  coding: GovernedDomainEvaluation<CodingResolutionState>;
  ordersResults: GovernedDomainEvaluation<OrdersResultsResolutionState>;
  aiReview: GovernedDomainEvaluation<AiReviewResolutionState>;
  attestations: GovernedDomainEvaluation<AttestationResolutionState>;
  chargeReadiness: GovernedDomainEvaluation<ChargeResolutionState>;
}

export interface CurrentVisitContext {
  vital?: PatientVital | null;
  /** Null until the vitals record persists who took the measurement. */
  vitalRecorder?: ClinicalRecorder | null;
  /** The two body map versions being compared, when the chart holds them. */
  bodyMap?: { previous: BodyMapVersion | null; current: BodyMapVersion | null } | null;
  medicationReconciliation?: CurrentVisitMedicationReconciliation | null;
  closeEvaluation?: Partial<CurrentVisitCloseEvaluation>;
}

const REQUIRED_DOCUMENTATION = [
  ["Chief complaint", "chiefComplaint"],
  ["History of present illness", "hpi"],
  ["Assessment", "assessment"],
  ["Plan", "plan"],
] as const satisfies ReadonlyArray<readonly [string, keyof Encounter]>;

const NOT_EVALUATED = { state: "not_evaluated", source: null, evidenceRef: null } as const;

const DEFAULT_CLOSE_EVALUATION: CurrentVisitCloseEvaluation = {
  coding: NOT_EVALUATED,
  ordersResults: NOT_EVALUATED,
  aiReview: NOT_EVALUATED,
  attestations: NOT_EVALUATED,
  chargeReadiness: NOT_EVALUATED,
};

function missingRequiredDocumentation(encounter: Encounter) {
  return REQUIRED_DOCUMENTATION.flatMap(([label, key]) => {
    const value = encounter[key];
    return typeof value === "string" && value.trim().length > 0 ? [] : [label];
  });
}

function completedMedicationReconciliation(
  medicationReconciliation?: CurrentVisitMedicationReconciliation | null,
): CurrentVisitMedicationReconciliation | null {
  if (!medicationReconciliation) return null;
  if (medicationReconciliation.status !== "completed") return null;
  if (!medicationReconciliation.completedAt) return null;
  return medicationReconciliation;
}

function buildStaffHandoff(
  vital?: PatientVital | null,
  medicationReconciliation?: CurrentVisitMedicationReconciliation | null,
  vitalRecorder?: ClinicalRecorder | null,
): CurrentVisitStaffHandoffState {
  const hasVital = Boolean(vital && vitalHasMeasurement(vital));
  const completedReconciliation = completedMedicationReconciliation(medicationReconciliation);
  const vitalAttribution = handoffAttributionFor(vitalRecorder);

  if (hasVital && vital && completedReconciliation) {
    return {
      status: "partial",
      source: "multiple",
      vitalAttribution,
      vital,
      medicationReconciliation: completedReconciliation,
      message: "Vitals and medication reconciliation are attached to this encounter. Other staff intake remains incomplete until encounter-specific screening, symptom, form, delegated-work, or question evidence is actually persisted.",
    };
  }

  if (hasVital && vital) {
    return {
      status: "partial",
      source: "encounter_vitals",
      vitalAttribution,
      vital,
      message: "Vitals were captured for this encounter. Other staff intake is not yet attached to the governed handoff.",
    };
  }

  if (completedReconciliation) {
    return {
      status: "partial",
      source: "medication_reconciliation",
      vitalAttribution,
      medicationReconciliation: completedReconciliation,
      message: "Medication reconciliation is attached to this encounter. Other staff intake remains incomplete until encounter-specific vital, screening, symptom, form, delegated-work, or question evidence is actually persisted.",
    };
  }

  return {
    status: "not_available",
    message: "No encounter-specific staff handoff is attached yet. Do not infer intake findings from the patient summary.",
  };
}

export function buildCurrentVisitModel(patient: Patient, encounter: Encounter, context: CurrentVisitContext = {}): CurrentVisitModel {
  const missingRequiredSections = missingRequiredDocumentation(encounter);
  const closeEvaluation = { ...DEFAULT_CLOSE_EVALUATION, ...context.closeEvaluation };
  const closeResolution = buildCloseVisitResolution({
    encounterStatus: encounter.status,
    missingRequiredDocumentation: missingRequiredSections,
    followUp: encounter.followUp,
    ...closeEvaluation,
  });

  const change = buildCurrentVisitChange({
    previous: context.bodyMap?.previous ?? null,
    current: context.bodyMap?.current ?? null,
  });

  return {
    sectionOrder: [...CURRENT_VISIT_SECTION_ORDER],
    patientSnapshot: {
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      mrn: patient.mrn,
      age: patient.age,
      sex: patient.sex,
      pronouns: patient.pronouns,
      preferredLanguage: patient.preferredLanguage,
      riskLevel: patient.riskLevel,
      riskFlags: [...patient.riskFlags],
      allergies: [...patient.allergies],
      medications: [...patient.medications],
      problems: [...patient.problems],
      insurance: patient.insurance,
      plan: patient.plan,
      lastVisit: patient.lastVisit,
      provider: patient.provider,
      location: patient.location,
    },
    change,
    changeSummary: summariseClinicalChange(change),
    staffHandoff: buildStaffHandoff(context.vital, context.medicationReconciliation, context.vitalRecorder),
    closeVisit: {
      missingRequiredSections,
      requiredDocumentationComplete: missingRequiredSections.length === 0,
      noteLocked: closeResolution.noteLocked,
      encounterStatus: encounter.status,
      diagnosisCount: encounter.diagnoses.length,
      procedureCount: encounter.procedures.length,
      externalCompletion: "not_inferred",
      presentationOnly: true,
      resolution: closeResolution,
    },
  };
}
