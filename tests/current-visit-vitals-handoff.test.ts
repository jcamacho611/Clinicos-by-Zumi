import { describe, expect, it } from "vitest";
import { buildCurrentVisitModel } from "@/lib/clinical/current-visit-model";
import type { PatientVital } from "@/lib/clinical/vital-types";
import type { Encounter, Patient } from "@/lib/types";

const patient = {
  id: "patient-1",
  organizationId: "org-1",
  mrn: "MRN-1",
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
  riskLevel: "Normal",
  riskFlags: [],
  nextAppointment: "",
  provider: "Dr. Rivera",
  location: "Downtown",
  allergies: [],
  medications: [],
  problems: [],
  lastVisit: "2026-07-18",
} satisfies Patient;

const encounter = {
  id: "encounter-1",
  organizationId: "org-1",
  patientId: "patient-1",
  date: "2026-08-22",
  type: "Follow-up",
  provider: "Dr. Rivera",
  patientName: "Jordan Lee",
  patientInitials: "JL",
  patientMrn: "MRN-1",
  status: "Draft",
  chiefComplaint: "Follow-up",
  hpi: "Interval history.",
  subjective: "",
  objective: "",
  assessment: "Hypertension",
  plan: "Continue plan.",
  diagnoses: [],
  procedures: [],
  patientInstructions: "",
  followUp: "",
  requiresCosignature: false,
  addenda: [],
  auditHistory: [],
} satisfies Encounter;

const vital: PatientVital = {
  id: "vital-1",
  measuredAt: "2026-08-22T13:02:00.000Z",
  bloodPressureSystolic: 132,
  bloodPressureDiastolic: 84,
  heartRate: 76,
  temperatureF: 98.4,
  oxygenPercent: 98,
  weightLbs: 171,
  heightInches: 65,
  bmi: 28.5,
};

describe("Current Visit encounter-linked staff handoff", () => {
  it("surfaces persisted encounter vitals as a partial handoff without inventing other intake", () => {
    const model = buildCurrentVisitModel(patient, encounter, { vital });

    expect(model.staffHandoff.status).toBe("partial");
    if (model.staffHandoff.status !== "partial") throw new Error("expected partial handoff");
    expect(model.staffHandoff.source).toBe("encounter_vitals");
    expect(model.staffHandoff.vital).toEqual(vital);
    expect(model.staffHandoff.message).toContain("Vitals were captured for this encounter");
    expect(model.staffHandoff.message).toContain("Other staff intake is not yet attached");
  });

  it("keeps the handoff unavailable when no encounter-linked vital exists", () => {
    const model = buildCurrentVisitModel(patient, encounter, { vital: null });
    expect(model.staffHandoff.status).toBe("not_available");
  });
});
