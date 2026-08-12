import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  eligibleGridActivities,
  evaluateGridEligibility,
  getGridActivity,
  gridActivityCatalog,
  type GridEligibilityCredential,
  type GridEligibilityParticipant,
} from "@/lib/grid/eligibility";

/**
 * The critical Grid tests, as the build directive states them.
 *
 * These assert properties of the marketplace, not the shape of the implementation: an
 * unverified provider must not reach regulated work no matter how that is arranged
 * internally.
 */

const AT = new Date("2026-08-12T12:00:00Z");
const NEXT_YEAR = new Date("2027-08-12T12:00:00Z");
const LAST_YEAR = new Date("2025-08-12T12:00:00Z");

const verifiedNurse: GridEligibilityParticipant = {
  verificationStatus: "verified",
  providerType: "Registered Nurse",
  malpracticeVerificationStatus: "verified",
  malpracticeExpiration: NEXT_YEAR,
};

const nyLicense: GridEligibilityCredential = {
  type: "RN",
  state: "NY",
  expiresAt: NEXT_YEAR,
  status: "active",
  verificationStatus: "verified",
};

const eligibleInNY = {
  participant: verifiedNurse,
  credentials: [nyLicense],
  privileges: [{ facilityId: "fac_1", status: "active", expiresAt: NEXT_YEAR }],
  activity: "perform_rn_service",
  jurisdiction: "NY",
  facilityId: "fac_1",
  at: AT,
};

const codes = (decision: ReturnType<typeof evaluateGridEligibility>) =>
  decision.eligible ? [] : decision.failures.map((failure) => failure.code);

describe("the baseline eligible case", () => {
  it("admits a verified, licensed, insured, privileged participant", () => {
    const decision = evaluateGridEligibility(eligibleInNY);
    expect(decision.eligible).toBe(true);
  });

  it("records the basis it relied on, so the decision can be re-examined", () => {
    const decision = evaluateGridEligibility(eligibleInNY);
    expect(decision.eligible && decision.basis).toMatchObject({
      activity: "perform_rn_service",
      jurisdiction: "NY",
      credentialType: "RN",
      facilityId: "fac_1",
    });
  });
});

describe("1 — unverified providers cannot receive regulated opportunities", () => {
  it("refuses a participant whose human verification has not completed", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      participant: { ...verifiedNurse, verificationStatus: "submitted" },
    });
    expect(codes(decision)).toContain("participant_unverified");
  });

  it("does not let a perfect credential substitute for verification", () => {
    // The credential is current, in-jurisdiction and verified. That is not the same
    // question as whether a person has reviewed this participant.
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      participant: { ...verifiedNurse, verificationStatus: "draft" },
    });
    expect(decision.eligible).toBe(false);
  });
});

describe("2 — wrong-jurisdiction providers cannot qualify", () => {
  it("refuses a licence issued somewhere other than where the work happens", () => {
    const decision = evaluateGridEligibility({ ...eligibleInNY, jurisdiction: "TX" });
    expect(codes(decision)).toContain("credential_wrong_jurisdiction");
  });

  it("refuses when the jurisdiction is unknown rather than assuming it matches", () => {
    const decision = evaluateGridEligibility({ ...eligibleInNY, jurisdiction: null });
    expect(codes(decision)).toContain("jurisdiction_unknown");
  });

  it("compares jurisdictions case- and whitespace-insensitively", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      jurisdiction: " ny ",
      credentials: [{ ...nyLicense, state: "ny" }],
    });
    expect(decision.eligible).toBe(true);
  });

  it("still admits an activity that needs no licence to practise", () => {
    const decision = evaluateGridEligibility({
      participant: { ...verifiedNurse, providerType: "Facility Owner" },
      credentials: [],
      activity: "host_at_facility",
      jurisdiction: null,
      at: AT,
    });
    expect(decision.eligible).toBe(true);
  });
});

