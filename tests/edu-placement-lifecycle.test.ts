import { describe, expect, it } from "vitest";
import {
  createPlacementLifecycle,
  recordPlacementApproval,
  transitionPlacement,
} from "@/lib/edu/placement-lifecycle";

const matchedPlacement = () =>
  createPlacementLifecycle({
    placementId: "placement_1",
    learnerPersonId: "person_learner",
    institutionId: "school_1",
    siteOrganizationId: "clinic_1",
    preceptorPersonId: "person_preceptor",
    gridCompositionKey: "composition_1",
    matchedAt: new Date("2026-08-30T10:00:00.000Z"),
  });

const approveAll = () => {
  let placement = matchedPlacement();
  for (const actor of ["learner", "school", "site", "preceptor"] as const) {
    placement = recordPlacementApproval(placement, {
      actor,
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:30:00.000Z"),
      evidenceRef: `${actor}_approval`,
    });
  }
  return placement;
};

describe("governed EDU placement lifecycle", () => {
  it("treats a Grid match as matched, not accepted, approved, or active", () => {
    const placement = matchedPlacement();

    expect(placement.status).toBe("matched");
    expect(placement.approvals).toEqual({
      learner: "pending",
      school: "pending",
      site: "pending",
      preceptor: "pending",
    });
    expect(placement.authority).toEqual({
      mayStartPlacement: false,
      clinicalAuthority: false,
      professionalAuthority: false,
    });
  });

  it("keeps learner acceptance distinct from school, site, and preceptor approval", () => {
    let placement = matchedPlacement();
    for (const actor of ["school", "site", "preceptor"] as const) {
      placement = recordPlacementApproval(placement, {
        actor,
        decision: "approved",
        decidedAt: new Date("2026-08-30T10:30:00.000Z"),
        evidenceRef: `${actor}_approval`,
      });
    }

    expect(placement.approvals).toMatchObject({
      learner: "pending",
      school: "approved",
      site: "approved",
      preceptor: "approved",
    });
    expect(placement.status).toBe("approval_pending");
    expect(placement.authority.mayStartPlacement).toBe(false);

    placement = recordPlacementApproval(placement, {
      actor: "learner",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:40:00.000Z"),
      evidenceRef: "learner_acceptance_1",
    });

    expect(placement.status).toBe("approved");
    expect(placement.authority.mayStartPlacement).toBe(true);
  });

  it("requires learner, school, site, and preceptor approvals before becoming approved", () => {
    let placement = matchedPlacement();
    placement = recordPlacementApproval(placement, {
      actor: "learner",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:05:00.000Z"),
      evidenceRef: "learner_acceptance_1",
    });
    placement = recordPlacementApproval(placement, {
      actor: "school",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:10:00.000Z"),
      evidenceRef: "school_approval_1",
    });
    placement = recordPlacementApproval(placement, {
      actor: "site",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:20:00.000Z"),
      evidenceRef: "site_approval_1",
    });

    expect(placement.status).toBe("approval_pending");
    expect(placement.authority.mayStartPlacement).toBe(false);

    placement = recordPlacementApproval(placement, {
      actor: "preceptor",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:30:00.000Z"),
      evidenceRef: "preceptor_approval_1",
    });

    expect(placement.status).toBe("approved");
    expect(placement.authority.mayStartPlacement).toBe(true);
    expect(placement.authority.clinicalAuthority).toBe(false);
    expect(placement.authority.professionalAuthority).toBe(false);
  });

  it("never allows a direct matched to active transition", () => {
    expect(() =>
      transitionPlacement(matchedPlacement(), {
        to: "active",
        at: new Date("2026-08-30T11:00:00.000Z"),
        evidenceRef: "start_1",
      }),
    ).toThrow(/approved/i);
  });

  it("requires explicit activation after all approvals", () => {
    let placement = approveAll();

    expect(placement.status).toBe("approved");

    placement = transitionPlacement(placement, {
      to: "active",
      at: new Date("2026-08-31T08:00:00.000Z"),
      evidenceRef: "placement_start_1",
    });

    expect(placement.status).toBe("active");
    expect(placement.timeline.at(-1)).toMatchObject({
      from: "approved",
      to: "active",
      evidenceRef: "placement_start_1",
    });
  });

  it("blocks activation when any required party rejects the placement", () => {
    let placement = matchedPlacement();
    placement = recordPlacementApproval(placement, {
      actor: "learner",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:05:00.000Z"),
      evidenceRef: "learner_acceptance",
    });
    placement = recordPlacementApproval(placement, {
      actor: "school",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:10:00.000Z"),
      evidenceRef: "school_approval",
    });
    placement = recordPlacementApproval(placement, {
      actor: "site",
      decision: "rejected",
      decidedAt: new Date("2026-08-30T10:20:00.000Z"),
      evidenceRef: "site_rejection",
    });

    expect(placement.status).toBe("rejected");
    expect(placement.authority.mayStartPlacement).toBe(false);
    expect(() =>
      transitionPlacement(placement, {
        to: "active",
        at: new Date("2026-08-31T08:00:00.000Z"),
        evidenceRef: "should_not_start",
      }),
    ).toThrow(/rejected|approved/i);
  });

  it("preserves acceptance, approval, and transition evidence instead of overwriting history", () => {
    let placement = matchedPlacement();
    placement = recordPlacementApproval(placement, {
      actor: "learner",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:05:00.000Z"),
      evidenceRef: "learner_evidence_v1",
    });
    placement = recordPlacementApproval(placement, {
      actor: "school",
      decision: "approved",
      decidedAt: new Date("2026-08-30T10:10:00.000Z"),
      evidenceRef: "school_evidence_v1",
    });

    expect(placement.approvalHistory).toEqual([
      expect.objectContaining({
        actor: "learner",
        decision: "approved",
        evidenceRef: "learner_evidence_v1",
      }),
      expect.objectContaining({
        actor: "school",
        decision: "approved",
        evidenceRef: "school_evidence_v1",
      }),
    ]);
    expect(placement.timeline[0]).toMatchObject({ from: "matched", to: "approval_pending" });
  });

  it("does not let placement completion create a professional license", () => {
    let placement = approveAll();
    placement = transitionPlacement(placement, {
      to: "active",
      at: new Date("2026-08-31T08:00:00.000Z"),
      evidenceRef: "placement_start",
    });
    placement = transitionPlacement(placement, {
      to: "completed",
      at: new Date("2026-12-01T17:00:00.000Z"),
      evidenceRef: "placement_completion",
    });

    expect(placement.status).toBe("completed");
    expect(placement.authority).toEqual({
      mayStartPlacement: false,
      clinicalAuthority: false,
      professionalAuthority: false,
    });
  });
});