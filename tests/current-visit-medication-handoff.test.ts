import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCurrentVisitModel } from "@/lib/clinical/current-visit-model";
import type { PatientVital } from "@/lib/clinical/vital-types";
import type { Encounter, Patient } from "@/lib/types";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

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

const medicationReconciliation = {
  id: "recon-1",
  status: "completed" as const,
  source: "staff_review",
  summary: "Medication list reviewed with the patient.",
  medicationCount: 3,
  discrepancyCount: 1,
  completedAt: "2026-08-22T13:08:00.000Z",
};

describe("Current Visit medication reconciliation handoff", () => {
  it("surfaces completed encounter-linked medication reconciliation without inventing a completed full handoff", () => {
    const model = buildCurrentVisitModel(patient, encounter, { medicationReconciliation });

    expect(model.staffHandoff.status).toBe("partial");
    if (model.staffHandoff.status !== "partial") throw new Error("expected partial handoff");
    expect(model.staffHandoff.source).toBe("medication_reconciliation");
    expect(model.staffHandoff.medicationReconciliation).toEqual(medicationReconciliation);
    expect(model.staffHandoff.vital).toBeUndefined();
    expect(model.staffHandoff.message).toContain("Medication reconciliation is attached to this encounter");
    expect(model.staffHandoff.message).toContain("Other staff intake remains incomplete");
  });

  it("composes vitals and completed medication reconciliation as separate authoritative sources", () => {
    const model = buildCurrentVisitModel(patient, encounter, { vital, medicationReconciliation });

    expect(model.staffHandoff.status).toBe("partial");
    if (model.staffHandoff.status !== "partial") throw new Error("expected partial handoff");
    expect(model.staffHandoff.source).toBe("multiple");
    expect(model.staffHandoff.vital).toEqual(vital);
    expect(model.staffHandoff.medicationReconciliation).toEqual(medicationReconciliation);
    expect(model.staffHandoff.message).toContain("Vitals and medication reconciliation are attached");
  });

  it("does not surface draft or reopened reconciliation as completed staff handoff evidence", () => {
    for (const candidate of [
      { ...medicationReconciliation, status: "draft", completedAt: null },
      { ...medicationReconciliation, status: "reopened" },
      { ...medicationReconciliation, status: "completed", completedAt: null },
    ]) {
      const model = buildCurrentVisitModel(patient, encounter, { medicationReconciliation: candidate });
      expect(model.staffHandoff.status).toBe("not_available");
    }
  });

  it("still surfaces valid vitals when medication reconciliation is not completed", () => {
    const model = buildCurrentVisitModel(patient, encounter, {
      vital,
      medicationReconciliation: { ...medicationReconciliation, status: "reopened" },
    });

    expect(model.staffHandoff.status).toBe("partial");
    if (model.staffHandoff.status !== "partial") throw new Error("expected partial handoff");
    expect(model.staffHandoff.source).toBe("encounter_vitals");
    expect(model.staffHandoff.vital).toEqual(vital);
    expect(model.staffHandoff.medicationReconciliation).toBeUndefined();
  });

  it("wires only completed authoritative reconciliation records into Current Visit without changing medication authority", () => {
    const page = read("src/app/(platform)/encounters/[encounterId]/page.tsx");
    const editor = read("src/components/clinic/encounter-editor.tsx");
    const repository = read("src/lib/clinical/encounter-medication-reconciliation.ts");

    expect(page).toContain("findMedicationReconciliationForEncounter");
    expect(page).toContain("medicationReconciliation");
    expect(editor).toContain("Medication reconciliation");
    expect(editor).toContain("discrepanc");
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("db.medicationReconciliation.findFirst");
    expect(repository).toContain("organizationId");
    expect(repository).toContain("patientId");
    expect(repository).toContain("encounterId");
    expect(repository).toContain('status: "completed"');
    expect(repository).toContain("completedAt: { not: null }");
  });
});
