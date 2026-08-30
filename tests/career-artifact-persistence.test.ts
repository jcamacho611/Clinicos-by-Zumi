import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const personId = `career_person_${suffix}`;
const artifactOneId = `career_artifact_1_${suffix}`;
const artifactTwoId = `career_artifact_2_${suffix}`;

const baseClaims = {
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
};

describe("CareerArtifact persistence", () => {
  beforeAll(async () => {
    await db.person.create({
      data: {
        id: personId,
        displayName: "Career Test Person",
        status: "active",
        sourceType: "test",
      },
    });
  });

  afterAll(async () => {
    await db.careerArtifact.deleteMany({ where: { personId } });
    await db.person.deleteMany({ where: { id: personId } });
  });

  it("persists historical versions under one Person without overwriting prior claims", async () => {
    const v1 = await db.careerArtifact.create({
      data: {
        id: artifactOneId,
        personId,
        artifactType: "resume",
        sourceType: "uploaded_document",
        sourceReference: `private://resume/${suffix}/v1`,
        version: 1,
        status: "active",
        claimState: "claimed",
        educationClaims: baseClaims.educationClaims,
        experienceClaims: baseClaims.experienceClaims,
        skillClaims: baseClaims.skillClaims,
        careerGoals: ["registered nurse"],
        roleInterests: ["clinical placement"],
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
        effectiveFrom: new Date("2026-08-30T00:00:00.000Z"),
      },
    });

    const v2 = await db.careerArtifact.create({
      data: {
        id: artifactTwoId,
        personId,
        artifactType: "resume",
        sourceType: "uploaded_document",
        sourceReference: `private://resume/${suffix}/v2`,
        version: 2,
        status: "active",
        supersedesArtifactId: v1.id,
        claimState: "claimed",
        educationClaims: baseClaims.educationClaims,
        experienceClaims: [
          {
            ...baseClaims.experienceClaims[0],
            title: "Senior Medical Assistant",
          },
        ],
        skillClaims: baseClaims.skillClaims,
        careerGoals: ["registered nurse"],
        roleInterests: ["rn", "emergency nursing"],
        locationPreferences: ["New York, NY"],
        availabilityPreferences: ["weekdays"],
        parserProvenance: {
          assisted: true,
          provider: "openai",
          model: "example-model",
          runReference: "ai_run_2",
          confidence: 0.94,
        },
        humanConfirmedAt: null,
        effectiveFrom: new Date("2026-08-31T00:00:00.000Z"),
      },
    });

    const stored = await db.careerArtifact.findMany({
      where: { personId },
      orderBy: { version: "asc" },
    });

    expect(stored).toHaveLength(2);
    expect(stored.map(({ version }) => version)).toEqual([1, 2]);
    expect(stored[0].id).toBe(v1.id);
    expect(stored[1].supersedesArtifactId).toBe(v1.id);
    expect(stored[0].experienceClaims).toEqual(baseClaims.experienceClaims);
    expect(stored[1].sourceReference).toContain("private://resume/");
    expect(stored[1].parserProvenance).toMatchObject({ runReference: "ai_run_2" });
    expect(v2.personId).toBe(personId);
  });

  it("rejects duplicate versions for the same Person", async () => {
    await expect(
      db.careerArtifact.create({
        data: {
          id: `career_artifact_duplicate_${suffix}`,
          personId,
          artifactType: "manual",
          sourceType: "manual",
          sourceReference: null,
          version: 2,
          status: "active",
          claimState: "claimed",
          educationClaims: [],
          experienceClaims: [],
          skillClaims: [],
          careerGoals: [],
          roleInterests: [],
          locationPreferences: [],
          availabilityPreferences: [],
          parserProvenance: null,
          humanConfirmedAt: null,
          effectiveFrom: new Date("2026-09-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toThrow();
  });

  it("has no persisted authority field on CareerArtifact", async () => {
    const stored = await db.careerArtifact.findUniqueOrThrow({ where: { id: artifactTwoId } });
    expect("authority" in stored).toBe(false);
    expect("professionalEligibilitySatisfied" in stored).toBe(false);
  });
});
