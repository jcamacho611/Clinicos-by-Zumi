import { describe, expect, it } from "vitest";
import { buildCurrentVisitModel } from "@/lib/clinical/current-visit-model";
import type { Encounter, Patient } from "@/lib/types";

const patient: Patient = {
  id: "patient-close-1",
  organizationId: "org-1",
  mrn: "MRN-CLOSE-1",
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
  nextAppointment: "2026-09-02",
  provider: "Dr. Rivera",
  location: "Downtown",
  allergies: [],
  medications: [],
  problems: [],
  lastVisit: "2026-07-18",
};

function encounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: "encounter-close-1",
    organizationId: "org-1",
    patientId: patient.id,
    date: "2026-08-22",
    type: "Follow-up",
    provider: "Dr. Rivera",
    patientName: "Jordan Lee",
    patientInitials: "JL",
    patientMrn: patient.mrn,
    status: "Ready for Review",
    chiefComplaint: "Follow-up",
    hpi: "Symptoms are improving.",
    subjective: "No new concerns.",
    objective: "Exam documented.",
    assessment: "Improving.",
    plan: "Continue treatment.",
    diagnoses: [{ code: "M54.2", label: "Cervicalgia", primary: true }],
    procedures: [],
    patientInstructions: "Continue home plan.",
    followUp: "Return in four weeks.",
    requiresCosignature: false,
    addenda: [],
    auditHistory: [],
    ...overrides,
  };
}

const evidence = <TState extends string>(state: TState, domain: string) => ({
  state,
  source: `${domain}_repository`,
  evidenceRef: `${domain}:record-1`,
});

describe("Current Visit close-resolution projection", () => {
  it("defaults downstream close domains to not evaluated rather than implying completion", () => {
    const model = buildCurrentVisitModel(patient, encounter());

    expect(model.closeVisit.resolution.readiness).toBe("not_fully_evaluated");
    expect(model.closeVisit.resolution.unevaluatedDomains).toEqual([
      "Coding",
      "Orders/results",
      "AI review",
      "Attestations",
      "Charge readiness",
    ]);
    expect(model.closeVisit.resolution.evidence).toEqual([]);
    expect(model.closeVisit.resolution.canClaimReadyToClose).toBe(false);
  });

  it("projects explicit governed close evidence only when source provenance is supplied", () => {
    const model = buildCurrentVisitModel(patient, encounter(), {
      closeEvaluation: {
        coding: evidence("ready" as const, "coding"),
        ordersResults: evidence("resolved" as const, "orders-results"),
        aiReview: evidence("not_applicable" as const, "ai-review"),
        attestations: evidence("complete" as const, "attestations"),
        chargeReadiness: evidence("ready" as const, "charge-readiness"),
      },
    });

    expect(model.closeVisit.resolution.readiness).toBe("ready");
    expect(model.closeVisit.resolution.readyForSignature).toBe(true);
    expect(model.closeVisit.resolution.finalClosureComplete).toBe(false);
    expect(model.closeVisit.resolution.evidence).toHaveLength(5);
    expect(model.closeVisit.resolution.evidence.find((item) => item.domain === "Orders/results")).toEqual({
      domain: "Orders/results",
      source: "orders-results_repository",
      evidenceRef: "orders-results:record-1",
    });
  });

  it("fails closed when a caller claims resolution without usable provenance", () => {
    const model = buildCurrentVisitModel(patient, encounter(), {
      closeEvaluation: {
        ordersResults: { state: "resolved", source: "", evidenceRef: " " },
      },
    });

    expect(model.closeVisit.resolution.readiness).toBe("not_fully_evaluated");
    expect(model.closeVisit.resolution.unevaluatedDomains).toContain("Orders/results");
    expect(model.closeVisit.resolution.evidence.some((item) => item.domain === "Orders/results")).toBe(false);
    expect(model.closeVisit.resolution.canClaimReadyToClose).toBe(false);
  });

  it("keeps a signed encounter externally incomplete when downstream evidence was never evaluated", () => {
    const model = buildCurrentVisitModel(patient, encounter({ status: "Signed" }));

    expect(model.closeVisit.resolution.noteLocked).toBe(true);
    expect(model.closeVisit.resolution.readiness).toBe("not_fully_evaluated");
    expect(model.closeVisit.resolution.finalClosureComplete).toBe(false);
  });
});
