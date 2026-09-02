import { describe, expect, it } from "vitest";
import {
  buildPersonWorkforceProjection,
  type PersonWorkforceProjectionInput,
} from "@/lib/workforce/person-workforce-projection";

const baseInput = (): PersonWorkforceProjectionInput => ({
  careerArtifact: {
    id: "career_1",
    personId: "person_1",
    artifactType: "resume",
    artifactVersion: 3,
    supersedesArtifactId: "career_0",
    sourceType: "resume_upload",
    sourceReference: "private://resume/person_1/source.pdf",
    sourceChecksumSha256: "a".repeat(64),
    claimState: "claimed",
    verificationState: "unverified",
    claims: {
      education: [{ school: "Example University", program: "Nursing" }],
      experience: [{ employer: "Example Clinic", role: "Assistant" }],
      skills: ["patient intake", "scheduling"],
      careerGoals: ["Registered nurse"],
      locationPreferences: ["New York"],
      availabilityPreferences: ["weekdays"],
    },
    parser: {
      provider: "structured-parser",
      model: "resume-v1",
      runId: "run_private",
      schemaVersion: 1,
      confidence: 0.92,
    },
    parsedAt: new Date("2026-08-30T12:00:00.000Z"),
    humanConfirmedAt: new Date("2026-08-31T12:00:00.000Z"),
    humanConfirmedBy: "person_1",
    createdAt: new Date("2026-08-30T12:00:00.000Z"),
    updatedAt: new Date("2026-08-31T12:00:00.000Z"),
    grantsAuthority: false,
  },
  relationships: [
    {
      id: "rel_edu",
      relationshipType: "learner",
      status: "active",
      verificationState: "verified",
      domainKind: "education_enrollment",
      domainRecordId: "enrollment_1",
    },
  ],
  accountEmailVerified: false,
  placement: {
    status: "active",
    approvals: {
      school: "approved",
      site: "approved",
      preceptor: "accepted",
      learner: "accepted",
    },
    requiredMinutes: 12_000,
    acceptedMinutes: 6_000,
    remainingMinutes: 6_000,
    hoursComplete: false,
  },
});

describe("Person workforce projection", () => {
  it("projects only browser-safe career claim state and never source/parser secrets", () => {
    const projection = buildPersonWorkforceProjection(baseInput());
    const serialized = JSON.stringify(projection);

    expect(projection.career).toEqual({
      state: "human_confirmed_claims",
      artifactVersion: 3,
      educationClaimCount: 1,
      experienceClaimCount: 1,
      skillClaimCount: 2,
      careerGoals: ["Registered nurse"],
      grantsAuthority: false,
    });
    expect(serialized).not.toContain("sourceReference");
    expect(serialized).not.toContain("sourceChecksumSha256");
    expect(serialized).not.toContain("private://resume");
    expect(serialized).not.toContain("run_private");
  });

  it("keeps human-confirmed resume claims separate from professional verification", () => {
    const projection = buildPersonWorkforceProjection(baseInput());

    expect(projection.professional).toEqual({
      relationshipState: "not_verified",
      professionalAuthorityEstablished: false,
      concreteEligibilityRequiredForMatch: true,
    });
    expect(projection.work.canMatch).toBe(false);
  });

  it("preserves placement approvals, hour progress, and authority boundaries as distinct state", () => {
    const projection = buildPersonWorkforceProjection(baseInput());

    expect(projection.placement).toMatchObject({
      state: "active",
      approvals: {
        school: "approved",
        site: "approved",
        preceptor: "accepted",
        learner: "accepted",
      },
      requiredMinutes: 12_000,
      acceptedMinutes: 6_000,
      remainingMinutes: 6_000,
      hoursComplete: false,
      grantsProfessionalAuthority: false,
      grantsClinicalAuthority: false,
      grantsLicensure: false,
    });
    expect(projection.nextAction.pathId).toBe("student-clinical-placement");
  });

  it("still requires external professional verification after placement hours are complete", () => {
    const input = baseInput();
    input.placement = {
      ...input.placement!,
      status: "completed",
      acceptedMinutes: 12_000,
      remainingMinutes: 0,
      hoursComplete: true,
    };

    const projection = buildPersonWorkforceProjection(input);

    expect(projection.placement?.hoursComplete).toBe(true);
    expect(projection.professional.professionalAuthorityEstablished).toBe(false);
    expect(projection.work.state).toBe("professional_verification_required");
    expect(projection.work.canMatch).toBe(false);
    expect(projection.nextAction.pathId).toBe("become-grid-ready");
  });

  it("allows verified professional relationship evidence to unlock discovery, never match eligibility", () => {
    const input = baseInput();
    input.placement = null;
    input.relationships.push({
      id: "rel_professional",
      relationshipType: "professional",
      status: "active",
      verificationState: "verified",
      domainKind: "provider",
      domainRecordId: "provider_1",
    });

    const projection = buildPersonWorkforceProjection(input);

    expect(projection.professional.relationshipState).toBe("verified_relationship");
    expect(projection.professional.professionalAuthorityEstablished).toBe(false);
    expect(projection.work).toEqual({
      state: "grid_discovery_ready",
      canDiscover: true,
      canMatch: false,
      concreteEligibilityRequired: true,
    });
    expect(projection.nextAction.pathId).toBe("find-extra-work");
  });

  it("does not treat an authenticated but unverified email as an EDU relationship claim", () => {
    const input = baseInput();
    input.relationships = [];
    input.accountEmailVerified = false;

    const projection = buildPersonWorkforceProjection(input);

    expect(projection.education).toEqual({
      relationshipState: "not_linked",
      emailVerificationRequiredBeforeClaim: true,
      grantsAuthority: false,
    });
  });

  it("starts from career claims rather than pretending a missing resume/profile is work-ready", () => {
    const input = baseInput();
    input.careerArtifact = null;
    input.placement = null;
    input.relationships = [];

    const projection = buildPersonWorkforceProjection(input);

    expect(projection.career.state).toBe("missing");
    expect(projection.work.state).toBe("career_profile_needed");
    expect(projection.work.canMatch).toBe(false);
    expect(projection.nextAction.pathId).toBe("become-grid-ready");
  });
});
