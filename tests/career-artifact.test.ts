import { describe, expect, it } from "vitest";
import {
  buildPlacementDiscoveryProfile,
  createCareerArtifact,
  projectPublicCareerProfile,
  truthCheckCareerDraft,
  type CareerArtifactInput,
} from "@/lib/edu/career-artifact";

const baseInput: CareerArtifactInput = {
  artifactId: "career_1",
  personId: "person_1",
  source: {
    type: "resume",
    reference: "private://resume/abc123",
    capturedAt: new Date("2026-08-31T10:00:00.000Z"),
    version: 1,
  },
  education: [
    {
      id: "edu_claim_1",
      school: "Example Nursing School",
      program: "Nursing",
      graduationDate: "2027-05",
      verificationState: "claimed",
    },
  ],
  experience: [
    {
      id: "exp_claim_1",
      organization: "Example Clinic",
      title: "Medical Assistant",
      startDate: "2025-01",
      endDate: null,
      summary: "Supported intake and front-desk workflow.",
      verificationState: "claimed",
    },
  ],
  skills: [
    { id: "skill_1", label: "patient intake", verificationState: "claimed" },
    { id: "skill_2", label: "scheduling", verificationState: "claimed" },
  ],
  preferences: {
    roleInterests: ["registered_nurse"],
    locationText: "Brooklyn, NY",
    availabilityText: "Weekdays after 3 PM",
  },
  privateNotes: "Private source note that must never appear publicly.",
};

describe("CareerArtifact", () => {
  it("treats every resume claim as evidence and never as authority", () => {
    const artifact = createCareerArtifact(baseInput);

    expect(artifact.authorityEffect).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
    });
    expect(artifact.education[0]?.verificationState).toBe("claimed");
    expect(artifact.experience[0]?.verificationState).toBe("claimed");
    expect(artifact.skills[0]?.verificationState).toBe("claimed");
  });

  it("does not invent omitted resume fields", () => {
    const artifact = createCareerArtifact({
      ...baseInput,
      education: [],
      experience: [],
      skills: [],
      preferences: {},
      privateNotes: undefined,
    });

    expect(artifact.education).toEqual([]);
    expect(artifact.experience).toEqual([]);
    expect(artifact.skills).toEqual([]);
    expect(artifact.preferences).toEqual({});
    expect(artifact.privateNotes).toBeUndefined();
  });

  it("rejects unsupported AI-added facts instead of silently adding them", () => {
    const review = truthCheckCareerDraft({
      sourceFacts: [
        "Medical Assistant at Example Clinic",
        "Supported intake and front-desk workflow",
      ],
      proposedClaims: [
        "Medical Assistant at Example Clinic",
        "Managed a team of 12 nurses",
        "Increased revenue by 40 percent",
      ],
    });

    expect(review.acceptedClaims).toEqual(["Medical Assistant at Example Clinic"]);
    expect(review.unsupportedClaims).toEqual([
      "Managed a team of 12 nurses",
      "Increased revenue by 40 percent",
    ]);
    expect(review.safeToPublish).toBe(false);
  });

  it("keeps later artifact versions separate instead of overwriting source provenance", () => {
    const version1 = createCareerArtifact(baseInput);
    const version2 = createCareerArtifact({
      ...baseInput,
      artifactId: "career_2",
      source: {
        ...baseInput.source,
        reference: "private://resume/def456",
        capturedAt: new Date("2026-09-15T10:00:00.000Z"),
        version: 2,
      },
    });

    expect(version1.artifactId).toBe("career_1");
    expect(version1.source.version).toBe(1);
    expect(version1.source.reference).toBe("private://resume/abc123");
    expect(version2.artifactId).toBe("career_2");
    expect(version2.source.version).toBe(2);
    expect(version2.source.reference).toBe("private://resume/def456");
  });

  it("creates a privacy-safe public projection without private source references or notes", () => {
    const artifact = createCareerArtifact(baseInput);
    const projection = projectPublicCareerProfile(artifact);

    expect(projection).toEqual({
      personId: "person_1",
      roleInterests: ["registered_nurse"],
      skills: ["patient intake", "scheduling"],
      locationText: "Brooklyn, NY",
    });
    expect(JSON.stringify(projection)).not.toContain("private://");
    expect(JSON.stringify(projection)).not.toContain("Private source note");
    expect(JSON.stringify(projection)).not.toContain("Example Clinic");
  });

  it("allows verified EDU evidence to be attached without turning it into a license", () => {
    const artifact = createCareerArtifact({
      ...baseInput,
      eduEvidence: [
        {
          id: "edu_ev_1",
          kind: "competency",
          label: "Patient intake competency",
          verificationState: "verified",
        },
      ],
    });

    expect(artifact.eduEvidence[0]?.verificationState).toBe("verified");
    expect(artifact.authorityEffect.professional).toBe(false);
    expect(artifact.authorityEffect.clinical).toBe(false);
  });

  it("feeds placement discovery preferences but can never mark clinical eligibility verified", () => {
    const artifact = createCareerArtifact(baseInput);
    const placement = buildPlacementDiscoveryProfile(artifact, {
      demonstratedCompetencies: ["patient intake"],
    });

    expect(placement.personId).toBe("person_1");
    expect(placement.roleInterests).toEqual(["registered_nurse"]);
    expect(placement.locationText).toBe("Brooklyn, NY");
    expect(placement.demonstratedCompetencies).toEqual(["patient intake"]);
    expect(placement.requiresClinicalEligibility).toBe(true);
    expect(placement.eligibilityVerified).toBe(false);
    expect(placement.schoolApprovalVerified).toBe(false);
    expect(placement.siteApprovalVerified).toBe(false);
    expect(placement.preceptorApprovalVerified).toBe(false);
  });
});
