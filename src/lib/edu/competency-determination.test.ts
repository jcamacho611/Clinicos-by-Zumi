import { describe, expect, it } from "vitest";
import { competencyAdvancesReadiness, competencyAreaAllowed, competencyDeterminationSchema } from "@/lib/edu/competency-determination";

describe("EDU competency determination", () => {
  it("accepts only explicit human-facing determination states", () => {
    expect(competencyDeterminationSchema.parse({
      competencyArea: "care_coordination",
      determination: "demonstrated",
      evidenceSummary: "Instructor reviewed the released rubric evidence.",
    }).determination).toBe("demonstrated");
    expect(() => competencyDeterminationSchema.parse({
      competencyArea: "care_coordination",
      determination: "ai_confident",
      evidenceSummary: "Model score",
    })).toThrow();
  });

  it("only allows competency areas present in the assessed rubric", () => {
    expect(competencyAreaAllowed({
      competencyArea: "care_coordination",
      rubricAreas: ["care_coordination", "privacy_operations", null],
    })).toBe(true);
    expect(competencyAreaAllowed({
      competencyArea: "prescribing",
      rubricAreas: ["care_coordination", "privacy_operations"],
    })).toBe(false);
  });

  it("advances readiness only for demonstrated competency", () => {
    expect(competencyAdvancesReadiness("demonstrated")).toBe(true);
    expect(competencyAdvancesReadiness("needs_development")).toBe(false);
  });
});
