import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ResumeCareerArtifact } from "@/lib/workforce/workforce-flywheel";

export type StoredCareerArtifact = {
  id: string;
  personId: string;
  artifactType: string;
  sourceType: string;
  sourceReference: string;
  verificationState: string;
  privacy: string;
  status: string;
  claims: Prisma.JsonValue;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  grantsAuthority: false;
};

function serialize(row: Omit<StoredCareerArtifact, "grantsAuthority">): StoredCareerArtifact {
  return { ...row, grantsAuthority: false };
}

export async function saveResumeCareerArtifact(
  artifact: ResumeCareerArtifact,
  provenance: {
    sourceType: string;
    sourceReference: string;
  },
): Promise<StoredCareerArtifact> {
  const sourceType = provenance.sourceType.trim();
  const sourceReference = provenance.sourceReference.trim();
  if (!sourceType || !sourceReference) throw new Error("Career artifact provenance is required.");
  if (artifact.verificationState !== "claimed" || artifact.grantsAuthority !== false) {
    throw new Error("Resume career artifacts must enter persistence as non-authoritative claimed evidence.");
  }

  const row = await db.workforceCareerArtifact.upsert({
    where: {
      personId_artifactType_sourceReference: {
        personId: artifact.personId,
        artifactType: "resume",
        sourceReference,
      },
    },
    create: {
      personId: artifact.personId,
      artifactType: "resume",
      sourceType,
      sourceReference,
      verificationState: "claimed",
      privacy: "private",
      status: "active",
      claims: artifact.claims as Prisma.InputJsonValue,
    },
    update: {
      sourceType,
      verificationState: "claimed",
      privacy: "private",
      status: "active",
      claims: artifact.claims as Prisma.InputJsonValue,
      reviewedBy: null,
      reviewedAt: null,
    },
  });

  return serialize(row);
}

export async function listCareerArtifactsForPerson(personId: string): Promise<StoredCareerArtifact[]> {
  const normalizedPersonId = personId.trim();
  if (!normalizedPersonId) return [];

  const rows = await db.workforceCareerArtifact.findMany({
    where: { personId: normalizedPersonId },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });

  return rows.map(serialize);
}
