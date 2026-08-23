import "server-only";

import type { Prisma } from "@prisma/client";
import { bodyMapFindingKey } from "@/lib/clinical/body-map-change";
import type { BodyLaterality, BodyMapFinding } from "@/lib/clinical/body-map-types";
import { db } from "@/lib/db";

export type BodyMapContextType =
  | "patient_longitudinal"
  | "financial_case"
  | "clinical_episode"
  | "encounter_series";

export type BodyMapClinicalState = "active" | "resolved";
export type BodyMapSourceType = "clinician_entry" | "staff_entry" | "reviewed_import";

export interface CreateBodyMapFindingInput {
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  functionalImpact: string | null;
  annotations: string[];
  clinicalState?: BodyMapClinicalState;
  resolutionNote?: string | null;
}

export interface CreateBodyMapVersionInput {
  organizationId: string;
  patientId: string;
  encounterId: string;
  contextType: BodyMapContextType;
  contextId: string;
  capturedAt: Date;
  createdByUserId: string;
  sourceType?: BodyMapSourceType;
  sourceReference?: string | null;
  supersedesVersionId?: string | null;
  findings: CreateBodyMapFindingInput[];
}

export interface PersistedBodyMapFinding {
  id: string;
  findingKey: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  functionalImpact: string | null;
  annotations: string[];
  clinicalState: BodyMapClinicalState;
  resolutionNote: string | null;
}

export interface PersistedBodyMapVersion {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId: string;
  contextType: BodyMapContextType;
  contextId: string;
  capturedAt: string;
  createdByUserId: string;
  sourceType: BodyMapSourceType;
  sourceReference: string | null;
  supersedesVersionId: string | null;
  findings: PersistedBodyMapFinding[];
}

const CAPTURE_ROLES = new Set(["clinic_owner", "provider", "clinical_staff"]);
const REVIEW_ROLES = new Set(["clinic_owner", "provider"]);

