import { describe, expect, it } from "vitest";

import {
  describeHandoffAttribution,
  handoffAttributionFor,
  type ClinicalRecorder,
} from "@/lib/clinical/staff-handoff-attribution";

/**
 * The physician requirement is that every handoff item names the role that recorded
 * it, and that MA, LPN and RN are never collapsed.
 *
 * The `vitals` table currently stores no recorder at all, so that requirement cannot
 * be met for existing data. The honest behaviour is to say attribution was not
 * captured — not to omit the question, and never to guess a role from context.
 */

describe("handoffAttributionFor", () => {
  it("reports not-captured when no recorder is present", () => {
    expect(handoffAttributionFor(null)).toEqual({ recorded: false, reason: "not_captured" });
    expect(handoffAttributionFor(undefined)).toEqual({ recorded: false, reason: "not_captured" });
  });

  it("reports not-captured when a recorder carries no role", () => {
    // A name without a role cannot satisfy "names the role that recorded it".
    expect(handoffAttributionFor({ name: "A. Rivera", role: null })).toEqual({
      recorded: false,
      reason: "role_not_captured",
    });
  });

  it("names the recording role when it is genuinely present", () => {
    const recorder: ClinicalRecorder = { name: "A. Rivera", role: "medical_assistant" };
    expect(handoffAttributionFor(recorder)).toEqual({
      recorded: true,
      name: "A. Rivera",
      role: "medical_assistant",
      roleLabel: "Medical assistant",
    });
  });

  it("keeps the three clinical roles distinct rather than collapsing them", () => {
    const labels = (["medical_assistant", "licensed_practical_nurse", "registered_nurse"] as const)
      .map((role) => handoffAttributionFor({ name: "X", role }))
      .map((a) => (a.recorded ? a.roleLabel : null));

    expect(labels).toEqual(["Medical assistant", "Licensed practical nurse", "Registered nurse"]);
    expect(new Set(labels).size).toBe(3);
  });

  it("does not treat the generic clinical_staff role as an answer", () => {
    // `clinical_staff` is retained for existing memberships but cannot satisfy the
    // requirement, because it is exactly the collapse the requirement prohibits.
    expect(handoffAttributionFor({ name: "X", role: "clinical_staff" })).toEqual({
      recorded: false,
      reason: "role_not_specific",
    });
  });
});

describe("describeHandoffAttribution", () => {
  it("explains an uncaptured recorder in plain language", () => {
    const sentence = describeHandoffAttribution({ recorded: false, reason: "not_captured" });
    expect(sentence).toBe("Who recorded this was not saved with the measurement.");
    expect(sentence).not.toMatch(/[A-Z_]{4,}/); // no internal state names leaking to users
  });

  it("explains a non-specific role without blaming the user", () => {
    expect(describeHandoffAttribution({ recorded: false, reason: "role_not_specific" }))
      .toBe("This was recorded before Klinikos told medical assistants, LPNs and RNs apart.");
  });

  it("names the role plainly when it is known", () => {
    expect(describeHandoffAttribution({
      recorded: true, name: "A. Rivera", role: "registered_nurse", roleLabel: "Registered nurse",
    })).toBe("Recorded by A. Rivera, registered nurse.");
  });

  it("never invents a role it does not have", () => {
    for (const reason of ["not_captured", "role_not_captured", "role_not_specific"] as const) {
      const sentence = describeHandoffAttribution({ recorded: false, reason });
      expect(sentence).not.toMatch(/medical assistant,|nurse\.$/i);
    }
  });
});
