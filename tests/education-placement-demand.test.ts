import { describe, expect, it } from "vitest";
import { buildClinicalPlacementDemand } from "@/lib/education/placement-demand";

describe("EDU clinical placement convergence", () => {
  it("routes a verified learner need into Grid without treating a match as placement approval", () => {
    const placement = buildClinicalPlacementDemand({
      personId: "person_student_1",
      programName: "SUNY Nursing",
      requiredHours: 120,
      preferredSpecialties: ["primary care", "behavioral health"],
      city: "New York",
      state: "NY",
      learnerEligibility: {
        relationshipVerified: true,
        prerequisitesComplete: true,
      },
      approvals: {
        school: false,
        site: false,
        preceptor: false,
      },
    });

    expect(placement.personId).toBe("person_student_1");
    expect(placement.demand.kind).toBe("education");
    expect(placement.demand.category).toBe("clinical-placement");
    expect(placement.demand.requiresClinicalEligibility).toBe(true);
    expect(placement.demand.requirements).toEqual(expect.arrayContaining([
      "program:SUNY Nursing",
      "required-hours:120",
      "specialty:primary care",
      "specialty:behavioral health",
    ]));
    expect(placement.gate.canMatch).toBe(true);
    expect(placement.gate.canAssign).toBe(false);
    expect(placement.gate.missingApprovals).toEqual(["school", "site", "preceptor"]);
  });

  it("keeps discovery closed when learner relationship or prerequisites are not ready", () => {
    const placement = buildClinicalPlacementDemand({
      personId: "person_student_1",
      programName: "SUNY Nursing",
      requiredHours: 120,
      learnerEligibility: {
        relationshipVerified: false,
        prerequisitesComplete: true,
      },
      approvals: {
        school: true,
        site: true,
        preceptor: true,
      },
    });

    expect(placement.gate.canMatch).toBe(false);
    expect(placement.gate.canAssign).toBe(false);
  });
});
