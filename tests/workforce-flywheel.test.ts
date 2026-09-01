import { describe, expect, it } from "vitest";
import type { GridCompositionComponent } from "@/lib/grid/composition-engine";
import type { GridEligibilityDecision } from "@/lib/grid/eligibility";
import type { PersonIdentity, PersonRelationship } from "@/lib/identity/person-context";
import {
  createResumeCareerArtifact,
  evaluatePaidGridWorkProgress,
  evaluatePlacementProgress,
  evaluateProfessionalWorkTransition,
} from "@/lib/workforce/workforce-flywheel";

const at = new Date("2026-08-30T08:00:00.000Z");

function placementComponents(): GridCompositionComponent[] {
  return [
    {
      slotKey: "student",
      resourceId: "person_student",
      resourceKind: "person",
      participantId: "person_student",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["active education enrollment"],
    },
    {
      slotKey: "school",
      resourceId: "school_1",
      resourceKind: "organization",
      organizationId: "school_1",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["school relationship active"],
    },
    {
      slotKey: "preceptor",
      resourceId: "provider_preceptor",
      resourceKind: "professional",
      participantId: "person_preceptor",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["preceptor eligibility verified"],
    },
    {
      slotKey: "site",
      resourceId: "location_1",
      resourceKind: "location",
      organizationId: "clinic_1",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["clinical site approved"],
    },
    {
      slotKey: "time",
      resourceId: "window_1",
      resourceKind: "time_window",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["placement capacity available"],
    },
  ];
}

const person: PersonIdentity = {
  id: "person_student",
  displayName: "Jordan Lee",
  status: "active",
};

const professionalRelationship: PersonRelationship = {
  id: "rel_professional",
  personId: person.id,
  relationshipType: "professional",
  organizationId: "clinic_1",
  status: "active",
  verificationState: "verified",
  effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
  effectiveTo: null,
};

const eligibleDecision: GridEligibilityDecision = {
  eligible: true,
  basis: {
    activity: "perform_rn_service",
    jurisdiction: "NY",
    credentialType: "RN",
    credentialExpiresAt: new Date("2027-08-01T00:00:00.000Z"),
    facilityId: "facility_1",
    evaluatedAt: at,
    evaluatedThrough: new Date("2026-08-30T16:00:00.000Z"),
  },
};

