import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  buildCareerArtifactDiscoveryInput,
  createCareerArtifactVersion,
  listCareerArtifactHistoryForPerson,
  listCareerArtifactsForOrganization,
  listCurrentCareerArtifactsForPerson,
} from "@/lib/edu/career-artifact-repository";

const suffix = "career_artifact_20260830";
const personId = `person_${suffix}`;
const orgA = `org_a_${suffix}`;
const orgB = `org_b_${suffix}`;

beforeAll(async () => {
  await db.organization.createMany({
    data: [
      { id: orgA, name: "Career Artifact Org A", slug: `career-artifact-org-a-${suffix}`, clinicType: "school" },
      { id: orgB, name: "Career Artifact Org B", slug: `career-artifact-org-b-${suffix}`, clinicType: "clinic" },
    ],
    skipDuplicates: true,
  });

  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `${suffix}@example.test`,
    },
  });
});

afterAll(async () => {
  await db.careerArtifact.deleteMany({ where: { personId } });
  await db.person.deleteMany({ where: { id: personId } });
  await db.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });
});

describe("CareerArtifact persistence", () => {
  it("versions resume claims without overwriting history or manufacturing authority", async () => {
    const v1 = await createCareerArtifactVersion({
      personId,
      organizationId: null,
      artifactType: "resume",
      sourceType: "resume",
      sourceReference: "career-source://resume-v1",
      storageLocator: "career-storage://resume-v1",
      format: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      claims: [
        {
          id: "claim_education_v1",
          claimType: "education",
          value: "Bachelor of Science in Nursing",
          normalizedValue: "BSN",
          confidence: 0.91,
          userConfirmation: "pending",
          verificationStatus: "claimed",
        },
        {
          id: "claim_skill_v1",
          claimType: "skill",
          value: "Medical-surgical nursing",
          confidence: 0.86,
          userConfirmation: "not_requested",
          verificationStatus: "claimed",
        },
      ],
      parserProvenance: {
        provider: "openai",
        model: "test-model",
        runId: "parse_run_v1",
      },
      humanConfirmationState: "pending",
      humanConfirmedFields: [],
      effectiveAt: new Date("2026-08-30T10:00:00.000Z"),
    });

    expect(v1.version).toBe(1);
    expect(v1.claimState).toBe("claimed");
    expect(v1.verificationState).toBe("claimed");
    expect(v1.parserProvenance).toMatchObject({ runId: "parse_run_v1" });
    expect(v1).not.toHaveProperty("grantsAuthority");

    const v2 = await createCareerArtifactVersion({
      personId,
      organizationId: null,
      previousArtifactId: v1.id,
      artifactType: "resume",
      sourceType: "resume",
      sourceReference: "career-source://resume-v2",
      storageLocator: "career-storage://resume-v2",
      format: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 2300,
      claims: [
        {
          id: "claim_education_v2",
          claimType: "education",
          value: "Bachelor of Science in Nursing",
          normalizedValue: "BSN",
          confidence: 0.96,
          userConfirmation: "confirmed",
          verificationStatus: "claimed",
        },
        {
          id: "claim_skill_v2",
          claimType: "skill",
          value: "Pediatric nursing",
          confidence: 0.72,
          userConfirmation: "pending",
          verificationStatus: "claimed",
        },
      ],
      parserProvenance: {
        provider: "openai",
        model: "test-model",
        runId: "parse_run_v2",
      },
      humanConfirmationState: "partial",
      humanConfirmedFields: ["claim_education_v2"],
      effectiveAt: new Date("2026-08-30T11:00:00.000Z"),
    });

    expect(v2.versionGroupId).toBe(v1.versionGroupId);
    expect(v2.version).toBe(2);
    expect(v2.supersedesId).toBe(v1.id);

    const history = await listCareerArtifactHistoryForPerson(personId);
    expect(history).toHaveLength(2);
    expect(history.map((artifact) => artifact.version)).toEqual([1, 2]);
    expect(history[0].claims).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "claim_skill_v1", value: "Medical-surgical nursing" })]),
    );
    expect(history[0].status).toBe("superseded");
    expect(history[0].effectiveTo?.toISOString()).toBe("2026-08-30T11:00:00.000Z");

    const current = await listCurrentCareerArtifactsForPerson(personId, new Date("2026-08-30T12:00:00.000Z"));
    expect(current.map((artifact) => artifact.id)).toEqual([v2.id]);
  });

  it("keeps organization-scoped career evidence tenant-isolated and does not disclose private personal artifacts", async () => {
    const scoped = await createCareerArtifactVersion({
      personId,
      organizationId: orgA,
      artifactType: "resume",
      sourceType: "import",
      sourceReference: "school-import://resume-a",
      storageLocator: null,
      format: "json",
      mimeType: "application/json",
      sizeBytes: 512,
      claims: [
        {
          id: "claim_role_interest_a",
          claimType: "role_interest",
          value: "Registered nurse",
          confidence: 1,
          userConfirmation: "confirmed",
          verificationStatus: "claimed",
        },
      ],
      parserProvenance: null,
      humanConfirmationState: "confirmed",
      humanConfirmedFields: ["claim_role_interest_a"],
      effectiveAt: new Date("2026-08-30T12:30:00.000Z"),
    });

    const visibleToA = await listCareerArtifactsForOrganization({ personId, organizationId: orgA });
    const visibleToB = await listCareerArtifactsForOrganization({ personId, organizationId: orgB });

    expect(visibleToA.map((artifact) => artifact.id)).toEqual([scoped.id]);
    expect(visibleToA.every((artifact) => artifact.organizationId === orgA)).toBe(true);
    expect(visibleToA.some((artifact) => artifact.organizationId === null)).toBe(false);
    expect(visibleToB).toEqual([]);
  });

  it("produces matching inputs that remain claims and never satisfy professional eligibility", async () => {
    const current = await listCurrentCareerArtifactsForPerson(personId, new Date("2026-08-30T13:00:00.000Z"));
    const personalResume = current.find((artifact) => artifact.organizationId === null);
    expect(personalResume).toBeDefined();
    if (!personalResume) return;

    const input = buildCareerArtifactDiscoveryInput(personalResume);

    expect(input.personId).toBe(personId);
    expect(input.grantsAuthority).toBe(false);
    expect(input.professionalEligibilitySatisfied).toBe(false);
    expect(input.claims.length).toBeGreaterThan(0);
    expect(input.claims.every((claim) => claim.eligibilityUse === "never_direct")).toBe(true);
    expect(input.claims.every((claim) => claim.verificationStatus === "claimed")).toBe(true);

    expect(input).not.toHaveProperty("sourceReference");
    expect(input).not.toHaveProperty("storageLocator");
    expect(input).not.toHaveProperty("rawContent");
  });
});
