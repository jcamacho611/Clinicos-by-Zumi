import { describe, expect, it } from "vitest";
import { gridCompositionTemplates } from "@/lib/grid/composition-engine";
import {
  deriveApprovedPlacementMinutes,
  evaluatePlacementReadiness,
  transitionPlacementStatus,
  type PlacementApprovalState,
  type PlacementHourEvent,
} from "@/lib/edu/clinical-placement-lifecycle";

const noApprovals: PlacementApprovalState = {
  school: "pending",
  site: "pending",
  preceptor: "pending",
  learner: "pending",
};

const allAccepted: PlacementApprovalState = {
  school: "approved",
  site: "approved",
  preceptor: "accepted",
  learner: "accepted",
};

function completeComposition(overrides?: Partial<Record<"student" | "school" | "preceptor" | "site" | "time", boolean>>) {
  const verified = {
    student: true,
    school: true,
    preceptor: true,
    site: true,
    time: true,
    ...overrides,
  };

  return [
    {
      slotKey: "student",
      resourceId: "person_learner",
      resourceKind: "person",
      participantId: "person_learner",
      eligibilityVerified: verified.student,
      authorizationVerified: verified.student,
      availabilityVerified: verified.student,
      evidence: ["person relationship exists"],
    },
    {
      slotKey: "school",
      resourceId: "org_school",
      resourceKind: "organization",
      organizationId: "org_school",
      eligibilityVerified: verified.school,
      authorizationVerified: verified.school,
      availabilityVerified: verified.school,
      evidence: ["education enrollment context"],
    },
    {
      slotKey: "preceptor",
      resourceId: "person_preceptor",
      resourceKind: "professional",
      participantId: "person_preceptor",
      eligibilityVerified: verified.preceptor,
      authorizationVerified: verified.preceptor,
      availabilityVerified: verified.preceptor,
      evidence: ["preceptor eligibility checked separately"],
    },
    {
      slotKey: "site",
      resourceId: "location_site",
      resourceKind: "location",
      organizationId: "org_site",
      eligibilityVerified: verified.site,
      authorizationVerified: verified.site,
      availabilityVerified: verified.site,
      evidence: ["site approval context"],
    },
    {
      slotKey: "time",
      resourceId: "capacity_window",
      resourceKind: "time_window",
      eligibilityVerified: verified.time,
      authorizationVerified: verified.time,
      availabilityVerified: verified.time,
      evidence: ["placement capacity window"],
    },
  ];
}

describe("governed clinical placement lifecycle", () => {
  it("reuses the existing Grid clinicalPlacement composition rather than a new matching engine", () => {
    expect(gridCompositionTemplates.clinicalPlacement.key).toBe("clinical_placement");
    expect(gridCompositionTemplates.clinicalPlacement.slots.map(({ key }) => key)).toEqual([
      "student",
      "school",
      "preceptor",
      "site",
      "time",
    ]);
  });

  it("keeps structural completeness separate from eligibility, authorization, and availability", () => {
    const result = evaluatePlacementReadiness({
      components: completeComposition({ preceptor: false }),
      approvals: allAccepted,
    });

    expect(result.compositionComplete).toBe(true);
    expect(result.compositionReadyForOffer).toBe(false);
    expect(result.approvalsComplete).toBe(true);
    expect(result.readyToStart).toBe(false);
    expect(result.blockers).toContain("preceptor_eligibility_or_authority_unverified");
  });

  it("requires school, site, preceptor, and learner approvals independently", () => {
    const schoolOnly = evaluatePlacementReadiness({
      components: completeComposition(),
      approvals: { ...noApprovals, school: "approved" },
    });

    expect(schoolOnly.compositionReadyForOffer).toBe(true);
    expect(schoolOnly.approvalsComplete).toBe(false);
    expect(schoolOnly.readyToStart).toBe(false);
    expect(schoolOnly.approvalBlockers).toEqual([
      "site_approval_pending",
      "preceptor_acceptance_pending",
      "learner_acceptance_pending",
    ]);
  });

  it("allows a placement to start only after composition verification and every required approval", () => {
    const result = evaluatePlacementReadiness({
      components: completeComposition(),
      approvals: allAccepted,
    });

    expect(result.compositionReadyForOffer).toBe(true);
    expect(result.approvalsComplete).toBe(true);
    expect(result.readyToStart).toBe(true);
  });

  it("rejects lifecycle jumps that collapse match, approval, start, hours, completion, and licensure into one state", () => {
    expect(() => transitionPlacementStatus("matched", "completed")).toThrow(/invalid placement transition/i);
    expect(transitionPlacementStatus("matched", "awaiting_approvals")).toBe("awaiting_approvals");
    expect(transitionPlacementStatus("awaiting_approvals", "approved")).toBe("approved");
    expect(transitionPlacementStatus("approved", "active")).toBe("active");
    expect(transitionPlacementStatus("active", "completed")).toBe("completed");
  });

  it("never turns placement completion into professional or clinical authority", () => {
    const result = evaluatePlacementReadiness({
      components: completeComposition(),
      approvals: allAccepted,
    });

    expect(result.grantsProfessionalAuthority).toBe(false);
    expect(result.grantsClinicalAuthority).toBe(false);
    expect(result.grantsLicensure).toBe(false);
  });

  it("derives approved clinical time from append-only events and preserves correction history", () => {
    const events: PlacementHourEvent[] = [
      {
        id: "hours_original",
        placementId: "placement_1",
        minutes: 120,
        status: "approved",
        occurredAt: new Date("2026-08-01T09:00:00.000Z"),
        reportedBy: "person_learner",
        reviewedBy: "person_preceptor",
        supersedesEventId: null,
      },
      {
        id: "hours_correction",
        placementId: "placement_1",
        minutes: 90,
        status: "approved",
        occurredAt: new Date("2026-08-01T09:00:00.000Z"),
        reportedBy: "person_preceptor",
        reviewedBy: "person_preceptor",
        supersedesEventId: "hours_original",
      },
      {
        id: "hours_rejected",
        placementId: "placement_1",
        minutes: 60,
        status: "rejected",
        occurredAt: new Date("2026-08-02T09:00:00.000Z"),
        reportedBy: "person_learner",
        reviewedBy: "person_preceptor",
        supersedesEventId: null,
      },
      {
        id: "hours_pending",
        placementId: "placement_1",
        minutes: 30,
        status: "reported",
        occurredAt: new Date("2026-08-03T09:00:00.000Z"),
        reportedBy: "person_learner",
        reviewedBy: null,
        supersedesEventId: null,
      },
    ];

    const result = deriveApprovedPlacementMinutes(events);

    expect(result.approvedMinutes).toBe(90);
    expect(result.countedEventIds).toEqual(["hours_correction"]);
    expect(result.supersededEventIds).toEqual(["hours_original"]);
    expect(result.rejectedEventIds).toEqual(["hours_rejected"]);
    expect(result.pendingEventIds).toEqual(["hours_pending"]);
    expect(events).toHaveLength(4);
  });
});
