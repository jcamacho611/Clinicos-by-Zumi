import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  confirmCareerArtifactClaims,
  createResumeCareerArtifact,
  listCareerArtifactVersions,
  toCareerMatchingInput,
} from "@/lib/career/career-artifact-repository";

const suffix = "career_artifact_20260830";
const personId = `person_${suffix}`;

beforeAll(async () => {
  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `jordan-${suffix}@example.test`,
    },
  });
});

afterAll(async () => {
  await db.person.deleteMany({ where: { id: personId } });
});

describe("CareerArtifact resume claims", () => {
  it("persists resume-derived education, experience, and skills as claims without creating authority", async () => {
    const artifact = await createResumeCareerArtifact({
      personId,
      sourceReference: `upload://${suffix}/resume-v1.pdf`,
      sourceChecksumSha256: "1".repeat(64),
      claims: {
        education: [{ school: "Example College", program: "Nursing", status: "in_progress" }],
        experience: [{ organization: "Example Practice", role: "Medical Assistant", years: 2 }],
        skills: ["patient intake", "vital signs"],
        careerGoals: ["registered nurse"],
        locationPreferences: ["New York"],
        availabilityPreferences: ["weekdays"],
      },
      parser: {
        provider: "openai",
        model: "career-parser-test",
        runId: `run_${suffix}_v1`,
        schemaVersion: 1,
        confidence: 0.91,
      },
    });

    expect(artifact.personId).toBe(personId);
    expect(artifact.artifactType).toBe("resume");
    expect(artifact.artifactVersion).toBe(1);
    expect(artifact.claimState).toBe("claimed");
    expect(artifact.verificationState).toBe("unverified");
    expect(artifact.grantsAuthority).toBe(false);
    expect(artifact.claims.skills).toEqual(["patient intake", "vital signs"]);
    expect(artifact.parser?.runId).toBe(`run_${suffix}_v1`);
  });

  it("creates a new version without overwriting the prior resume claims or provenance", async () => {
    const first = (await listCareerArtifactVersions(personId))[0];

    const second = await createResumeCareerArtifact({
      personId,
      supersedesArtifactId: first.id,
      sourceReference: `upload://${suffix}/resume-v2.pdf`,
      sourceChecksumSha256: "2".repeat(64),
      claims: {
        education: [{ school: "Example College", program: "Nursing", status: "completed" }],
        experience: [{ organization: "Example Practice", role: "Medical Assistant", years: 3 }],
        skills: ["patient intake", "vital signs", "care coordination"],
        careerGoals: ["registered nurse"],
        locationPreferences: ["New York"],
        availabilityPreferences: ["weekdays", "weekends"],
      },
      parser: {
        provider: "openai",
        model: "career-parser-test",
        runId: `run_${suffix}_v2`,
        schemaVersion: 1,
        confidence: 0.95,
      },
    });

    expect(second.artifactVersion).toBe(first.artifactVersion + 1);
    expect(second.supersedesArtifactId).toBe(first.id);

    const versions = await listCareerArtifactVersions(personId);
    expect(versions).toHaveLength(2);
    expect(versions.map(({ id }) => id)).toEqual([second.id, first.id]);
    expect(versions[1].sourceChecksumSha256).toBe("1".repeat(64));
    expect(versions[1].claims.skills).toEqual(["patient intake", "vital signs"]);
  });

  it("human confirmation confirms the claims were reviewed but still does not verify a license, credential, or professional authority", async () => {
    const latest = (await listCareerArtifactVersions(personId))[0];
    const confirmed = await confirmCareerArtifactClaims({
      artifactId: latest.id,
      personId,
      confirmedBy: personId,
    });

    expect(confirmed.humanConfirmedAt).toBeInstanceOf(Date);
    expect(confirmed.humanConfirmedBy).toBe(personId);
    expect(confirmed.claimState).toBe("claimed");
    expect(confirmed.verificationState).toBe("unverified");
    expect(confirmed.grantsAuthority).toBe(false);
  });

  it("produces a matching input that omits the private source reference and cannot satisfy professional eligibility", async () => {
    const latest = (await listCareerArtifactVersions(personId))[0];
    const input = toCareerMatchingInput(latest);

    expect(input).toMatchObject({
      personId,
      artifactId: latest.id,
      claimState: "claimed",
      verificationState: "unverified",
      professionalEligibilitySatisfied: false,
    });
    expect(input.claims.skills).toContain("care coordination");
    expect(input).not.toHaveProperty("sourceReference");
    expect(input).not.toHaveProperty("sourceChecksumSha256");
  });
});
