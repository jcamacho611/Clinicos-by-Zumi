import { describe, expect, it } from "vitest";
import {
  detectRisks,
  detectRisksAcross,
  initialActionState,
  prepareActions,
  riskExplanations,
  riskKinds,
  streamForState,
  type AppointmentSnapshot,
} from "@/lib/operations/followup-rules";
import {
  migrationOutlook,
  nextStep,
  onboardingProgress,
  onboardingSteps,
  type KnownContext,
} from "@/lib/onboarding/onboarding-rules";

/**
 * The first real automation loop. What these tests defend: Klinikos acts only where
 * acting is safe and reversible, and never describes a message as sent when no
 * channel exists to send it.
 */

const NOW = new Date("2026-08-11T09:00:00Z");
const inHours = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000);

const appointment = (overrides: Partial<AppointmentSnapshot> = {}): AppointmentSnapshot => ({
  id: "appt_1",
  patientId: "pat_1",
  startsAt: inHours(24),
  status: "CONFIRMED",
  formsComplete: true,
  insuranceVerified: true,
  ...overrides,
});

describe("risk detection", () => {
  it("flags an appointment the patient has not confirmed", () => {
    const risks = detectRisks(appointment({ status: "PENDING_CONFIRMATION" }), NOW);
    expect(risks.map((risk) => risk.kind)).toEqual(["unconfirmed"]);
  });

  it("leaves a confirmed, prepared appointment alone", () => {
    expect(detectRisks(appointment(), NOW)).toEqual([]);
  });

  it("reports several risks on one appointment rather than one vague flag", () => {
    // Unconfirmed *and* missing paperwork is common, and collapsing them loses the
    // part that tells someone what to do.
    const risks = detectRisks(
      appointment({ status: "PENDING_CONFIRMATION", formsComplete: false, insuranceVerified: false }),
      NOW,
    );
    expect(risks.map((risk) => risk.kind).sort()).toEqual(["insurance_unverified", "missing_forms", "unconfirmed"]);
  });

  it("does not chase confirmation weeks out", () => {
    // Chasing three weeks ahead annoys the patient and the answer changes anyway.
    expect(detectRisks(appointment({ status: "PENDING_CONFIRMATION", startsAt: inHours(400) }), NOW)).toEqual([]);
  });

  it("grows more urgent as the appointment approaches", () => {
    const far = detectRisks(appointment({ status: "PENDING_CONFIRMATION", startsAt: inHours(70) }), NOW)[0];
    const near = detectRisks(appointment({ status: "PENDING_CONFIRMATION", startsAt: inHours(6) }), NOW)[0];
    expect(near.urgency).toBeGreaterThan(far.urgency);
  });

  it("ignores an appointment that has already happened or been cancelled", () => {
    for (const status of ["COMPLETED", "CANCELLED", "RESCHEDULED", "CHECKED_IN", "WITH_PROVIDER"]) {
      expect({ status, risks: detectRisks(appointment({ status, formsComplete: false }), NOW) }).toEqual({ status, risks: [] });
    }
  });

  it("does not raise work on a past appointment nobody closed out", () => {
    // That is a data-quality problem. Chasing it produces work nobody can action.
    expect(detectRisks(appointment({ status: "PENDING_CONFIRMATION", startsAt: inHours(-10) }), NOW)).toEqual([]);
  });

  it("offers to rebook a recent no-show, and stops after a fortnight", () => {
    expect(detectRisks(appointment({ status: "NO_SHOW", startsAt: inHours(-48) }), NOW).map((risk) => risk.kind))
      .toEqual(["no_show_recovery"]);
    expect(detectRisks(appointment({ status: "NO_SHOW", startsAt: inHours(-400) }), NOW)).toEqual([]);
  });

  it("orders the queue by urgency", () => {
    const risks = detectRisksAcross(
      [
        appointment({ id: "a", status: "PENDING_CONFIRMATION", startsAt: inHours(70) }),
        appointment({ id: "b", status: "PENDING_CONFIRMATION", startsAt: inHours(4) }),
      ],
      NOW,
    );
    expect(risks[0].appointmentId).toBe("b");
  });

  it("explains every risk kind in an owner's words", () => {
    for (const kind of riskKinds) {
      expect({ kind, explained: (riskExplanations[kind] ?? "").length > 30 }).toEqual({ kind, explained: true });
    }
  });
});

