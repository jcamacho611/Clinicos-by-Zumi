import "server-only";

import { Prisma, type PhiProviderEvidenceRecord } from "@prisma/client";
import { db } from "@/lib/db";
import type { PhiProviderEvidence } from "@/features/zumi/phi-provider-evidence";

export type PersistedPhiProviderEvidence = PhiProviderEvidence & {
  id: string;
  recordedBy: string;
  revokedBy: string | null;
  revocationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EvidenceIdentity = {
  providerKey: string;
  deploymentKey: string;
  endpointOrigin: string;
  accountReference: string;
  projectReference: string;
  capabilityKey: "phi_inference";
};

type RecordEvidenceInput = EvidenceIdentity & {
  status: PhiProviderEvidence["status"];
  baaStatus: PhiProviderEvidence["baaStatus"];
  retentionPolicyStatus: PhiProviderEvidence["retentionPolicyStatus"];
  trainingUseStatus: PhiProviderEvidence["trainingUseStatus"];
  approvedModelIds: readonly string[];
  verifiedAt: Date | null;
  effectiveAt: Date | null;
  expiresAt: Date | null;
  evidenceReference: string;
  recordedBy: string;
};

function nonEmpty(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function evidenceStatus(value: string): PhiProviderEvidence["status"] {
  if (value === "pending" || value === "verified" || value === "rejected" || value === "expired" || value === "revoked") {
    return value;
  }
  throw new Error(`Unknown PHI provider evidence status: ${value}`);
}

function verificationState(value: string, label: string): "unverified" | "verified" {
  if (value === "unverified" || value === "verified") return value;
  throw new Error(`Unknown ${label}: ${value}`);
}

function trainingUseState(value: string): "unverified" | "verified_disabled" {
  if (value === "unverified" || value === "verified_disabled") return value;
  throw new Error(`Unknown training-use status: ${value}`);
}

function toView(row: PhiProviderEvidenceRecord): PersistedPhiProviderEvidence {
  return {
    id: row.id,
    providerKey: row.providerKey,
    deploymentKey: row.deploymentKey,
    endpointOrigin: row.endpointOrigin,
    accountReference: row.accountReference,
    projectReference: row.projectReference,
    capabilityKey: "phi_inference",
    status: evidenceStatus(row.status),
    baaStatus: verificationState(row.baaStatus, "BAA status"),
    retentionPolicyStatus: verificationState(row.retentionPolicyStatus, "retention policy status"),
    trainingUseStatus: trainingUseState(row.trainingUseStatus),
    approvedModelIds: row.approvedModelIds,
    verifiedAt: row.verifiedAt,
    effectiveAt: row.effectiveAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    evidenceReference: row.evidenceReference,
    authorityVersion: row.authorityVersion,
    recordedBy: row.recordedBy,
    revokedBy: row.revokedBy,
    revocationReason: row.revocationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function identityWhere(identity: EvidenceIdentity) {
  return {
    providerKey: identity.providerKey,
    deploymentKey: identity.deploymentKey,
    endpointOrigin: identity.endpointOrigin,
    accountReference: identity.accountReference,
    projectReference: identity.projectReference,
    capabilityKey: identity.capabilityKey,
  };
}

function validateIdentity(identity: EvidenceIdentity) {
  nonEmpty(identity.providerKey, "providerKey");
  nonEmpty(identity.deploymentKey, "deploymentKey");
  nonEmpty(identity.endpointOrigin, "endpointOrigin");
  nonEmpty(identity.accountReference, "accountReference");
  nonEmpty(identity.projectReference, "projectReference");
}

export async function recordPhiProviderEvidence(input: RecordEvidenceInput): Promise<PersistedPhiProviderEvidence> {
  validateIdentity(input);
  nonEmpty(input.evidenceReference, "evidenceReference");
  nonEmpty(input.recordedBy, "recordedBy");

  const approvedModelIds = [...new Set(input.approvedModelIds.map((value) => value.trim()).filter(Boolean))];
  if (input.status === "verified" && approvedModelIds.length === 0) {
    throw new Error("Verified PHI provider evidence requires at least one approved model.");
  }
  if (input.effectiveAt && input.expiresAt && input.expiresAt <= input.effectiveAt) {
    throw new Error("PHI provider evidence expiresAt must be after effectiveAt.");
  }

  return db.$transaction(
    async (tx) => {
      const latest = await tx.phiProviderEvidenceRecord.findFirst({
        where: identityWhere(input),
        orderBy: { authorityVersion: "desc" },
        select: { authorityVersion: true },
      });

      const row = await tx.phiProviderEvidenceRecord.create({
        data: {
          ...identityWhere(input),
          status: input.status,
          baaStatus: input.baaStatus,
          retentionPolicyStatus: input.retentionPolicyStatus,
          trainingUseStatus: input.trainingUseStatus,
          approvedModelIds,
          verifiedAt: input.verifiedAt,
          effectiveAt: input.effectiveAt,
          expiresAt: input.expiresAt,
          evidenceReference: input.evidenceReference.trim(),
          authorityVersion: (latest?.authorityVersion ?? 0) + 1,
          recordedBy: input.recordedBy.trim(),
        },
      });

      return toView(row);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function listPhiProviderEvidenceHistory(identity: EvidenceIdentity): Promise<PersistedPhiProviderEvidence[]> {
  validateIdentity(identity);
  const rows = await db.phiProviderEvidenceRecord.findMany({
    where: identityWhere(identity),
    orderBy: { authorityVersion: "desc" },
  });
  return rows.map(toView);
}

export async function getCurrentPhiProviderEvidence(input: EvidenceIdentity & {
  modelId: string;
  now?: Date;
}): Promise<PersistedPhiProviderEvidence | null> {
  validateIdentity(input);
  const modelId = nonEmpty(input.modelId, "modelId");
  const now = input.now ?? new Date();

  const latest = await db.phiProviderEvidenceRecord.findFirst({
    where: identityWhere(input),
    orderBy: { authorityVersion: "desc" },
  });
  if (!latest) return null;

  const evidence = toView(latest);
  if (evidence.status !== "verified" || !evidence.verifiedAt) return null;
  if (evidence.baaStatus !== "verified") return null;
  if (evidence.retentionPolicyStatus !== "verified") return null;
  if (evidence.trainingUseStatus !== "verified_disabled") return null;
  if (!evidence.approvedModelIds.includes(modelId)) return null;
  if (!evidence.effectiveAt || evidence.effectiveAt > now) return null;
  if (evidence.expiresAt && evidence.expiresAt <= now) return null;
  if (evidence.revokedAt && evidence.revokedAt <= now) return null;
  return evidence;
}

export async function revokePhiProviderEvidence(input: {
  evidenceId: string;
  revokedAt: Date;
  revokedBy: string;
  revocationReason: string;
}): Promise<PersistedPhiProviderEvidence> {
  nonEmpty(input.evidenceId, "evidenceId");
  nonEmpty(input.revokedBy, "revokedBy");
  nonEmpty(input.revocationReason, "revocationReason");

  const existing = await db.phiProviderEvidenceRecord.findUnique({ where: { id: input.evidenceId } });
  if (!existing) throw new Error("PHI provider evidence record was not found.");
  if (existing.revokedAt) return toView(existing);

  const row = await db.phiProviderEvidenceRecord.update({
    where: { id: input.evidenceId },
    data: {
      status: "revoked",
      revokedAt: input.revokedAt,
      revokedBy: input.revokedBy.trim(),
      revocationReason: input.revocationReason.trim(),
    },
  });
  return toView(row);
}
