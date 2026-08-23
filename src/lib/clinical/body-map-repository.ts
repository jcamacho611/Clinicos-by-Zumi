import "server-only";

import type { Prisma } from "@prisma/client";
import { bodyMapFindingKey, validateBodyMapFinding } from "@/lib/clinical/body-map-change";
import type {
  BodyMapContextType,
  BodyMapFinding,
  BodyMapSeverityScale,
  BodyMapVersion,
} from "@/lib/clinical/body-map-types";
import { db } from "@/lib/db";

export type CreateBodyMapFindingInput = Omit<BodyMapFinding, "id">;

export interface CreateBodyMapVersionInput {
  organizationId: string;
  patientId: string;
  encounterId: string;
  contextType: BodyMapContextType;
  contextId: string;
  capturedAt: Date;
  createdByUserId: string;
  sourceType?: "clinician_entry" | "staff_entry" | "reviewed_import";
  sourceReference?: string | null;
  supersedesVersionId?: string | null;
  findings: CreateBodyMapFindingInput[];
}

const versionInclude = {
  findings: {
    orderBy: [{ findingKey: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.ClinicalBodyMapVersionInclude;

type VersionRow = Prisma.ClinicalBodyMapVersionGetPayload<{ include: typeof versionInclude }>;

function toBodyMapVersion(row: VersionRow): BodyMapVersion {
  return {
    id: row.id,
    organizationId: row.organizationId,
    patientId: row.patientId,
    encounterId: row.encounterId,
    contextType: row.contextType as BodyMapContextType,
    contextId: row.contextId,
    capturedAt: row.capturedAt.toISOString(),
    createdByUserId: row.createdByUserId,
    findings: row.findings.map((finding) => ({
      id: finding.id,
      bodyRegion: finding.bodyRegion,
      laterality: finding.laterality as BodyMapFinding["laterality"],
      symptom: finding.symptom,
      severity: finding.severity,
      severityScale: finding.severityScale as BodyMapSeverityScale | null,
      functionalImpact: finding.functionalImpact,
      annotations: [...finding.annotations],
    })),
  };
}

function normalizedFindingRows(findings: CreateBodyMapFindingInput[]) {
  const keys = new Set<string>();
  return findings.map((finding) => {
    validateBodyMapFinding(finding);
    const findingKey = bodyMapFindingKey(finding);
    if (keys.has(findingKey)) throw new Error(`Duplicate body map finding key: ${findingKey}`);
    keys.add(findingKey);
    return {
      findingKey,
      bodyRegion: finding.bodyRegion.trim(),
      laterality: finding.laterality,
      symptom: finding.symptom.trim(),
      severity: finding.severity,
      severityScale: finding.severityScale,
      functionalImpact: finding.functionalImpact?.trim() || null,
      annotations: finding.annotations.map((annotation) => annotation.trim()).filter(Boolean),
    };
  });
}

async function assertBodyMapScope(input: CreateBodyMapVersionInput) {
  const [patient, encounter, actor] = await Promise.all([
    db.patient.findFirst({
      where: { id: input.patientId, organizationId: input.organizationId },
      select: { id: true },
    }),
    db.encounter.findFirst({
      where: { id: input.encounterId, patientId: input.patientId, organizationId: input.organizationId },
      select: { id: true },
    }),
    db.user.findFirst({
      where: { id: input.createdByUserId, organizationId: input.organizationId, status: "active" },
      select: { id: true },
    }),
  ]);

  if (!patient) throw new Error("Body map patient is outside the authorized organization scope");
  if (!encounter) throw new Error("Body map encounter is outside the authorized patient scope");
  if (!actor) throw new Error("Body map creator is outside the authorized organization scope");

  if (input.supersedesVersionId) {
    const superseded = await db.clinicalBodyMapVersion.findFirst({
      where: {
        id: input.supersedesVersionId,
        organizationId: input.organizationId,
        patientId: input.patientId,
        contextType: input.contextType,
        contextId: input.contextId,
      },
      select: { id: true, capturedAt: true },
    });
    if (!superseded) throw new Error("Body map superseded version is outside the authorized clinical context");
    if (input.capturedAt < superseded.capturedAt) throw new Error("Body map superseding capture cannot predate the version it supersedes");
  }
}

export async function createBodyMapVersion(input: CreateBodyMapVersionInput): Promise<BodyMapVersion> {
  if (!input.contextId.trim()) throw new Error("Body map clinical context is required");
  const findings = normalizedFindingRows(input.findings);
  await assertBodyMapScope(input);

  const row = await db.clinicalBodyMapVersion.create({
    data: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      contextType: input.contextType,
      contextId: input.contextId.trim(),
      capturedAt: input.capturedAt,
      createdByUserId: input.createdByUserId,
      sourceType: input.sourceType ?? "clinician_entry",
      sourceReference: input.sourceReference?.trim() || null,
      supersedesVersionId: input.supersedesVersionId ?? null,
      findings: { create: findings },
    },
    include: versionInclude,
  });

  return toBodyMapVersion(row);
}

export async function listBodyMapVersions(input: {
  organizationId: string;
  patientId: string;
  contextType: BodyMapContextType;
  contextId: string;
  limit?: number;
}): Promise<BodyMapVersion[]> {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50));
  const rows = await db.clinicalBodyMapVersion.findMany({
    where: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      contextType: input.contextType,
      contextId: input.contextId,
    },
    include: versionInclude,
    orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return rows.map(toBodyMapVersion);
}