describe("3 — expired credentials invalidate eligibility", () => {
  it("refuses an expired licence", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      credentials: [{ ...nyLicense, expiresAt: LAST_YEAR }],
    });
    expect(codes(decision)).toContain("credential_expired");
  });

  it("refuses a licence that lapses partway through the engagement", () => {
    // Eligibility on the first day is not eligibility. Work booked past the expiry is
    // unlicensed work, and checking only the start date is exactly how that ships.
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      credentials: [{ ...nyLicense, expiresAt: new Date("2026-09-01T00:00:00Z") }],
      through: new Date("2026-10-01T00:00:00Z"),
    });
    expect(codes(decision)).toContain("credential_expired");
  });

  it("refuses an unverified credential", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      credentials: [{ ...nyLicense, verificationStatus: "pending" }],
    });
    expect(codes(decision)).toContain("credential_unverified");
  });

  it("refuses a revoked credential even while it is unexpired", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      credentials: [{ ...nyLicense, status: "revoked" }],
    });
    expect(codes(decision)).toContain("credential_not_active");
  });

  it("refuses expired malpractice, and one that lapses mid-engagement", () => {
    expect(
      codes(evaluateGridEligibility({ ...eligibleInNY, participant: { ...verifiedNurse, malpracticeExpiration: LAST_YEAR } })),
    ).toContain("malpractice_expired");
    expect(
      codes(evaluateGridEligibility({
        ...eligibleInNY,
        participant: { ...verifiedNurse, malpracticeExpiration: new Date("2026-09-01T00:00:00Z") },
        through: new Date("2026-10-01T00:00:00Z"),
      })),
    ).toContain("malpractice_expired");
  });
});

describe("11 — suspended participants cannot transact", () => {
  it.each(["suspended", "revoked", "rejected", "expired"])("refuses a %s participant", (status) => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      participant: { ...verifiedNurse, verificationStatus: status },
    });
    expect(codes(decision)).toContain("participant_suspended");
  });

  it("distinguishes suspended from merely unverified", () => {
    // They need different answers: one is waiting, the other has been stopped.
    expect(codes(evaluateGridEligibility({ ...eligibleInNY, participant: { ...verifiedNurse, verificationStatus: "suspended" } })))
      .not.toContain("participant_unverified");
  });
});

describe("scope of practice is checked before credentials", () => {
  it("refuses work outside the participant's provider type", () => {
    const decision = evaluateGridEligibility({ ...eligibleInNY, activity: "provide_medical_direction" });
    expect(codes(decision)).toContain("scope_of_practice");
  });

  it("does not make someone eligible for everything because they hold one licence", () => {
    // The assumption the constitution forbids, stated as a test: the same verified,
    // licensed, insured nurse is eligible for RN service and not for medical direction.
    expect(evaluateGridEligibility(eligibleInNY).eligible).toBe(true);
    expect(evaluateGridEligibility({ ...eligibleInNY, activity: "provide_medical_direction" }).eligible).toBe(false);
  });
});

describe("facility privileges", () => {
  it("refuses when no facility was named for an activity that happens at one", () => {
    expect(codes(evaluateGridEligibility({ ...eligibleInNY, facilityId: null }))).toContain("facility_unknown");
  });

  it("refuses a privilege at a different facility", () => {
    expect(codes(evaluateGridEligibility({ ...eligibleInNY, facilityId: "fac_2" }))).toContain("no_facility_privilege");
  });

  it("refuses a privilege that lapses before the engagement ends", () => {
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      privileges: [{ facilityId: "fac_1", status: "active", expiresAt: new Date("2026-09-01T00:00:00Z") }],
      through: new Date("2026-10-01T00:00:00Z"),
    });
    expect(codes(decision)).toContain("facility_privilege_expired");
  });

  it("does not require one for an activity that does not happen at a facility", () => {
    const decision = evaluateGridEligibility({
      participant: { ...verifiedNurse, providerType: "Physician" },
      credentials: [{ ...nyLicense, type: "MD" }],
      activity: "provide_medical_direction",
      jurisdiction: "NY",
      at: AT,
    });
    expect(decision.eligible).toBe(true);
  });
});

describe("10 — intelligence cannot override eligibility", () => {
  it("takes no input a model could supply", () => {
    // Deterministic by construction: there is no override, score, or confidence to pass.
    const source = readFileSync(join(process.cwd(), "src/lib/grid/eligibility.ts"), "utf8");
    for (const forbidden of ["override", "confidence", "score", "zumi", "llm", "model"]) {
      expect(source.toLowerCase()).not.toContain(`${forbidden}:`);
    }
  });

  it("is a pure module with no database or network reach", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/grid/eligibility.ts"), "utf8");
    expect(source).not.toContain("@/lib/db");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("new Date()");
  });

  it("returns the same answer for the same inputs", () => {
    expect(evaluateGridEligibility(eligibleInNY)).toEqual(evaluateGridEligibility(eligibleInNY));
  });
});

