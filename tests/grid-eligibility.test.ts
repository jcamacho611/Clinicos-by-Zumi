import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  eligibleGridActivities,
  evaluateGridEligibility,
  gridActivityForCategory,
  gridRequestJurisdiction,
  type GridEligibilityCredential,
  type GridEligibilityParticipant,
} from "@/lib/grid/eligibility";
import { gridPaymentConditionSatisfied } from "@/lib/grid-rules";

const AT = new Date("2026-08-12T12:00:00Z");
const NEXT_YEAR = new Date("2027-08-12T12:00:00Z");
const LAST_YEAR = new Date("2025-08-12T12:00:00Z");

const participant: GridEligibilityParticipant = {
  verificationStatus: "verified",
  providerType: "Registered Nurse",
  malpracticeVerificationStatus: "verified",
  malpracticeExpiration: NEXT_YEAR,
};
const credential: GridEligibilityCredential = {
  type: "RN",
  state: "NY",
  expiresAt: NEXT_YEAR,
  status: "active",
  verificationStatus: "verified",
};
const baseline = {
  participant,
  credentials: [credential],
  privileges: [{ facilityId: "fac_1", status: "active", expiresAt: NEXT_YEAR }],
  activity: "perform_rn_service",
  jurisdiction: "NY",
  facilityId: "fac_1",
  at: AT,
};
const codes = (decision: ReturnType<typeof evaluateGridEligibility>) =>
  decision.eligible ? [] : decision.failures.map((failure) => failure.code);

describe("deterministic Grid eligibility", () => {
  it("admits the complete in-scope case and records its basis", () => {
    const decision = evaluateGridEligibility(baseline);
    expect(decision.eligible).toBe(true);
    expect(decision.eligible && decision.basis).toMatchObject({
      activity: "perform_rn_service",
      jurisdiction: "NY",
      credentialType: "RN",
      facilityId: "fac_1",
    });
  });

  it("fails closed for unverified, suspended and wrong-jurisdiction participants", () => {
    expect(codes(evaluateGridEligibility({ ...baseline, participant: { ...participant, verificationStatus: "submitted" } }))).toContain("participant_unverified");
    expect(codes(evaluateGridEligibility({ ...baseline, participant: { ...participant, verificationStatus: "suspended" } }))).toContain("participant_suspended");
    expect(codes(evaluateGridEligibility({ ...baseline, jurisdiction: "TX" }))).toContain("credential_wrong_jurisdiction");
    expect(codes(evaluateGridEligibility({ ...baseline, jurisdiction: null }))).toContain("jurisdiction_unknown");
  });

  it("refuses expired credentials and coverage that lapse during the engagement", () => {
    expect(codes(evaluateGridEligibility({ ...baseline, credentials: [{ ...credential, expiresAt: LAST_YEAR }] }))).toContain("credential_expired");
    expect(codes(evaluateGridEligibility({
      ...baseline,
      participant: { ...participant, malpracticeExpiration: new Date("2026-09-01T00:00:00Z") },
      through: new Date("2026-10-01T00:00:00Z"),
    }))).toContain("malpractice_expired");
  });

  it("does not treat one valid license as authority for every activity", () => {
    expect(evaluateGridEligibility(baseline).eligible).toBe(true);
    expect(codes(evaluateGridEligibility({ ...baseline, activity: "provide_medical_direction" }))).toContain("scope_of_practice");
  });

  it("requires current facility privilege when the activity requires one", () => {
    expect(codes(evaluateGridEligibility({ ...baseline, privileges: [] }))).toContain("no_facility_privilege");
    expect(codes(evaluateGridEligibility({
      ...baseline,
      privileges: [{ facilityId: "fac_1", status: "active", expiresAt: LAST_YEAR }],
    }))).toContain("facility_privilege_expired");
  });

  it("is pure and exposes no model override input", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/grid/eligibility.ts"), "utf8").toLowerCase();
    expect(source).not.toContain("@/lib/db");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("override:");
    expect(source).not.toContain("confidence:");
    expect(source).not.toContain("model:");
    expect(evaluateGridEligibility(baseline)).toEqual(evaluateGridEligibility(baseline));
  });

  it("uses the same decision to list eligible activities", () => {
    const listed = eligibleGridActivities({
      participant,
      credentials: [credential],
      privileges: baseline.privileges,
      jurisdiction: "NY",
      facilityId: "fac_1",
      at: AT,
    });
    expect(listed.find((entry) => entry.activity === "perform_rn_service")?.decision.eligible).toBe(true);
    expect(listed.find((entry) => entry.activity === "provide_medical_direction")?.decision.eligible).toBe(false);
  });
});

describe("marketplace context mapping", () => {
  it("maps known clinical service categories and refuses unknown ones", () => {
    expect(gridActivityForCategory("Nursing", "IV therapy")).toBe("perform_rn_service");
    expect(gridActivityForCategory("Aesthetics", "Botox injector")).toBe("perform_aesthetic_injection");
    expect(gridActivityForCategory("Other", "Mystery work")).toBeNull();
  });

  it("prefers authoritative location jurisdiction", () => {
    expect(gridRequestJurisdiction({ serviceJurisdiction: "TX", location: { state: "ny" } })).toBe("TX");
    expect(gridRequestJurisdiction({ location: { state: " ny " } })).toBe("NY");
    expect(gridRequestJurisdiction({})).toBeNull();
  });
});

describe("payment condition", () => {
  it("blocks confirmation while a required deposit is unresolved", () => {
    expect(gridPaymentConditionSatisfied({
      listing: { requiresDeposit: true },
      paymentStatus: "not_started",
      depositStatus: "pending",
    }).ok).toBe(false);
  });

  it("accepts reviewed payment/deposit truth and no-payment-required work", () => {
    expect(gridPaymentConditionSatisfied({
      listing: { requiresDeposit: true },
      paymentStatus: "recorded",
      depositStatus: "recorded",
    }).ok).toBe(true);
    expect(gridPaymentConditionSatisfied({
      listing: { requiresDeposit: false },
      paymentStatus: "not_required",
      depositStatus: "not_required",
    }).ok).toBe(true);
  });
});

describe("server-side enforcement boundaries", () => {
  const createRoute = () => readFileSync(join(process.cwd(), "src/app/api/grid/requests/route.ts"), "utf8");
  const transitionRoute = () => readFileSync(join(process.cwd(), "src/app/api/grid/requests/[requestId]/transition/route.ts"), "utf8");
  const service = () => readFileSync(join(process.cwd(), "src/lib/grid/eligibility-enforcement.ts"), "utf8");

  it("checks eligibility before request creation", () => {
    expect(createRoute()).toContain("assertGridEligibilityForNewRequest");
  });

  it("rechecks eligibility and payment before confirmation", () => {
    expect(transitionRoute()).toContain("assertGridEligibilityForExistingRequest");
    expect(transitionRoute()).toContain("assertLegacyGridPaymentCondition");
    expect(transitionRoute()).toContain("assertGridReservationAvailable");
  });

  it("loads eligibility facts server-side and scopes existing requests by organization", () => {
    expect(service()).toContain("facilityPrivileges: true");
    expect(service()).toContain("credentials: true");
    expect(service()).toContain("destinationOrganizationId: session.organizationId");
    expect(service()).not.toContain("eligible:");
  });
});
