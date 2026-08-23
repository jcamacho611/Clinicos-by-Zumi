import { describe, expect, it } from "vitest";
import { buildCurrentVisitModel } from "@/lib/clinical/current-visit-model";
import type { Encounter, Patient } from "@/lib/types";

const patient: Patient = {
  id: "patient-1",
  organizationId: "org-1",
  mrn: "MRN-1001",
  firstName: "Jordan",
  lastName: "Lee",
  initials: "JL",
  dob: "1989-02-14",
  age: 37,
  sex: "Female",
  pronouns: "she/her",
  phone: "555-0100",
  email: "jordan@example.test",
  preferredLanguage: "English",
  insurance: "Example Health",
  plan: "Gold",
  memberId: "member-1",
  copay: 25,
  balance: 0,
  portalStatus: "Active",
  riskLevel: "Needs Provider",
  riskFlags: ["Medication reconciliation due"],
  nextAppointment: "2026-09-02",
  provider: "Dr. Rivera",
  location: "Downtown",
  allergies: ["Penicillin"],
  medications: ["Lisinopril 10 mg"],
  problems: ["Hypertension"],
  lastVisit: "2026-07-18",
};

function encounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: "encounter-1",
    organizationId: "org-1",
    patientId: "patient-1",
    date: "2026-08-22",
    type: "Follow-up",
    provider: "Dr. Rivera",
    patientName: "Jordan Lee",
    patientInitials: "JL",
    patientMrn: "MRN-1001",
    status: "Draft",
    chiefComplaint: "Blood pressure follow-up",
    hpi: "",
    subjective: "No chest pain.",
    objective: "BP 132/84.",
    assessment: "Hypertension, improving.",
    plan: "",
    diagnoses: [{ code: "I10", label: "Essential hypertension", primary: true }],
    procedures: [],
    patientInstructions: "Continue home blood-pressure log.",
    followUp: "Return in four weeks.",
    requiresCosignature: false,
    addenda: [],
    auditHistory: [],
    ...overrides,
  };
}

describe("Current Visit projection", () => {
  it("orders the provider workflow around the professional-feedback Current Visit sequence", () => {
    const model = buildCurrentVisitModel(patient, encounter());

    expect(model.sectionOrder).toEqual([
      "patient_snapshot",
      "what_changed",
      "staff_handoff",
      "today",
      "clinical",
      "assessment_plan",
      "orders_results",
      "documentation_coding",
      "close_visit",
    ]);
  });

  it("projects the existing authorized patient context without inventing longitudinal or handoff state", () => {
    const model = buildCurrentVisitModel(patient, encounter());

    expect(model.patientSnapshot).toMatchObject({
      patientName: "Jordan Lee",
      mrn: "MRN-1001",
      riskLevel: "Needs Provider",
      allergies: ["Penicillin"],
      medications: ["Lisinopril 10 mg"],
      problems: ["Hypertension"],
      insurance: "Example Health",
      lastVisit: "2026-07-18",
    });
    expect(model.change.status).toBe("not_available");
    expect(model.staffHandoff.status).toBe("not_available");
  });

  it("derives close-visit blockers from existing required documentation rather than AI inference", () => {
    const model = buildCurrentVisitModel(patient, encounter());

    expect(model.closeVisit.missingRequiredSections).toEqual([
      "History of present illness",
      "Plan",
    ]);
    expect(model.closeVisit.requiredDocumentationComplete).toBe(false);
    expect(model.closeVisit.noteLocked).toBe(false);
  });

  it("reports a locked complete encounter without inferring external completion", () => {
    const model = buildCurrentVisitModel(patient, encounter({
      status: "Locked",
      hpi: "Home readings improved after adherence changes.",
      plan: "Continue medication and reassess in four weeks.",
    }));

    expect(model.closeVisit.missingRequiredSections).toEqual([]);
    expect(model.closeVisit.requiredDocumentationComplete).toBe(true);
    expect(model.closeVisit.noteLocked).toBe(true);
    expect(model.closeVisit.externalCompletion).toBe("not_inferred");
  });
});
