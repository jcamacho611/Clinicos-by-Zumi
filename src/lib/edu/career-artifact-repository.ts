import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CareerClaim = {
  id: string;
  claimType: string;
  value: string;
  normalizedValue?: string;
  confidence?: number;
  userConfirmation: string;
  verificationStatus: "claimed";
};

export type CareerArtifactRecord = {
  id: string;
  personId: string;
  organizationId: string | null;
  artifactType: string;
  sourceType: string;
  sourceReference: string | null;
  storageLocator: string | null;
  format: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  versionGroupId: string;
  version: number;
  supersedesId: string | null;
  status: string;
  claimState: "claimed";
  verificationState: "claimed";
  claims: CareerClaim[];
  parserProvenance: Record<string, unknown> | null;
  humanConfirmationState: string;
  humanConfirmedFields: string[];
  evidenceReferences: string[];
  provenance: Record<string, unknown> | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCareerArtifactVersionInput = {
  personId: string;
  organizationId: string | null;
  previousArtifactId?: string;
  artifactType: "resume" | "manual" | "import" | string;
  sourceType: "resume" | "manual" | "import" | string;
  sourceReference: string | null;
  storageLocator: string | null;
  format: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  claims: CareerClaim[];
  parserProvenance: Record<string, unknown> | null;
  humanConfirmationState: string;
  humanConfirmedFields: string[];
  evidenceReferences?: string[];
  provenance?: Record<string, unknown> | null;
  effectiveAt: Date;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readStringArray(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function readObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  return isObject(value) ? { ...value } : null;
}

function readClaims(value: Prisma.JsonValue): CareerClaim[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isObject(item)) return [];
    if (typeof item.id !== "string" || typeof item.claimType !== "string" || typeof item.value !== "string") return [];

    return [
      {
        id: item.id,
        claimType: item.claimType,
        value: item.value,
        ...(typeof item.normalizedValue === "string" ? { normalizedValue: item.normalizedValue } : {}),
        ...(typeof item.confidence === "number" && Number.isFinite(item.confidence)
          ? { confidence: Math.max(0, Math.min(1, item.confidence)) }
          : {}),
        userConfirmation: typeof item.userConfirmation === "string" ? item.userConfirmation : "pending",
        // CareerArtifact is a claims surface. Persisted parser/self-reported content
        // never upgrades itself into governed verification.
        verificationStatus: "claimed" as const,
      },
    ];
  });
}

function normalizeClaims(claims: CareerClaim[]): CareerClaim[] {
  return claims.map((claim) => ({
    id: claim.id,
    claimType: claim.claimType,
    value: claim.value,
    ...(claim.normalizedValue ? { normalizedValue: claim.normalizedValue } : {}),
    ...(typeof claim.confidence === "number"
      ? { confidence: Math.max(0, Math.min(1, claim.confidence)) }
      : {}),
    userConfirmation: claim.userConfirmation,
    verificationStatus: "claimed" as const,
  }));
}

