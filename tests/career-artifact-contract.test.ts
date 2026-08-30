import { describe, expect, it } from "vitest";
import {
  createCareerArtifactVersion,
  projectCareerArtifactForMatching,
  projectPublicCareerProfile,
  type CareerArtifact,
} from "@/lib/identity/career-artifact";

const baseArtifact: CareerArtifact = {
  id: "career_1",
  personId: "person_1",
  artifactType: "resume",
  sourceType: "uploaded_document",
  sourceReference: "doc_private_resume_1",
  version: 1,
  status: "active",
  supersedesArtifactId: null,
  claimState: "claimed",
  educationClaims: [
    {
      id: "edu_1",
      school: "Example School",
      program: "Nursing",
      completionState: "claimed",
      evidenceReference: null,
      evidenceVerificationState: "unverified",
    },
  ],
  experienceClaims: [
    {
      id: "exp_1",
      employer: "Example Clinic",
      title: "Medical Assistant",
      startDate: "2024-01",
      endDate: "2025-01",
      description: "Supported patient intake.",
      completionState: "claimed",
      evidenceReference: null,
      evidenceVerificationState: "unverified",
    },
  ],
  skillClaims: [
    {
      id: "skill_1",
      name: "patient intake",
      completionState: "claimed",
      evidenceReference: null,
      evidenceVerificationState: "unverified",
    },
  ],
  careerGoals: ["registered nurse"],
  roleInterests: ["rn", "clinical placement"],
  locationPreferences: ["New York, NY"],
  availabilityPreferences: ["weekdays"],
  parserProvenance: {
    assisted: true,
    provider: "openai",
    model: "example-model",
    runReference: "ai_run_1",
    confidence: 0.91,
  },
  humanConfirmedAt: null,
  createdAt: new Date("2026-08-30T00:00:00.000Z"),
  updatedAt: new Date("2026-08-30T00:00:00.000Z"),
  effectiveFrom: new Date("2026-08-30T00:00:00.000Z"),
  effectiveTo: null,
};

describe("CareerArtifact contract", () => {
  it("keeps one Person stable while preserving historical versions instead of overwriting claims", () => {
    const next = createCareerArtifactVersion(baseArtifact, {
      id: "career_2",
      createdAt: new Date("2026-08-31T00:00:00.000Z"),
      updatedAt: new Date("2026-08-31T00:00:00.000Z"),
      roleInterests: ["rn", "emergency nursing"],
    });

    expect(next.personId).toBe("person_1");
    expect(next.version).toBe(2);
    expect(next.supersedesArtifactId).toBe("career_1");
    expect(next.roleInterests).toEqual(["rn", "emergency nursing"]);
    expect(baseArtifact.version).toBe(1);
    expect(baseArtifact.roleInterests).toEqual(["rn", "clinical placement"]);
  });

  it("keeps parsed resume facts as claims even when evidence references exist", () => {
    const artifact: CareerArtifact = {
      ...baseArtifact,
      educationClaims: [
        {
          ...baseArtifact.educationClaims[0],
          evidenceReference: "edu_evidence_1",
          evidenceVerificationState: "verified",
        },
      ],
    };

    expect(artifact.claimState).toBe("claimed");
    expect(artifact.educationClaims[0].completionState).toBe("claimed");
    expect(artifact.educationClaims[0].evidenceVerificationState).toBe("verified");
  });

  it("persists AI provenance without allowing AI to manufacture authority", () => {
    expect(baseArtifact.parserProvenance).toMatchObject({
      assisted: true,
      provider: "openai",
      runReference: "ai_run_1",
    });

    const matching = projectCareerArtifactForMatching(baseArtifact);
    expect(matching.inferredAuthority).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
      placementApproval: false,
    });
    expect(matching.professionalEligibilitySatisfied).toBe(false);
  });

  it("keeps raw/private resume data out of public projection by default", () => {
    expect(projectPublicCareerProfile(baseArtifact)).toBeNull();
  });

  it("creates safe tagged inputs for EDU, placement discovery, and Grid matching without satisfying eligibility", () => {
    const matching = projectCareerArtifactForMatching(baseArtifact);

    expect(matching.personId).toBe("person_1");
    expect(matching.skillClaims).toEqual([
      { name: "patient intake", claimState: "claimed", evidenceVerificationState: "unverified" },
    ]);
    expect(matching.roleInterests).toContain("clinical placement");
    expect(matching.sourceReference).toBeUndefined();
    expect(matching.professionalEligibilitySatisfied).toBe(false);
  });

  it("preserves conflicting historical claims for review instead of silently erasing them", () => {
    const next = createCareerArtifactVersion(baseArtifact, {
      id: "career_2",
      createdAt: new Date("2026-08-31T00:00:00.000Z"),
      updatedAt: new Date("2026-08-31T00:00:00.000Z"),
      experienceClaims: [
        {
          ...baseArtifact.experienceClaims[0],
          title: "Senior Medical Assistant",
        },
      ],
    });

    expect(baseArtifact.experienceClaims[0].title).toBe("Medical Assistant");
    expect(next.experienceClaims[0].title).toBe("Senior Medical Assistant");
    expect(next.supersedesArtifactId).toBe(baseArtifact.id);
  });
});