describe("what Klinikos does about it", () => {
  const risk = detectRisks(appointment({ status: "PENDING_CONFIRMATION" }), NOW)[0];

  it("prepares internal work and patient outreach separately", () => {
    const actions = prepareActions(risk, "Dana Reyes", "Harbor Aesthetics");
    expect(actions.map((action) => action.kind)).toEqual(["internal_task", "patient_message"]);
  });

  it("only ever auto-executes work that stays inside the clinic", () => {
    // An unwanted message cannot be recalled, so nothing a patient would receive is
    // auto-executable however routine it looks.
    for (const kind of riskKinds) {
      const detected = { appointmentId: "a", patientId: "p", kind, startsAt: inHours(24), hoursUntil: 24, urgency: 50 };
      for (const action of prepareActions(detected, "Dana Reyes", "Harbor Aesthetics")) {
        if (action.kind === "patient_message") {
          expect({ kind, auto: action.autoExecutable }).toEqual({ kind, auto: false });
        }
      }
    }
  });

  it("writes a message that names the patient and the clinic", () => {
    const message = prepareActions(risk, "Dana Reyes", "Harbor Aesthetics").find((action) => action.kind === "patient_message");
    expect(message?.body).toContain("Dana Reyes");
    expect(message?.body).toContain("Harbor Aesthetics");
  });

  it("never calls a message sent when no channel is connected", () => {
    // This is the whole point of the loop's honesty. "Prepared, awaiting connection"
    // is true; "Sent" would not be.
    const [task, message] = prepareActions(risk, "Dana Reyes", "Harbor Aesthetics");
    expect(initialActionState(task, false)).toBe("executed");
    expect(initialActionState(message, false)).toBe("awaiting_connection");
  });

  it("asks a person before sending once a channel exists", () => {
    const message = prepareActions(risk, "Dana Reyes", "Harbor Aesthetics")[1];
    expect(initialActionState(message, true)).toBe("awaiting_confirmation");
  });

  it("sorts each state into the stream an owner expects", () => {
    expect(streamForState("executed")).toBe("handled");
    expect(streamForState("awaiting_confirmation")).toBe("awaiting_you");
    expect(streamForState("awaiting_connection")).toBe("blocked");
    expect(streamForState("dismissed")).toBe("completed");
  });
});

describe("onboarding", () => {
  const empty: KnownContext = {
    clinicName: null, clinicType: null, locationCount: null, providerCount: null, contactName: null, sources: {},
  };
  const known: KnownContext = {
    clinicName: "Harbor Aesthetics",
    clinicType: "medical_spa",
    locationCount: "2_5",
    providerCount: "2_5",
    contactName: "Dana Reyes",
    sources: { clinicName: "enquiry", locationCount: "enquiry", providerCount: "enquiry" },
  };

  it("starts by asking for a clinic name nobody has supplied", () => {
    expect(nextStep(empty, {}).key).toBe("identity");
  });

  it("never asks for what the buyer already told the enquiry form", () => {
    // This is the automation-first rule made concrete: a fact Klinikos holds is a
    // question the owner is not asked.
    const step = nextStep(known, {});
    expect(step.key).not.toBe("identity");
    expect(step.key).not.toBe("scale");
  });

  it("proposes what it knows instead of presenting a blank", () => {
    expect(onboardingSteps[0].prompt(known, {})).toContain("Harbor Aesthetics");
  });

  it("counts a prefilled clinic as further along before a single answer", () => {
    expect(onboardingProgress(known, {}).done).toBeGreaterThan(onboardingProgress(empty, {}).done);
  });

  it("reaches review once everything is answered", () => {
    const answers = {
      clinicName: "Harbor Aesthetics", specialty: "medical_spa" as const,
      locationCount: "2_5", providerCount: "2_5", currentSystem: "jane" as const,
      priorities: ["follow_up" as const],
    };
    expect(nextStep(empty, answers).key).toBe("review");
    expect(onboardingProgress(empty, answers).complete).toBe(true);
  });

  it("does not promise an automatic migration an enterprise vendor will not allow", () => {
    // Telling a clinic on Epic that Klinikos imports everything is a promise that
    // fails on day one of the engagement.
    const epic = migrationOutlook("epic");
    expect(epic.automatic).toEqual([]);
    expect(epic.note).toContain("do not offer self-service export");

    const fresh = migrationOutlook("none");
    expect(fresh.needsExport).toEqual([]);
  });
});