function toRecord(row: {
  id: string;
  personId: string;
  organizationId: string | null;
  artifactType: string;
  sourceType: string;
  sourceReference: string | null;
  storageLocator: string | null;
  format: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  versionGroupId: string;
  version: number;
  supersedesId: string | null;
  status: string;
  claimState: string;
  verificationState: string;
  claims: Prisma.JsonValue;
  parserProvenance: Prisma.JsonValue | null;
  humanConfirmationState: string;
  humanConfirmedFields: Prisma.JsonValue | null;
  evidenceReferences: Prisma.JsonValue | null;
  provenance: Prisma.JsonValue | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CareerArtifactRecord {
  return {
    ...row,
    // Unknown persisted states fail closed to the claims-only interpretation.
    claimState: "claimed",
    verificationState: "claimed",
    claims: readClaims(row.claims),
    parserProvenance: readObject(row.parserProvenance),
    humanConfirmedFields: readStringArray(row.humanConfirmedFields),
    evidenceReferences: readStringArray(row.evidenceReferences),
    provenance: readObject(row.provenance),
  };
}

export async function createCareerArtifactVersion(
  input: CreateCareerArtifactVersionInput,
): Promise<CareerArtifactRecord> {
  const claims = normalizeClaims(input.claims);

  return db.$transaction(async (tx) => {
    let versionGroupId = `career_${randomUUID()}`;
    let version = 1;
    let supersedesId: string | null = null;

    if (input.previousArtifactId) {
      const previous = await tx.careerArtifact.findUnique({ where: { id: input.previousArtifactId } });
      if (!previous || previous.personId !== input.personId) throw new Error("CareerArtifact predecessor was not found for this Person.");
      if (previous.status !== "active" || previous.effectiveTo) throw new Error("CareerArtifact predecessor is no longer current.");
      if (previous.organizationId !== input.organizationId) throw new Error("CareerArtifact scope cannot change inside one version lineage.");
      if (previous.artifactType !== input.artifactType) throw new Error("CareerArtifact type cannot change inside one version lineage.");
      if (input.effectiveAt.getTime() <= previous.effectiveFrom.getTime()) {
        throw new Error("CareerArtifact successor must become effective after its predecessor.");
      }

      versionGroupId = previous.versionGroupId;
      version = previous.version + 1;
      supersedesId = previous.id;

      const retired = await tx.careerArtifact.updateMany({
        where: { id: previous.id, personId: input.personId, status: "active", effectiveTo: null },
        data: { status: "superseded", effectiveTo: input.effectiveAt },
      });
      if (retired.count !== 1) throw new Error("CareerArtifact predecessor changed during version creation.");
    }

    const created = await tx.careerArtifact.create({
      data: {
        personId: input.personId,
        organizationId: input.organizationId,
        artifactType: input.artifactType,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        storageLocator: input.storageLocator,
        format: input.format,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        versionGroupId,
        version,
        supersedesId,
        status: "active",
        claimState: "claimed",
        verificationState: "claimed",
        claims: jsonInput(claims),
        ...(input.parserProvenance ? { parserProvenance: jsonInput(input.parserProvenance) } : {}),
        humanConfirmationState: input.humanConfirmationState,
        humanConfirmedFields: jsonInput(input.humanConfirmedFields),
        evidenceReferences: jsonInput(input.evidenceReferences ?? []),
        ...(input.provenance ? { provenance: jsonInput(input.provenance) } : {}),
        effectiveFrom: input.effectiveAt,
      },
    });

    return toRecord(created);
  });
}

export async function listCareerArtifactHistoryForPerson(personId: string): Promise<CareerArtifactRecord[]> {
  const rows = await db.careerArtifact.findMany({
    where: { personId },
    orderBy: [{ versionGroupId: "asc" }, { version: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toRecord);
}

export async function listCurrentCareerArtifactsForPerson(
  personId: string,
  at: Date = new Date(),
): Promise<CareerArtifactRecord[]> {
  const rows = await db.careerArtifact.findMany({
    where: {
      personId,
      status: "active",
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
    orderBy: [{ organizationId: "asc" }, { effectiveFrom: "desc" }],
  });
  return rows.map(toRecord);
}

export async function listCareerArtifactsForOrganization(input: {
  personId: string;
  organizationId: string;
}): Promise<CareerArtifactRecord[]> {
  const rows = await db.careerArtifact.findMany({
    where: {
      personId: input.personId,
      organizationId: input.organizationId,
      status: "active",
    },
    orderBy: { effectiveFrom: "desc" },
  });
  return rows.map(toRecord);
}

export function buildCareerArtifactDiscoveryInput(artifact: CareerArtifactRecord) {
  return {
    personId: artifact.personId,
    artifactId: artifact.id,
    artifactType: artifact.artifactType,
    organizationId: artifact.organizationId,
    grantsAuthority: false as const,
    professionalEligibilitySatisfied: false as const,
    claims: artifact.claims.map((claim) => ({
      id: claim.id,
      claimType: claim.claimType,
      value: claim.value,
      normalizedValue: claim.normalizedValue ?? null,
      confidence: claim.confidence ?? null,
      userConfirmation: claim.userConfirmation,
      verificationStatus: "claimed" as const,
      eligibilityUse: "never_direct" as const,
    })),
  };
}
