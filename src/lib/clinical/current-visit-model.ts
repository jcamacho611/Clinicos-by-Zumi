import type { EncounterStaffHandoffProjection } from "@/lib/clinical/encounter-handoff-types";
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

export interface CurrentVisitPartialHandoffState {
  status: "partial";
  message: string;
  projection: EncounterStaffHandoffProjection;
  evidence: {
    vital: boolean;
    medicationReconciliation: boolean;
    forms: number;
    tasks: number;
  };
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
}

export interface CurrentVisitModel {
  sectionOrder: CurrentVisitSectionKey[];
  patientSnapshot: CurrentVisitPatientSnapshot;
  change: CurrentVisitUnavailableState;
  staffHandoff: CurrentVisitStaffHandoffState;
  closeVisit: CurrentVisitCloseState;
}

export interface CurrentVisitContext {
  handoff?: EncounterStaffHandoffProjection | null;
}

const REQUIRED_DOCUMENTATION = [
  ["Chief complaint", "chiefComplaint"],
  ["History of present illness", "hpi"],
  ["Assessment", "assessment"],
  ["Plan", "plan"],
] as const satisfies ReadonlyArray<readonly [string, keyof Encounter]>;

function missingRequiredDocumentation(encounter: Encounter) {
  return REQUIRED_DOCUMENTATION.flatMap(([label, key]) => {
    const value = encounter[key];
    return typeof value === "string" && value.trim().length > 0 ? [] : [label];
  });
}

function buildStaffHandoff(handoff?: EncounterStaffHandoffProjection | null): CurrentVisitStaffHandoffState {
  if (!handoff) {
    return {
      status: "not_available",
      message: "No encounter-specific staff handoff is attached yet. Do not infer intake findings from the patient summary.",
    };
  }

  const evidence = {
    vital: Boolean(handoff.vital && vitalHasMeasurement(handoff.vital)),
    medicationReconciliation: handoff.medicationReconciliation !== null,
    forms: handoff.forms.length,
    tasks: handoff.tasks.length,
  };

  if (!evidence.vital && !evidence.medicationReconciliation && evidence.forms === 0 && evidence.tasks === 0) {
    return {
      status: "not_available",
      message: "No encounter-specific staff handoff evidence is persisted yet. Do not infer intake findings from the patient summary.",
    };
  }

  return {
    status: "partial",
    projection: handoff,
    evidence,
    message: "Encounter-linked staff evidence is available. Other staff intake remains incomplete unless it is separately persisted, reviewed, and governed for this encounter.",
  };
}

export function buildCurrentVisitModel(patient: Patient, encounter: Encounter, context: CurrentVisitContext = {}): CurrentVisitModel {
  const missingRequiredSections = missingRequiredDocumentation(encounter);

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
    change: {
      status: "not_available",
      message: "Structured longitudinal change has not been captured for this encounter yet. Review the chart for prior clinical context.",
    },
    staffHandoff: buildStaffHandoff(context.handoff),
    closeVisit: {
      missingRequiredSections,
      requiredDocumentationComplete: missingRequiredSections.length === 0,
      noteLocked: encounter.status === "Signed" || encounter.status === "Locked",
      encounterStatus: encounter.status,
      diagnosisCount: encounter.diagnoses.length,
      procedureCount: encounter.procedures.length,
      externalCompletion: "not_inferred",
      presentationOnly: true,
    },
  };
}
