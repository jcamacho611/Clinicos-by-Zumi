import { describe, expect, it } from "vitest";
import {
  buildStaffIntakeHandoff,
  type StaffIntakeSnapshot,
} from "@/lib/clinical/staff-intake";

function intake(overrides: Partial<StaffIntakeSnapshot> = {}): StaffIntakeSnapshot {
  return {
    id: "intake-1",
    organizationId: "org-1",
    patientId: "patient-1",
    encounterId: "encounter-1",
    capturedByUserId: "user-ma-1",
    capturedByProfession: "medical_assistant",
    capturedAt: "2026-08-22T14:00:00.000Z",
    reasonForVisit: "Follow-up after motor-vehicle accident",
    changesSinceLastVisit: "Neck pain improved; dizziness newly reported.",
    medicationReconciliation: { status: "reviewed_no_change", note: null },
    allergyReconciliation: { status: "reviewed_no_change", note: null },
    symptomUpdates: [
      { id: "symptom-1", label: "Dizziness", state: "reported", note: "New since prior visit." },
    ],
    bodyMapUpdate: { status: "completed", bodyMapVersionId: "body-map-v3" },
    screenings: [
      { id: "screen-1", label: "Fall risk", status: "completed", resultSummary: "Low risk" },
    ],
    delegatedWork: [
      { id: "task-1", label: "Medication reconciliation", status: "completed", escalationReason: null },
    ],
    ...overrides,
  };
}

describe("governed Current Visit staff intake foundation", () => {
  it("records an explicit staff profession instead of a generic clinical_staff authority shortcut", () => {
    const handoff = buildStaffIntakeHandoff(intake());

    expect(handoff.performerProfession).toBe("medical_assistant");
    expect(handoff.performerProfession).not.toBe("clinical_staff");
  });

  it("does not call medication or allergy reconciliation complete when either is not reviewed", () => {
    const handoff = buildStaffIntakeHandoff(intake({
      medicationReconciliation: { status: "not_reviewed", note: null },
    }));

    expect(handoff.status).toBe("incomplete");
    expect(handoff.blockers).toContain("Medication reconciliation not reviewed");
  });

  it("requires encounter-scoped reason-for-visit evidence and never substitutes patient-summary context", () => {
    const handoff = buildStaffIntakeHandoff(intake({ reasonForVisit: "   " }));

    expect(handoff.status).toBe("incomplete");
    expect(handoff.blockers).toContain("Reason for visit not captured");
  });

  it("surfaces delegated work requiring escalation instead of presenting the handoff as ready", () => {
    const handoff = buildStaffIntakeHandoff(intake({
      delegatedWork: [
        { id: "task-1", label: "Medication reconciliation", status: "needs_provider_review", escalationReason: "Patient reports an unverified dose change." },
      ],
    }));

    expect(handoff.status).toBe("needs_provider_review");
    expect(handoff.escalations).toEqual([
      "Medication reconciliation: Patient reports an unverified dose change.",
    ]);
  });

  it("treats missing symptom updates as unknown rather than as a denial of symptoms", () => {
    const handoff = buildStaffIntakeHandoff(intake({ symptomUpdates: [] }));

    expect(handoff.symptomEvidenceStatus).toBe("not_documented");
    expect(handoff.status).toBe("incomplete");
    expect(handoff.blockers).toContain("Symptom updates not documented");
  });

  it("produces a ready handoff only when the required governed intake evidence is explicitly present", () => {
    const handoff = buildStaffIntakeHandoff(intake());

    expect(handoff.status).toBe("ready");
    expect(handoff.blockers).toEqual([]);
    expect(handoff.escalations).toEqual([]);
    expect(handoff.source).toBe("encounter_staff_intake");
    expect(handoff.patientId).toBe("patient-1");
    expect(handoff.encounterId).toBe("encounter-1");
  });
});