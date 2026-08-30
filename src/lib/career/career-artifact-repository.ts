import "server-only";

import { Prisma, type CareerArtifact } from "@prisma/client";
import { db } from "@/lib/db";

export type CareerEducationClaim = Prisma.JsonObject;
export type CareerExperienceClaim = Prisma.JsonObject;

export type CareerClaims = {
  education: CareerEducationClaim[];
  experience: CareerExperienceClaim[];
  skills: string[];
  careerGoals: string[];
  locationPreferences: string[];
  availabilityPreferences: string[];
};

export type CareerParserProvenance = {
  provider: string;
  model: string;
  runId: string;
  schemaVersion: number;
  confidence: number;
};

export type CareerArtifactView = {
  id: string;
  personId: string;
  artifactType: "resume";
  artifactVersion: number;
  supersedesArtifactId: string | null;
  sourceType: string;
  sourceReference: string | null;
  sourceChecksumSha256: string | null;
  claimState: "claimed";
  verificationState: "unverified";
  claims: CareerClaims;
  parser: CareerParserProvenance | null;
  parsedAt: Date | null;
  humanConfirmedAt: Date | null;
  humanConfirmedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  grantsAuthority: false;
};

export type CreateResumeCareerArtifactInput = {
  personId: string;
  supersedesArtifactId?: string | null;
  sourceReference?: string | null;
  sourceChecksumSha256?: string | null;
  claims: CareerClaims;
  parser?: CareerParserProvenance | null;
};

function asRecordArray(value: Prisma.JsonValue): Prisma.JsonObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Prisma.JsonObject =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toView(row: CareerArtifact): CareerArtifactView {
  const hasParser = Boolean(
    row.parserProvider ||
      row.parserModel ||
      row.parserRunId ||
      row.parserSchemaVersion !== null ||
      row.parserConfidence !== null,
  );

  return {
    id: row.id,
    personId: row.personId,
    artifactType: "resume",
    artifactVersion: row.artifactVersion,
    supersedesArtifactId: row.supersedesArtifactId,
    sourceType: row.sourceType,
    sourceReference: row.sourceReference,
    sourceChecksumSha256: row.sourceChecksumSha256,
    claimState: "claimed",
    verificationState: "unverified",
    claims: {
      education: asRecordArray(row.educationClaims),
      experience: asRecordArray(row.experienceClaims),
      skills: asStringArray(row.skillClaims),
      careerGoals: asStringArray(row.careerGoals),
      locationPreferences: asStringArray(row.locationPreferences),
      availabilityPreferences: asStringArray(row.availabilityPreferences),
    },
    parser: hasParser
      ? {
          provider: row.parserProvider ?? "unknown",
          model: row.parserModel ?? "unknown",
          runId: row.parserRunId ?? "unknown",
          schemaVersion: row.parserSchemaVersion ?? 0,
          confidence: row.parserConfidence ?? 0,
        }
      : null,
    parsedAt: row.parsedAt,
    humanConfirmedAt: row.humanConfirmedAt,
    humanConfirmedBy: row.humanConfirmedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    grantsAuthority: false,
  };
}

function validateChecksum(value: string | null | undefined) {
  if (!value) return;
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("CareerArtifact sourceChecksumSha256 must be a 64-character SHA-256 hex digest.");
  }
}

function validateParser(parser: CareerParserProvenance | null | undefined) {
  if (!parser) return;
  if (!Number.isFinite(parser.confidence) || parser.confidence < 0 || parser.confidence > 1) {
    throw new Error("CareerArtifact parser confidence must be between 0 and 1.");
  }
  if (!Number.isInteger(parser.schemaVersion) || parser.schemaVersion < 1) {
    throw new Error("CareerArtifact parser schemaVersion must be a positive integer.");
  }
}

export async function createResumeCareerArtifact(
  input: CreateResumeCareerArtifactInput,
): Promise<CareerArtifactView> {
  validateChecksum(input.sourceChecksumSha256);
  validateParser(input.parser);

  return db.$transaction(async (tx) => {
    const person = await tx.person.findUnique({
      where: { id: input.personId },
      select: { id: true },
    });
    if (!person) throw new Error("CareerArtifact Person was not found.");

    const latest = await tx.careerArtifact.findFirst({
      where: { personId: input.personId, artifactType: "resume" },
      orderBy: { artifactVersion: "desc" },
    });

    if (input.supersedesArtifactId) {
      const requestedPrior = await tx.careerArtifact.findUnique({
        where: { id: input.supersedesArtifactId },
      });
      if (!requestedPrior || requestedPrior.personId !== input.personId || requestedPrior.artifactType !== "resume") {
        throw new Error("CareerArtifact supersedes target is not a resume owned by this Person.");
      }
      if (latest && requestedPrior.id !== latest.id) {
        throw new Error("CareerArtifact versions must extend the latest resume version.");
      }
    }

    const supersedesArtifactId = input.supersedesArtifactId ?? latest?.id ?? null;
    const artifactVersion = (latest?.artifactVersion ?? 0) + 1;
    const parser = input.parser ?? null;

    const row = await tx.careerArtifact.create({
      data: {
        personId: input.personId,
        artifactType: "resume",
        artifactVersion,
        supersedesArtifactId,
        sourceType: "resume_upload",
        sourceReference: input.sourceReference ?? null,
        sourceChecksumSha256: input.sourceChecksumSha256 ?? null,
        claimState: "claimed",
        verificationState: "unverified",
        educationClaims: toInputJson(input.claims.education),
        experienceClaims: toInputJson(input.claims.experience),
        skillClaims: toInputJson(input.claims.skills),
        careerGoals: toInputJson(input.claims.careerGoals),
        locationPreferences: toInputJson(input.claims.locationPreferences),
        availabilityPreferences: toInputJson(input.claims.availabilityPreferences),
        parserProvider: parser?.provider ?? null,
        parserModel: parser?.model ?? null,
        parserRunId: parser?.runId ?? null,
        parserSchemaVersion: parser?.schemaVersion ?? null,
        parserConfidence: parser?.confidence ?? null,
        parsedAt: parser ? new Date() : null,
      },
    });

    return toView(row);
  });
}

export async function listCareerArtifactVersions(personId: string): Promise<CareerArtifactView[]> {
  const rows = await db.careerArtifact.findMany({
    where: { personId, artifactType: "resume" },
    orderBy: [{ artifactVersion: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toView);
}

export async function confirmCareerArtifactClaims(input: {
  artifactId: string;
  personId: string;
  confirmedBy: string;
}): Promise<CareerArtifactView> {
  const existing = await db.careerArtifact.findFirst({
    where: { id: input.artifactId, personId: input.personId, artifactType: "resume" },
  });
  if (!existing) throw new Error("CareerArtifact was not found for this Person.");

  const row = await db.careerArtifact.update({
    where: { id: existing.id },
    data: {
      humanConfirmedAt: new Date(),
      humanConfirmedBy: input.confirmedBy,
      // Human confirmation means the claims were reviewed by a human. It deliberately
      // does not promote either claimState or verificationState.
    },
  });
  return toView(row);
}

export function toCareerMatchingInput(artifact: CareerArtifactView) {
  return {
    personId: artifact.personId,
    artifactId: artifact.id,
    artifactVersion: artifact.artifactVersion,
    claimState: artifact.claimState,
    verificationState: artifact.verificationState,
    claims: artifact.claims,
    professionalEligibilitySatisfied: false as const,
  };
}