describe("Klinikos workforce flywheel", () => {
  it("turns a resume into claimed career evidence without creating authority", () => {
    const artifact = createResumeCareerArtifact({
      personId: person.id,
      sourceId: "resume_1",
      education: ["Nursing program — expected graduation 2026"],
      experience: ["Clinical rotation — 120 hours"],
      skills: ["patient communication", "vital signs"],
      goals: ["registered nurse role"],
    });

    expect(artifact).toMatchObject({
      personId: person.id,
      sourceType: "resume",
      sourceId: "resume_1",
      verificationState: "claimed",
      grantsAuthority: false,
    });
    expect(artifact.claims.skills).toEqual(["patient communication", "vital signs"]);
    expect(artifact.claims.education).toHaveLength(1);
  });

  it("keeps placement discovery/matching separate from school, site, and preceptor approval", () => {
    const matched = evaluatePlacementProgress({
      components: placementComponents(),
      approvals: { school: false, site: false, preceptor: false },
      requiredHours: 120,
      completedHours: 0,
      humanEvaluationRecorded: false,
    });

    expect(matched.compositionReady).toBe(true);
    expect(matched.approved).toBe(false);
    expect(matched.completed).toBe(false);
    expect(matched.professionalAuthorityGranted).toBe(false);
    expect(matched.blockers).toEqual(expect.arrayContaining([
      "school_approval_required",
      "site_approval_required",
      "preceptor_approval_required",
    ]));
  });

  it("requires approved placement, required hours, and human evaluation for placement completion but still does not create a license", () => {
    const placement = evaluatePlacementProgress({
      components: placementComponents(),
      approvals: { school: true, site: true, preceptor: true },
      requiredHours: 120,
      completedHours: 120,
      humanEvaluationRecorded: true,
    });

    expect(placement.approved).toBe(true);
    expect(placement.completed).toBe(true);
    expect(placement.professionalAuthorityGranted).toBe(false);
    expect(placement.requiresExternalProfessionalVerification).toBe(true);
  });

  it("allows Grid professional supply only after a verified professional relationship and deterministic eligibility decision", () => {
    const placement = evaluatePlacementProgress({
      components: placementComponents(),
      approvals: { school: true, site: true, preceptor: true },
      requiredHours: 120,
      completedHours: 120,
      humanEvaluationRecorded: true,
    });

    const ready = evaluateProfessionalWorkTransition({
      person,
      professionalRelationship,
      eligibility: eligibleDecision,
      placement,
      publicFields: { displayName: "Jordan Lee", headline: "Registered nurse" },
    });

    expect(ready.placementCompleted).toBe(true);
    expect(ready.professionalVerified).toBe(true);
    expect(ready.gridEligible).toBe(true);
    expect(ready.publicProfessionalProfile).toEqual({
      personId: person.id,
      displayName: "Jordan Lee",
      headline: "Registered nurse",
      relationshipId: professionalRelationship.id,
    });
  });

  it("refuses paid Grid work when professional eligibility is missing even if placement is complete", () => {
    const placement = evaluatePlacementProgress({
      components: placementComponents(),
      approvals: { school: true, site: true, preceptor: true },
      requiredHours: 120,
      completedHours: 120,
      humanEvaluationRecorded: true,
    });

    const notEligible: GridEligibilityDecision = {
      eligible: false,
      failures: [{ code: "credential_unverified", detail: "RN credential is not verified." }],
    };

    const transition = evaluateProfessionalWorkTransition({
      person,
      professionalRelationship,
      eligibility: notEligible,
      placement,
      publicFields: { displayName: "Jordan Lee", headline: "Registered nurse" },
    });

    expect(transition.gridEligible).toBe(false);
    expect(transition.publicProfessionalProfile).toBeNull();
  });

  it("creates no financial obligation at match, offer, or reservation; fulfilled work with evidence may enter Financial OS", () => {
    const preFulfillment = evaluatePaidGridWorkProgress({
      professionalReady: true,
      demandStatus: "reserved",
      offerStatus: "accepted",
      grossAmountCents: 60_000,
      fulfillmentEvidenceIds: [],
      financialObligationStatus: null,
    });

    expect(preFulfillment.financialObligationReady).toBe(false);
    expect(preFulfillment.nextFinancialAction).toBe("none");
    expect(preFulfillment.paymentGrantsAuthority).toBe(false);

    const fulfilled = evaluatePaidGridWorkProgress({
      professionalReady: true,
      demandStatus: "fulfilled",
      offerStatus: "accepted",
      grossAmountCents: 60_000,
      fulfillmentEvidenceIds: ["evidence_shift_completed"],
      financialObligationStatus: null,
    });

    expect(fulfilled.financialObligationReady).toBe(true);
    expect(fulfilled.nextFinancialAction).toBe("allocate_existing_grid_financial_obligations");
    expect(fulfilled.payoutReady).toBe(false);
  });

  it("keeps payout/settlement downstream from the obligation and never turns money into professional authority", () => {
    const payable = evaluatePaidGridWorkProgress({
      professionalReady: true,
      demandStatus: "fulfilled",
      offerStatus: "accepted",
      grossAmountCents: 60_000,
      fulfillmentEvidenceIds: ["evidence_shift_completed"],
      financialObligationStatus: "payable",
    });

    expect(payable.financialObligationReady).toBe(true);
    expect(payable.payoutReady).toBe(true);
    expect(payable.paymentGrantsAuthority).toBe(false);
  });
});
