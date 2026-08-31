import { describe, expect, it } from "vitest";
import { createCareerArtifact, type CareerArtifactInput } from "@/lib/edu/career-artifact";

describe("CareerArtifact resume verification boundary", () => {
  it("downgrades resume-supplied verified labels to claimed until separate evidence verifies them", () => {
    const input: CareerArtifactInput = {
      artifactId: "career_resume_truth",
      personId: "person_truth",
      source: {
        type: "resume",
        reference: "private://resume/truth",
        capturedAt: new Date("2026-08-31T10:00:00.000Z"),
        version: 1,
      },
      education: [
        {
          id: "edu_1",
          school: "Claimed School",
          program: "Nursing",
          verificationState: "verified",
        },
      ],
      experience: [
        {
          id: "exp_1",
          organization: "Claimed Employer",
          title: "Registered Nurse",
          verificationState: "verified",
        },
      ],
      skills: [
        {
          id: "skill_1",
          label: "aesthetic injection",
          verificationState: "verified",
        },
      ],
      preferences: {},
    };

    const artifact = createCareerArtifact(input);

    expect(artifact.education[0]?.verificationState).toBe("claimed");
    expect(artifact.experience[0]?.verificationState).toBe("claimed");
    expect(artifact.skills[0]?.verificationState).toBe("claimed");
    expect(artifact.authorityEffect).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
    });
  });
});
