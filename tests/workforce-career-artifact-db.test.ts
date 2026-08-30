import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createResumeCareerArtifact } from "@/lib/workforce/workforce-flywheel";
import {
  listCareerArtifactsForPerson,
  saveResumeCareerArtifact,
} from "@/lib/workforce/career-artifact-repository";

const suffix = "workforce_career_artifact_20260830";
const personId = `person_${suffix}`;
const sourceId = `resume_${suffix}`;

beforeAll(async () => {
  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `${suffix}@example.test`,
      sourceType: "test",
    },
  });
});

afterAll(async () => {
  await db.workforceCareerArtifact.deleteMany({ where: { personId } });
  await db.person.deleteMany({ where: { id: personId } });
});

describe("persisted workforce career artifacts", () => {
  it("stores a resume as private claimed evidence attached to the durable Person", async () => {
    const artifact = createResumeCareerArtifact({
      personId,
      sourceId,
      education: ["Nursing program — expected graduation 2026"],
      experience: ["Clinical rotation — 120 hours"],
      skills: ["patient communication", "vital signs"],
      goals: ["registered nurse role"],
    });

    const saved = await saveResumeCareerArtifact(artifact, {
      sourceType: "resume_upload",
      sourceReference: sourceId,
    });

    expect(saved).toMatchObject({
      personId,
      artifactType: "resume",
      verificationState: "claimed",
      privacy: "private",
      status: "active",
      sourceType: "resume_upload",
      sourceReference: sourceId,
    });
    expect(saved.claims).toMatchObject({
      skills: ["patient communication", "vital signs"],
      goals: ["registered nurse role"],
    });
  });

  it("keeps provenance stable and never represents the artifact as professional authority", async () => {
    const rows = await listCareerArtifactsForPerson(personId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      personId,
      artifactType: "resume",
      verificationState: "claimed",
      privacy: "private",
      sourceReference: sourceId,
      grantsAuthority: false,
    });
  });

  it("is idempotent for the same Person, artifact type, and source reference", async () => {
    const artifact = createResumeCareerArtifact({
      personId,
      sourceId,
      skills: ["patient communication", "vital signs", "documentation"],
      goals: ["registered nurse role"],
    });

    await saveResumeCareerArtifact(artifact, {
      sourceType: "resume_upload",
      sourceReference: sourceId,
    });

    const rows = await listCareerArtifactsForPerson(personId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.claims).toMatchObject({
      skills: ["patient communication", "vital signs", "documentation"],
    });
    expect(rows[0]?.verificationState).toBe("claimed");
    expect(rows[0]?.grantsAuthority).toBe(false);
  });
});