describe("refusals are complete and specific", () => {
  it("reports every failing condition at once", () => {
    // One reason per rejection turns fixing a profile into a guessing game.
    const decision = evaluateGridEligibility({
      participant: {
        verificationStatus: "submitted",
        providerType: "Registered Nurse",
        malpracticeVerificationStatus: "pending",
        malpracticeExpiration: LAST_YEAR,
      },
      credentials: [{ ...nyLicense, state: "TX" }],
      activity: "perform_rn_service",
      jurisdiction: "NY",
      facilityId: null,
      at: AT,
    });
    expect(codes(decision)).toEqual(
      expect.arrayContaining(["participant_unverified", "credential_wrong_jurisdiction", "malpractice_unverified", "facility_unknown"]),
    );
  });

  it("names the jurisdiction problem rather than blaming the expiry", () => {
    // Telling a New York nurse their licence expired when the work is in Texas sends
    // them to fix the wrong thing.
    const decision = evaluateGridEligibility({
      ...eligibleInNY,
      jurisdiction: "TX",
      credentials: [{ ...nyLicense, expiresAt: LAST_YEAR }],
    });
    expect(codes(decision)).toContain("credential_wrong_jurisdiction");
    expect(codes(decision)).not.toContain("credential_expired");
  });

  it("refuses an activity it has no rule for", () => {
    expect(codes(evaluateGridEligibility({ ...eligibleInNY, activity: "operate_reactor" }))).toEqual(["unknown_activity"]);
  });
});

describe("the activity catalog", () => {
  it("declares every activity it enumerates", () => {
    for (const activity of gridActivityCatalog) {
      expect(getGridActivity(activity.key)).toBe(activity);
    }
  });

  it("requires a jurisdiction match wherever a professional credential is required", () => {
    // A licence is valid only where it was issued. An activity that needs one and does
    // not check where it came from is the wrong-jurisdiction defect waiting to happen.
    for (const activity of gridActivityCatalog) {
      if (activity.acceptableCredentialTypes.length > 0) {
        expect(activity.requiresJurisdictionMatch).toBe(true);
      }
    }
  });

  it("requires malpractice for every activity involving patient contact", () => {
    for (const activity of gridActivityCatalog) {
      if (activity.acceptableCredentialTypes.length > 0) {
        expect(activity.requiresMalpractice).toBe(true);
      }
    }
  });
});

describe("listing what a participant may take on", () => {
  it("never widens the answer the single decision would give", () => {
    const listed = eligibleGridActivities({
      participant: verifiedNurse,
      credentials: [nyLicense],
      privileges: [{ facilityId: "fac_1", status: "active", expiresAt: NEXT_YEAR }],
      jurisdiction: "NY",
      facilityId: "fac_1",
      at: AT,
    });
    for (const entry of listed) {
      const direct = evaluateGridEligibility({
        participant: verifiedNurse,
        credentials: [nyLicense],
        privileges: [{ facilityId: "fac_1", status: "active", expiresAt: NEXT_YEAR }],
        activity: entry.activity,
        jurisdiction: "NY",
        facilityId: "fac_1",
        at: AT,
      });
      expect(entry.decision.eligible).toBe(direct.eligible);
    }
  });

  it("shows this nurse eligible for some activities and not others", () => {
    const listed = eligibleGridActivities({
      participant: verifiedNurse,
      credentials: [nyLicense],
      privileges: [{ facilityId: "fac_1", status: "active", expiresAt: NEXT_YEAR }],
      jurisdiction: "NY",
      facilityId: "fac_1",
      at: AT,
    });
    const eligible = listed.filter((entry) => entry.decision.eligible).map((entry) => entry.activity);
    expect(eligible).toContain("perform_rn_service");
    expect(eligible).not.toContain("provide_medical_direction");
    expect(eligible).not.toContain("perform_np_service");
  });
});
