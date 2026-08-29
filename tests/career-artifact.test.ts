import { describe, expect, it } from "vitest";
import { buildCareerArtifactFromResume } from "@/lib/career/career-artifact";

describe("CareerArtifact resume convergence", () => {
  it("turns resume content into person-scoped evidence without granting professional authority", () => {
    const artifact = buildCareerArtifactFromResume({
      personId: "person_student_1",
      summary: "  Nursing student seeking a clinical role.  ",
      education: ["SUNY nursing program"],
      experience: ["Medical assistant externship"],
      skills: ["Vitals", "Patient intake"],
      goals: ["Graduate", "Find an RN role"],
    });

    expect(artifact.personId).toBe("person_student_1");
    expect(artifact.summary).toBe("Nursing student seeking a clinical role.");
    expect(artifact.claims.map(({ kind, value }) => ({ kind, value }))).toEqual([
      { kind: "education", value: "SUNY nursing program" },
      { kind: "experience", value: "Medical assistant externship" },
      { kind: "skill", value: "Vitals" },
      { kind: "skill", value: "Patient intake" },
      { kind: "goal", value: "Graduate" },
      { kind: "goal", value: "Find an RN role" },
    ]);
    expect(artifact.claims.every((claim) => claim.source === "resume")).toBe(true);
    expect(artifact.claims.every((claim) => claim.verificationState === "claimed")).toBe(true);
    expect(artifact.claims.every((claim) => claim.grantsAuthority === false)).toBe(true);
    expect(artifact.inferredAuthority).toEqual({ professional: false, clinical: false });
  });
});
