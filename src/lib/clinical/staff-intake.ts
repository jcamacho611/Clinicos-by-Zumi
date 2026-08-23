export type StaffIntakeProfession =
  | "medical_assistant"
  | "licensed_practical_nurse"
  | "registered_nurse";

export type ReconciliationStatus =
  | "not_reviewed"
  | "reviewed_no_change"
  | "changed"
  | "needs_provider_review";

export interface ReconciliationState {
  status: ReconciliationStatus;
  note: string | null;
}

export interface StaffSymptomUpdate {
  id: string;
  label: string;
  state: "reported" | "improved" | "worsened" | "unchanged" | "resolved_by_clinician";
  note: string | null;
}

export interface StaffBodyMapUpdate {
  status: "not_reviewed" | "no_change_documented" | "completed" | "needs_provider_review";
  bodyMapVersionId: string | null;
}

export interface StaffScreeningEvidence {
  id: string;
  label: string;
  status: "not_started" | "completed" | "needs_provider_review";
  resultSummary: string | null;
}

export interface DelegatedWorkEvidence {
  id: string;
  label: string;
  status: "not_started" | "completed" | "needs_provider_review";
  escalationReason: string | null;
}

export interface StaffIntakeSnapshot {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId: string;
  capturedByUserId: string;
  capturedByProfession: StaffIntakeProfession;
  capturedAt: string;
  reasonForVisit: string | null;
  changesSinceLastVisit: string | null;
  medicationReconciliation: ReconciliationState;
  allergyReconciliation: ReconciliationState;
  symptomUpdates: StaffSymptomUpdate[];
  bodyMapUpdate: StaffBodyMapUpdate;
  screenings: StaffScreeningEvidence[];
  delegatedWork: DelegatedWorkEvidence[];
}

export interface StaffIntakeHandoff {
  source: "encounter_staff_intake";
  intakeId: string;
  organizationId: string;
  patientId: string;
  encounterId: string;
  performerUserId: string;
  performerProfession: StaffIntakeProfession;
  capturedAt: string;
  status: "incomplete" | "needs_provider_review" | "ready";
  symptomEvidenceStatus: "documented" | "not_documented";
  blockers: string[];
  escalations: string[];
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function reconciliationBlocker(label: string, state: ReconciliationState) {
  return state.status === "not_reviewed" ? `${label} reconciliation not reviewed` : null;
}

function reconciliationEscalation(label: string, state: ReconciliationState) {
  if (state.status !== "needs_provider_review") return null;
  const reason = hasText(state.note) ? state.note!.trim() : "Provider review requested.";
  return `${label} reconciliation: ${reason}`;
}

export function buildStaffIntakeHandoff(intake: StaffIntakeSnapshot): StaffIntakeHandoff {
  const blockers: string[] = [];
  const escalations: string[] = [];

  if (!hasText(intake.reasonForVisit)) blockers.push("Reason for visit not captured");
  if (!hasText(intake.changesSinceLastVisit)) blockers.push("Changes since last visit not documented");

  const medicationBlocker = reconciliationBlocker("Medication", intake.medicationReconciliation);
  if (medicationBlocker) blockers.push(medicationBlocker);
  const allergyBlocker = reconciliationBlocker("Allergy", intake.allergyReconciliation);
  if (allergyBlocker) blockers.push(allergyBlocker);

  const medicationEscalation = reconciliationEscalation("Medication", intake.medicationReconciliation);
  if (medicationEscalation) escalations.push(medicationEscalation);
  const allergyEscalation = reconciliationEscalation("Allergy", intake.allergyReconciliation);
  if (allergyEscalation) escalations.push(allergyEscalation);

  const symptomEvidenceStatus = intake.symptomUpdates.length > 0 ? "documented" : "not_documented";
  if (symptomEvidenceStatus === "not_documented") blockers.push("Symptom updates not documented");

  if (intake.bodyMapUpdate.status === "not_reviewed") blockers.push("Body-map update not reviewed");
  if (intake.bodyMapUpdate.status === "needs_provider_review") {
    escalations.push("Body-map update requires provider review");
  }

  for (const screening of intake.screenings) {
    if (screening.status === "not_started") blockers.push(`${screening.label} screening not completed`);
    if (screening.status === "needs_provider_review") {
      const detail = hasText(screening.resultSummary) ? `: ${screening.resultSummary!.trim()}` : "";
      escalations.push(`${screening.label} screening requires provider review${detail}`);
    }
  }

  for (const task of intake.delegatedWork) {
    if (task.status === "not_started") blockers.push(`${task.label} delegated work not completed`);
    if (task.status === "needs_provider_review") {
      const reason = hasText(task.escalationReason) ? task.escalationReason!.trim() : "Provider review requested.";
      escalations.push(`${task.label}: ${reason}`);
    }
  }

  let status: StaffIntakeHandoff["status"] = "ready";
  if (escalations.length > 0) status = "needs_provider_review";
  else if (blockers.length > 0) status = "incomplete";

  return {
    source: "encounter_staff_intake",
    intakeId: intake.id,
    organizationId: intake.organizationId,
    patientId: intake.patientId,
    encounterId: intake.encounterId,
    performerUserId: intake.capturedByUserId,
    performerProfession: intake.capturedByProfession,
    capturedAt: intake.capturedAt,
    status,
    symptomEvidenceStatus,
    blockers,
    escalations,
  };
}
