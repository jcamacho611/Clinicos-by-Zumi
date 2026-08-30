import { describe, expect, it } from "vitest";
import { buildCareerWorkDemand } from "@/lib/career/work-demand";

describe("career intent to Grid work demand", () => {
  it("creates existing Grid work demand without treating career claims as professional eligibility", () => {
    const result = buildCareerWorkDemand({
      personId: "person_student_1",
      desiredRole: "  Registered Nurse  ",
      preferredSpecialties: [" primary care ", "behavioral health", ""],
      city: " New York ",
      state: " NY ",
    });

    expect(result.personId).toBe("person_student_1");
    expect(result.demand.kind).toBe("work");
    expect(result.demand.category).toBe("healthcare-work");
    expect(result.demand.title).toBe("Work wanted: Registered Nurse");
    expect(result.demand.city).toBe("New York");
    expect(result.demand.state).toBe("NY");
    expect(result.demand.requiresClinicalEligibility).toBe(true);
    expect(result.demand.requirements).toEqual([
      "role:Registered Nurse",
      "specialty:primary care",
      "specialty:behavioral health",
    ]);

    expect(result.gate).toEqual({
      canMatch: false,
      reason: "opportunity_eligibility_required",
    });
    expect(result.grantsAuthority).toBe(false);
  });

  it("refuses to invent a work demand without a person and explicit desired role", () => {
    expect(() =>
      buildCareerWorkDemand({
        personId: "",
        desiredRole: "Registered Nurse",
      }),
    ).toThrow("personId is required");

    expect(() =>
      buildCareerWorkDemand({
        personId: "person_student_1",
        desiredRole: "   ",
      }),
    ).toThrow("desiredRole is required");
  });
});
