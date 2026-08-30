import { describe, expect, it } from "vitest";
import {
  buildCareerArtifact,
  deriveCareerGridSignals,
  type CareerArtifactInput,
} from "@/lib/career/career-artifact";

const resumeInput: CareerArtifactInput = {
  subjectPersonId: "person_1",
  source: {
    kind: "resume",
    label: "Jordan Lee resume",
    capturedAt: new Date("2026-08-30T09:00:00.000Z"),
  },
  claims: [
    {
      kind: "education",
      label: "Nursing program",
      value: "Associate degree nursing program",
      sourceText: "Associate degree nursing program — expected graduation May 2027",
    },
    {
      kind: "experience",
      label: "Clinical experience",
      value: "Student clinical rotations",
      sourceText: "Completed supervised student clinical rotations",
    },
    {
      kind: "skill",
      label: "Vital signs",
      value: "Vital signs",
      sourceText: "Vital signs",
    },
    {
      kind: "career_goal",
      label: "Career goal",
      value: "Registered nurse role after graduation",
      sourceText: "Seeking an RN role after graduation",
    },
    {
      kind: "professional_credential",
      label: "RN license",
      value: "New York RN license",
      sourceText: "RN license pending",
    },
  ],
};

describe("CareerArtifact truth contract", () => {
  it("turns resume content into claimed evidence without granting authority", () => {
    const artifact = buildCareerArtifact(resumeInput);

    expect(artifact.subjectPersonId).toBe("person_1");
    expect(artifact.source.kind).toBe("resume");
    expect(artifact.claims).toHaveLength(5);
    expect(artifact.claims.every((claim) => claim.verificationState === "claimed")).toBe(true);
    expect(artifact.claims.every((claim) => claim.grantsAuthority === false)).toBe(true);
  });

  it("does not turn a resume credential claim into a verified license", () => {
    const artifact = buildCareerArtifact(resumeInput);
    const licenseClaim = artifact.claims.find((claim) => claim.kind === "professional_credential");

    expect(licenseClaim).toMatchObject({
      value: "New York RN license",
      verificationState: "claimed",
      grantsAuthority: false,
    });
    expect(artifact.authority).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      placementApproval: false,
      employmentEligibility: false,
    });
  });

  it("preserves source text so every structured claim can be checked", () => {
    const artifact = buildCareerArtifact(resumeInput);

    for (const claim of artifact.claims) {
      expect(claim.sourceText.trim().length).toBeGreaterThan(0);
    }
  });

  it("rejects unsupported claims instead of silently inventing missing resume facts", () => {
    expect(() =>
      buildCareerArtifact({
        ...resumeInput,
        claims: [
          {
            kind: "experience",
            label: "ICU manager",
            value: "Managed an ICU for five years",
            sourceText: "",
          },
        ],
      }),
    ).toThrow(/source/i);
  });

  it("derives I HAVE / I NEED Grid signals as claims, not eligibility", () => {
    const signals = deriveCareerGridSignals(buildCareerArtifact(resumeInput));

    expect(signals.have).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "education", verificationState: "claimed", eligibleForRegulatedWork: false }),
        expect.objectContaining({ kind: "skill", verificationState: "claimed", eligibleForRegulatedWork: false }),
      ]),
    );
    expect(signals.need).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "career_goal", verificationState: "claimed" }),
      ]),
    );
    expect(signals.boundary).toMatch(/does not establish/i);
  });
});
