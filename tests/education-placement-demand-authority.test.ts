import { describe, expect, it } from "vitest";
import { buildClinicalPlacementDemand } from "@/lib/education/placement-demand";

describe("EDU placement demand authority boundary", () => {
  it("never authorizes assignment from demand-adapter approval hints", () => {
    const placement = buildClinicalPlacementDemand({
      personId: "person_student_1",
      programName: "SUNY Nursing",
      requiredHours: 120,
      learnerEligibility: {
        relationshipVerified: true,
        prerequisitesComplete: true,
      },
      approvals: {
        school: true,
        site: true,
        preceptor: true,
      },
    });

    expect(placement.gate.canMatch).toBe(true);
    expect(placement.gate.canAssign).toBe(false);
    expect(placement.gate.assignmentAuthority).toBe("persisted_clinical_placement");
    expect(placement.grantsAuthority).toBe(false);
  });
});
