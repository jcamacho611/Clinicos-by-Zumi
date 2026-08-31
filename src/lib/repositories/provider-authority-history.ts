import "server-only";

import { Prisma } from "@prisma/client";

type DateLike = Date | string | null | undefined;

function iso(value: DateLike) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export type CredentialAuthorityState = {
  id: string;
  type: string;
  number: string;
  state: string | null;
  expiresAt: DateLike;
  status: string;
  verificationStatus: string;
  verificationSource: string | null;
  primarySourceVerifiedAt: DateLike;
  evidenceDocumentId: string | null;
  evidenceReference: string | null;
  exceptionReason: string | null;
  verifiedBy: string | null;
  reviewNotes: string | null;
  authorityVersion: number;
};

export type FacilityPrivilegeAuthorityState = {
  id: string;
  facilityId: string;
  status: string;
  grantedAt: DateLike;
  expiresAt: DateLike;
  verificationSource: string | null;
  notes: string | null;
  authorityVersion: number;
};

export type MalpracticeAuthorityState = {
  id: string;
  malpracticeCarrier: string | null;
  malpracticePolicyNumber: string | null;
  malpracticeExpiration: DateLike;
  malpracticeCoverageAmountCents: number | null;
  malpracticeEvidenceReference: string | null;
  malpracticeVerificationStatus: string;
  malpracticeVerifiedAt: DateLike;
  malpracticeVerifiedBy: string | null;
  malpracticeReviewNotes: string | null;
  malpracticeAuthorityVersion: number;
  verificationStatus: string;
};

export function credentialAuthoritySnapshot(value: CredentialAuthorityState): Prisma.JsonObject {
  return {
    id: value.id,
    type: value.type,
    number: value.number,
    state: value.state,
    expiresAt: iso(value.expiresAt),
    status: value.status,
    verificationStatus: value.verificationStatus,
    verificationSource: value.verificationSource,
    primarySourceVerifiedAt: iso(value.primarySourceVerifiedAt),
    evidenceDocumentId: value.evidenceDocumentId,
    evidenceReference: value.evidenceReference,
    exceptionReason: value.exceptionReason,
    verifiedBy: value.verifiedBy,
    reviewNotes: value.reviewNotes,
    authorityVersion: value.authorityVersion,
  };
}

export function facilityPrivilegeAuthoritySnapshot(value: FacilityPrivilegeAuthorityState): Prisma.JsonObject {
  return {
    id: value.id,
    facilityId: value.facilityId,
    status: value.status,
    grantedAt: iso(value.grantedAt),
    expiresAt: iso(value.expiresAt),
    verificationSource: value.verificationSource,
    notes: value.notes,
    authorityVersion: value.authorityVersion,
  };
}

export function malpracticeAuthoritySnapshot(value: MalpracticeAuthorityState): Prisma.JsonObject {
  return {
    providerId: value.id,
    carrier: value.malpracticeCarrier,
    policyNumber: value.malpracticePolicyNumber,
    expiration: iso(value.malpracticeExpiration),
    coverageAmountCents: value.malpracticeCoverageAmountCents,
    evidenceReference: value.malpracticeEvidenceReference,
    verificationStatus: value.malpracticeVerificationStatus,
    verifiedAt: iso(value.malpracticeVerifiedAt),
    verifiedBy: value.malpracticeVerifiedBy,
    reviewNotes: value.malpracticeReviewNotes,
    authorityVersion: value.malpracticeAuthorityVersion,
    providerVerificationStatus: value.verificationStatus,
  };
}

type AuthorityKind = "credential" | "facility_privilege" | "malpractice";

type AppendProviderAuthorityEventInput = {
  organizationId: string;
  providerId: string;
  authorityKind: AuthorityKind;
  authorityRecordId: string;
  authorityVersion: number;
  action: string;
  actorId: string | null;
  actorType: string;
  beforeState: Prisma.JsonObject | null;
  afterState: Prisma.JsonObject;
  evidenceDocumentId?: string | null;
  evidenceReference?: string | null;
  provenanceSource?: string | null;
  note?: string | null;
  metadata?: Prisma.JsonObject | null;
};

export async function appendProviderAuthorityEvent(
  tx: Pick<Prisma.TransactionClient, "providerAuthorityEvent">,
  input: AppendProviderAuthorityEventInput,
) {
  return tx.providerAuthorityEvent.create({
    data: {
      ...input,
      beforeState: input.beforeState === null ? Prisma.DbNull : input.beforeState,
      evidenceDocumentId: input.evidenceDocumentId ?? null,
      evidenceReference: input.evidenceReference ?? null,
      provenanceSource: input.provenanceSource ?? null,
      note: input.note ?? null,
      metadata: input.metadata ?? undefined,
      schemaVersion: 1,
    },
  });
}
