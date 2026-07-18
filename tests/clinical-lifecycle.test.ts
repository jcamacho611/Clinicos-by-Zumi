import { describe, expect, it } from "vitest";
import {
  canTransitionAppointment,
  nextAppointmentStatuses,
} from "@/lib/appointment-lifecycle";
import {
  canEditEncounter,
  canTransitionEncounter,
  missingEncounterReviewFields,
} from "@/lib/encounter-lifecycle";
import { mapAppointmentAggregate } from "@/lib/repositories/appointment-mapper";
import { mapEncounterAggregate } from "@/lib/repositories/encounter-mapper";

describe("clinical lifecycle rules", () => {
  it("only exposes valid appointment transitions", () => {
    expect(canTransitionAppointment("CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canTransitionAppointment("CONFIRMED", "COMPLETED")).toBe(false);
    expect(nextAppointmentStatuses("Checked In")).toEqual([
      { key: "IN_ROOM", label: "In Room" },
      { key: "CANCELLED", label: "Cancelled" },
    ]);
  });

  it("requires a complete provider review core before submission", () => {
    expect(canEditEncounter("DRAFT")).toBe(true);
    expect(canEditEncounter("READY_FOR_REVIEW")).toBe(false);
    expect(canTransitionEncounter("DRAFT", "ready_for_review")).toBe(true);
    expect(canTransitionEncounter("DRAFT", "sign_and_lock")).toBe(false);
    expect(missingEncounterReviewFields({
      chiefComplaint: "Follow-up",
      hpi: " ",
      assessment: null,
      plan: "Return in three months",
    })).toEqual(["HPI", "Assessment"]);
  });
});

describe("clinical database mapping", () => {
  it("maps a tenant appointment without losing its tenant identity", () => {
    const appointment = mapAppointmentAggregate({
      appointment: {
        id: "apt-1",
        organizationId: "org-bfm",
        patientId: "pt-1001",
        startsAt: new Date("2026-07-14T13:00:00.000Z"),
        endsAt: new Date("2026-07-14T13:30:00.000Z"),
        status: "CHECKED_IN",
        telemedicine: false,
        formsComplete: true,
        insuranceVerified: true,
        paymentDueCents: 2500,
      },
      patient: { firstName: "Maya", lastName: "Thompson" },
      provider: { name: "Nadja R.", credential: "NP" },
      location: { name: "Brooklyn Heights", timezone: "America/New_York" },
      appointmentType: { name: "Diabetes follow-up" },
    }, new Date("2026-07-14T12:00:00.000Z"));

    expect(appointment.organizationId).toBe("org-bfm");
    expect(appointment.patient).toBe("Maya Thompson");
    expect(appointment.status).toBe("Checked In");
    expect(appointment.paymentDue).toBe(25);
    expect(appointment.startsAt).toBe("2026-07-14T13:00:00.000Z");
  });

  it("maps SOAP, coding, and immutable audit history into one encounter", () => {
    const encounter = mapEncounterAggregate({
      encounter: {
        id: "enc-1001",
        organizationId: "org-bfm",
        patientId: "pt-1001",
        type: "Diabetes follow-up",
        serviceDate: new Date("2026-07-14T13:00:00.000Z"),
        status: "DRAFT",
        chiefComplaint: "Follow-up",
        hpi: "Recent elevated readings",
        assessment: "Diabetes",
        plan: "Provider review",
        patientInstructions: "Call with concerns",
        followUpPlan: "Three months",
        requiresCosignature: false,
      },
      patient: { firstName: "Maya", lastName: "Thompson", mrn: "BFM-28419" },
      provider: { name: "Nadja R.", credential: "NP" },
      soapNote: { subjective: "Home readings elevated", objective: "Stable", assessment: "Diabetes", plan: "Provider review" },
      diagnoses: [{ code: "E11.65", label: "Type 2 diabetes with hyperglycemia", primary: true }],
      procedures: [{ code: "99214", label: "Established patient visit", modifiers: ["25"] }],
      addenda: [{ id: "addendum-1", content: { reason: "Clarification", text: "Corrected follow-up interval." }, signedBy: "user-nadja", signedAt: new Date("2026-07-15T12:00:00.000Z"), createdAt: new Date("2026-07-15T12:00:00.000Z") }],
      addendumAuthors: [{ id: "user-nadja", name: "Nadja R., NP" }],
      auditHistory: [{
        id: "audit-1",
        action: "encounter.draft_saved",
        actorId: "user-nadja",
        actorType: "user",
        metadata: { actorName: "Nadja R., NP" },
        createdAt: new Date("2026-07-14T13:06:00.000Z"),
      }],
    });

    expect(encounter.organizationId).toBe("org-bfm");
    expect(encounter.patientMrn).toBe("BFM-28419");
    expect(encounter.subjective).toBe("Home readings elevated");
    expect(encounter.diagnoses[0]?.code).toBe("E11.65");
    expect(encounter.diagnoses[0]?.primary).toBe(true);
    expect(encounter.procedures[0]?.modifiers).toEqual(["25"]);
    expect(encounter.addenda[0]).toMatchObject({ reason: "Clarification", author: "Nadja R., NP" });
    expect(encounter.auditHistory[0]).toMatchObject({ action: "draft saved", actor: "Nadja R., NP" });
  });
});
