import "server-only";

import { EncounterStatus, type Prisma } from "@prisma/client";
import {
  validateBodyMapVersionInput,
  type BodyMapSourceObservation,
  type CreateBodyMapVersionInput,
  type PersistedBodyMapVersion,
} from "@/lib/clinical/body-map-persistence";
import { db } from "@/lib/db";

const FINALIZED_ENCOUNTER_STATUSES = new Set<EncounterStatus>([
  EncounterStatus.SIGNED,
  EncounterStatus.LOCKED,
  EncounterStatus.ADDENDUM_NEEDED,
]);

const bodyMapFindingSelect = {
  id: true,
  findingKey: true,
  bodyRegion: true,
  laterality: true,
  symptom: true,
  severity: true,
  clinicalState: true,
  functionalImpact: true,
  radiation: true,
  annotations: true,
  sourceObservation: true,
  createdAt: true,
} as const satisfies Prisma.BodyMapFindingSelect;

const bodyMapVersionSelect = {
  id: true,
  organizationId: true,
  patientId: true,
  encounterId: true,
  createdByUserId: true,
  capturedAt: true,
  source: true,
  amendsVersionId: true,
  createdAt: true,
  findings: {
    select: bodyMapFindingSelect,
    orderBy: { createdAt: "asc" },
  },
} as const satisfies Prisma.BodyMapVersionSelect;

type BodyMapVersionRow = Prisma.BodyMapVersionGetPayload<{ select: typeof bodyMapVersionSelect }>;

interface BodyMapMutationActor {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateBodyMapVersionForOrganizationInput {
  organizationId: string;
  patientId: string;
  encounterId: string;
  amendsVersionId?: string | null;
  fields: CreateBodyMapVersionInput;
  actor: BodyMapMutationActor;
}

export type CreateBodyMapVersionResult =
  | { kind: "created"; version: PersistedBodyMapVersion }
  | { kind: "invalid_input"; errors: string[] }
  | { kind: "patient_not_found" }
  | { kind: "encounter_not_found" }
  | { kind: "encounter_patient_mismatch" }
  | { kind: "actor_not_found" }
  | { kind: "amended_version_not_found" }
  | { kind: "finalized_requires_amendment" };

function mapSourceObservation(value: Prisma.JsonValue | null): BodyMapSourceObservation {
  if (value === null || Array.isArray(value) || typeof value !== "object") return null;
  return value as BodyMapSourceObservation;
}

function mapBodyMapVersion(row: BodyMapVersionRow): PersistedBodyMapVersion {
  return {
    id: row.id,
    organizationId: row.organizationId,
    patientId: row.patientId,
    encounterId: row.encounterId,
    createdByUserId: row.createdByUserId,
    capturedAt: row.capturedAt.toISOString(),
    source: row.source,
    amendsVersionId: row.amendsVersionId,
    createdAt: row.createdAt.toISOString(),
    findings: row.findings.map((finding) => ({
      id: finding.id,
      findingKey: finding.findingKey,
      bodyRegion: finding.bodyRegion,
      laterality: finding.laterality,
      symptom: finding.symptom,
      severity: finding.severity,
      clinicalState: finding.clinicalState,
      functionalImpact: finding.functionalImpact,
      radiation: finding.radiation,
      annotations: finding.annotations,
      sourceObservation: mapSourceObservation(finding.sourceObservation),
      createdAt: finding.createdAt.toISOString(),
    })),
  };
}

export async function createBodyMapVersionForOrganization(
  input: CreateBodyMapVersionForOrganizationInput,
): Promise<CreateBodyMapVersionResult> {
  const validated = validateBodyMapVersionInput(input.fields);
  if (!validated.ok) return { kind: "invalid_input", errors: validated.errors };

  return db.$transaction(async (transaction) => {
    const patient = await transaction.patient.findFirst({
      where: {
        id: input.patientId,
        organizationId: input.organizationId,
        status: "active",
      },
      select: { id: true },
    });
    if (!patient) return { kind: "patient_not_found" as const };

    const encounter = await transaction.encounter.findFirst({
      where: {
        id: input.encounterId,
        organizationId: input.organizationId,
      },
      select: { id: true, patientId: true, status: true },
    });
    if (!encounter) return { kind: "encounter_not_found" as const };
    if (encounter.patientId !== input.patientId) return { kind: "encounter_patient_mismatch" as const };

    const actor = await transaction.user.findFirst({
      where: {
        id: input.actor.userId,
        organizationId: input.organizationId,
        status: "active",
      },
      select: { id: true, name: true },
    });
    if (!actor) return { kind: "actor_not_found" as const };

    if (FINALIZED_ENCOUNTER_STATUSES.has(encounter.status) && !input.amendsVersionId) {
      return { kind: "finalized_requires_amendment" as const };
    }

    if (input.amendsVersionId) {
      const amendedVersion = await transaction.bodyMapVersion.findFirst({
        where: {
          id: input.amendsVersionId,
          organizationId: input.organizationId,
          patientId: input.patientId,
          encounterId: input.encounterId,
        },
        select: { id: true },
      });
      if (!amendedVersion) return { kind: "amended_version_not_found" as const };
    }

    const version = await transaction.bodyMapVersion.create({
      data: {
        organizationId: input.organizationId,
        patientId: input.patientId,
        encounterId: input.encounterId,
        createdByUserId: actor.id,
        capturedAt: validated.value.capturedAt,
        source: validated.value.source,
        amendsVersionId: input.amendsVersionId ?? null,
        findings: { create: validated.value.findings.map((finding) => ({
          findingKey: finding.findingKey,
          bodyRegion: finding.bodyRegion,
          laterality: finding.laterality,
          symptom: finding.symptom,
          severity: finding.severity,
          clinicalState: finding.clinicalState,
          functionalImpact: finding.functionalImpact,
          radiation: finding.radiation,
          annotations: finding.annotations,
          ...(finding.sourceObservation === null
            ? {}
            : { sourceObservation: finding.sourceObservation as Prisma.InputJsonValue }),
        })) },
      },
      select: bodyMapVersionSelect,
    });

    await transaction.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: actor.id,
        actorType: "user",
        action: input.amendsVersionId ? "body_map.version_amended" : "body_map.version_created",
        resourceType: "body_map_version",
        resourceId: version.id,
        patientId: input.patientId,
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
        metadata: {
          actorName: actor.name,
          encounterId: input.encounterId,
          findingCount: validated.value.findings.length,
          amendsVersionId: input.amendsVersionId ?? null,
          source: validated.value.source,
        },
      },
    });

    return { kind: "created" as const, version: mapBodyMapVersion(version) };
  });
}

export async function listBodyMapVersionsForPatient(
  patientId: string,
  organizationId: string,
  limit = 50,
): Promise<PersistedBodyMapVersion[]> {
  const rows = await db.bodyMapVersion.findMany({
    where: { organizationId, patientId },
    select: bodyMapVersionSelect,
    orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
    take: Math.max(1, Math.min(limit, 100)),
  });
  return rows.map(mapBodyMapVersion);
}

export async function findLatestBodyMapVersionForEncounter(
  encounterId: string,
  patientId: string,
  organizationId: string,
): Promise<PersistedBodyMapVersion | null> {
  const row = await db.bodyMapVersion.findFirst({
    where: { organizationId, patientId, encounterId },
    select: bodyMapVersionSelect,
    orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
  });
  return row ? mapBodyMapVersion(row) : null;
}