const versionInclude = {
  findings: {
    orderBy: [{ findingKey: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.ClinicalBodyMapVersionInclude;

type VersionRow = Prisma.ClinicalBodyMapVersionGetPayload<{ include: typeof versionInclude }>;

type ScopedActor = { id: string; roleKey: string };

function toPersistedBodyMapVersion(row: VersionRow): PersistedBodyMapVersion {
  return {
    id: row.id,
    organizationId: row.organizationId,
    patientId: row.patientId,
    encounterId: row.encounterId,
    contextType: row.contextType as BodyMapContextType,
    contextId: row.contextId,
    capturedAt: row.capturedAt.toISOString(),
    createdByUserId: row.createdByUserId,
    sourceType: row.sourceType as BodyMapSourceType,
    sourceReference: row.sourceReference,
    supersedesVersionId: row.supersedesVersionId,
    findings: row.findings.map((finding) => ({
      id: finding.id,
      findingKey: finding.findingKey,
      bodyRegion: finding.bodyRegion,
      laterality: finding.laterality as BodyLaterality,
      symptom: finding.symptom,
      severity: finding.severity,
      functionalImpact: finding.functionalImpact,
      annotations: [...finding.annotations],
      clinicalState: finding.clinicalState as BodyMapClinicalState,
      resolutionNote: finding.resolutionNote,
    })),
  };
}

function validateSeverity(severity: number | null) {
  if (severity === null) return;
  if (!Number.isFinite(severity) || severity < 0 || severity > 10) {
    throw new Error("Body map severity must be finite and between 0 and 10");
  }
}

function normalizedFindingRows(findings: CreateBodyMapFindingInput[]) {
  const keys = new Set<string>();

  return findings.map((finding) => {
    const bodyRegion = finding.bodyRegion.trim();
    const symptom = finding.symptom.trim();
    const functionalImpact = finding.functionalImpact?.trim() || null;
    const clinicalState = finding.clinicalState ?? "active";
    const resolutionNote = finding.resolutionNote?.trim() || null;

    if (!bodyRegion) throw new Error("Body map body region is required");
    if (!symptom) throw new Error("Body map symptom is required");
    validateSeverity(finding.severity);

    if (clinicalState === "active" && resolutionNote) {
      throw new Error("Active body map findings cannot carry a resolution note");
    }
    if (clinicalState === "resolved" && !resolutionNote) {
      throw new Error("Resolved body map findings require an explicit resolution note");
    }

    const comparisonFinding: BodyMapFinding = {
      id: "candidate",
      bodyRegion,
      laterality: finding.laterality,
      symptom,
      severity: finding.severity,
      functionalImpact,
      annotations: finding.annotations,
    };
    const findingKey = bodyMapFindingKey(comparisonFinding);
    if (keys.has(findingKey)) throw new Error(`Duplicate body map finding key: ${findingKey}`);
    keys.add(findingKey);

    return {
      findingKey,
      bodyRegion,
      laterality: finding.laterality,
      symptom,
      severity: finding.severity,
      severityScale: finding.severity === null ? null : "zero_to_ten",
      functionalImpact,
      annotations: finding.annotations.map((annotation) => annotation.trim()).filter(Boolean),
      clinicalState,
      resolutionNote,
    };
  });
}

async function scopedActor(
  organizationId: string,
  actorUserId: string,
  allowedRoles: ReadonlySet<string>,
): Promise<ScopedActor> {
  const actor = await db.user.findFirst({
    where: { id: actorUserId, organizationId, status: "active" },
    select: { id: true, roleKey: true },
  });
  if (!actor?.roleKey || !allowedRoles.has(actor.roleKey)) {
    throw new Error("Body map actor lacks authorized clinical capability");
  }
  return { id: actor.id, roleKey: actor.roleKey };
}

async function assertClinicalScope(input: CreateBodyMapVersionInput) {
  const [patient, encounter, actor] = await Promise.all([
    db.patient.findFirst({
      where: { id: input.patientId, organizationId: input.organizationId },
      select: { id: true },
    }),
    db.encounter.findFirst({
      where: { id: input.encounterId, patientId: input.patientId, organizationId: input.organizationId },
      select: { id: true },
    }),
    scopedActor(input.organizationId, input.createdByUserId, CAPTURE_ROLES),
  ]);

  if (!patient) throw new Error("Body map patient is outside the authorized organization scope");
  if (!encounter) throw new Error("Body map encounter is outside the authorized patient scope");

  const sourceType = input.sourceType ?? (actor.roleKey === "clinical_staff" ? "staff_entry" : "clinician_entry");
  if (sourceType === "staff_entry" && actor.roleKey !== "clinical_staff") {
    throw new Error("Body map staff-entry provenance requires a clinical-staff actor");
  }
  if (sourceType !== "staff_entry" && actor.roleKey === "clinical_staff") {
    throw new Error("Clinical staff cannot claim clinician/reviewed-import BodyMap provenance");
  }

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
    if (input.capturedAt < superseded.capturedAt) {
      throw new Error("Body map superseding capture cannot predate the version it supersedes");
    }
  }

  return { sourceType };
}

export async function createBodyMapVersion(input: CreateBodyMapVersionInput): Promise<PersistedBodyMapVersion> {
  if (!input.contextId.trim()) throw new Error("Body map clinical context is required");
  if (!Number.isFinite(input.capturedAt.getTime())) throw new Error("Body map capture time is invalid");

  const findings = normalizedFindingRows(input.findings);
  const { sourceType } = await assertClinicalScope(input);

  return db.$transaction(async (tx) => {
    const row = await tx.clinicalBodyMapVersion.create({
      data: {
        organizationId: input.organizationId,
        patientId: input.patientId,
        encounterId: input.encounterId,
        contextType: input.contextType,
        contextId: input.contextId.trim(),
        capturedAt: input.capturedAt,
        createdByUserId: input.createdByUserId,
        sourceType,
        sourceReference: input.sourceReference?.trim() || null,
        supersedesVersionId: input.supersedesVersionId ?? null,
        findings: { create: findings },
      },
      include: versionInclude,
    });

    const baseEventType = input.supersedesVersionId ? "amendment_created" : "capture_created";
    await tx.clinicalBodyMapEvent.create({
      data: {
        organizationId: row.organizationId,
        patientId: row.patientId,
        encounterId: row.encounterId,
        bodyMapVersionId: row.id,
        eventType: baseEventType,
        actorUserId: input.createdByUserId,
        sourceReference: row.sourceReference,
      },
    });

    for (const finding of row.findings) {
      if (finding.clinicalState !== "resolved") continue;
      await tx.clinicalBodyMapEvent.create({
        data: {
          organizationId: row.organizationId,
          patientId: row.patientId,
          encounterId: row.encounterId,
          bodyMapVersionId: row.id,
          findingId: finding.id,
          eventType: "finding_resolved",
          actorUserId: input.createdByUserId,
          reason: finding.resolutionNote,
          sourceReference: row.sourceReference,
        },
      });
    }

    return toPersistedBodyMapVersion(row);
  });
}

export async function recordBodyMapReview(input: {
  organizationId: string;
  bodyMapVersionId: string;
  actorUserId: string;
  outcome: "reviewed" | "needs_amendment";
  reason?: string | null;
}) {
  const [version] = await Promise.all([
    db.clinicalBodyMapVersion.findFirst({
      where: { id: input.bodyMapVersionId, organizationId: input.organizationId },
      select: { id: true, organizationId: true, patientId: true, encounterId: true },
    }),
    scopedActor(input.organizationId, input.actorUserId, REVIEW_ROLES),
  ]);
  if (!version) throw new Error("Body map version is outside the authorized organization scope");

  return db.clinicalBodyMapEvent.create({
    data: {
      organizationId: version.organizationId,
      patientId: version.patientId,
      encounterId: version.encounterId,
      bodyMapVersionId: version.id,
      eventType: "review_recorded",
      actorUserId: input.actorUserId,
      reason: input.reason?.trim() || null,
      metadata: { outcome: input.outcome },
    },
    select: { id: true, occurredAt: true },
  });
}

export async function listBodyMapVersions(input: {
  organizationId: string;
  patientId: string;
  contextType: BodyMapContextType;
  contextId: string;
  limit?: number;
}): Promise<PersistedBodyMapVersion[]> {
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

  return rows.map(toPersistedBodyMapVersion);
}
