import { describe, expect, it } from "vitest";
import {
  buildCareerMatchingProjection,
  careerArtifactSchema,
  careerArtifactSatisfiesClinicalEligibility,
} from "@/lib/career/career-artifact";

describe("CareerArtifact resume evidence", () => {
  const artifact = careerArtifactSchema.parse({
    id: "career_1",
    personId: "person_1",
    source: {
      kind: "resume_upload",
      label: "Jordan Lee resume",
      capturedAt: "2026-08-30T04:00:00.000Z",
    },
    privateContact: {
      email: "jordan@example.com",
      phone: "+1-555-0100",
      address: "Private address",
    },
    claims: [
      {
        id: "claim_school",
        kind: "education",
        label: "Example University — BS Nursing",
        verificationState: "claimed",
        details: { school: "Example University", program: "BS Nursing", graduationYear: 2027 },
      },
      {
        id: "claim_skill",
        kind: "skill",
        label: "Patient intake",
        verificationState: "claimed",
        details: { skill: "Patient intake" },
      },
      {
        id: "claim_experience",
        kind: "experience",
        label: "Clinical assistant",
        verificationState: "claimed",
        details: { role: "Clinical assistant", years: 1 },
      },
      {
        id: "claim_goal",
        kind: "goal",
        label: "Seeking supervised clinical placement",
        verificationState: "claimed",
        details: { goal: "clinical_placement" },
      },
    ],
  });

  it("treats resume data as evidence, never professional authority", () => {
    expect(artifact.authority).toEqual({
      grantsProfessionalAuthority: false,
      grantsClinicalAuthority: false,
      grantsBillingAuthority: false,
      grantsOrganizationAuthority: false,
    });
    expect(careerArtifactSatisfiesClinicalEligibility(artifact)).toBe(false);
  });

  it("keeps personal contact data out of the matching projection", () => {
    const projection = buildCareerMatchingProjection(artifact);

    expect(projection).toEqual({
      personId: "person_1",
      artifactId: "career_1",
      education: ["Example University — BS Nursing"],
      experience: ["Clinical assistant"],
      skills: ["Patient intake"],
      goals: ["Seeking supervised clinical placement"],
      verifiedClaimIds: [],
      claimedClaimIds: ["claim_school", "claim_skill", "claim_experience", "claim_goal"],
      grantsAuthority: false,
    });
    expect(JSON.stringify(projection)).not.toContain("jordan@example.com");
    expect(JSON.stringify(projection)).not.toContain("555-0100");
    expect(JSON.stringify(projection)).not.toContain("Private address");
  });

  it("still does not create clinical eligibility when a resume claim is externally marked verified", () => {
    const verified = careerArtifactSchema.parse({
      ...artifact,
      claims: artifact.claims.map((claim) =>
        claim.id === "claim_school"
          ? {
              ...claim,
              verificationState: "verified",
              verification: {
                source: "school_records",
                verifiedAt: "2026-08-30T04:10:00.000Z",
                verifiedBy: "reviewer_1",
              },
            }
          : claim,
      ),
    });

    const projection = buildCareerMatchingProjection(verified);
    expect(projection.verifiedClaimIds).toEqual(["claim_school"]);
    expect(projection.grantsAuthority).toBe(false);
    expect(careerArtifactSatisfiesClinicalEligibility(verified)).toBe(false);
  });

  it("rejects a claim that says verified without verification provenance", () => {
    expect(() =>
      careerArtifactSchema.parse({
        ...artifact,
        claims: [
          {
            id: "bad_claim",
            kind: "education",
            label: "Unproven school claim",
            verificationState: "verified",
            details: {},
          },
        ],
      }),
    ).toThrow();
  });
});
