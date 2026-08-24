import { describe, expect, it } from "vitest";
import {
  selectPreviousFinalizedEncounter,
  type LongitudinalEncounterReference,
} from "@/lib/clinical/previous-finalized-encounter";

function ref(input: LongitudinalEncounterReference): LongitudinalEncounterReference {
  return input;
}

const current = ref({
  id: "enc-current",
  organizationId: "org-a",
  patientId: "patient-a",
  serviceDate: new Date("2026-08-23T14:00:00.000Z"),
  status: "Draft",
});

describe("selectPreviousFinalizedEncounter", () => {
  it("selects the most recent strictly-earlier finalized encounter for the same patient and organization", () => {
    const selected = selectPreviousFinalizedEncounter(current, [
      ref({ id: "enc-other-patient", organizationId: "org-a", patientId: "patient-b", serviceDate: new Date("2026-08-22T16:00:00.000Z"), status: "Locked" }),
      ref({ id: "enc-ready", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-22T18:00:00.000Z"), status: "Ready for Review" }),
      ref({ id: "enc-signed-old", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-20T18:00:00.000Z"), status: "Signed" }),
      ref({ id: "enc-locked-new", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-22T17:00:00.000Z"), status: "Locked" }),
      ref({ id: "enc-future", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-24T17:00:00.000Z"), status: "Locked" }),
    ]);

    expect(selected?.id).toBe("enc-locked-new");
  });

  it("treats Addendum Needed as signed historical evidence rather than draft work", () => {
    expect(selectPreviousFinalizedEncounter(current, [
      ref({ id: "enc-addendum-needed", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-21T17:00:00.000Z"), status: "Addendum Needed" }),
    ])?.id).toBe("enc-addendum-needed");
  });

  it("fails closed for same-time, cross-organization, or invalid-current-date candidates", () => {
    expect(selectPreviousFinalizedEncounter(current, [
      ref({ id: "enc-same-time", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-23T14:00:00.000Z"), status: "Locked" }),
    ])).toBeNull();

    expect(selectPreviousFinalizedEncounter(current, [
      ref({ id: "enc-cross-org", organizationId: "org-b", patientId: "patient-a", serviceDate: new Date("2026-08-22T17:00:00.000Z"), status: "Locked" }),
    ])).toBeNull();

    expect(selectPreviousFinalizedEncounter({ ...current, serviceDate: new Date("invalid") }, [
      ref({ id: "enc-old", organizationId: "org-a", patientId: "patient-a", serviceDate: new Date("2026-08-22T17:00:00.000Z"), status: "Locked" }),
    ])).toBeNull();
  });
});
