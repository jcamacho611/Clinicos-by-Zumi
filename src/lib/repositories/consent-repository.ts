import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { createConsentSchema, consentAllowsAccess, withdrawConsentSchema } from "@/lib/patient-identity-rules";
import type { NetworkPurpose, ShareableCategory } from "@/lib/network-access-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import type { PatientConsentSummary } from "@/lib/types";

type Transaction = Prisma.TransactionClient;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function requireActiveAccessConsent(tx: Transaction, input: {
  consentId?: string | null;
  sourceOrganizationId: string;
  patientId: string;
  requestingOrganizationId: string;
  requestingUserId?: string;
  purposeOfUse: NetworkPurpose;
  categories: ShareableCategory[];
  now?: Date;
}) {
  const consents = await tx.consent.findMany({
    where: {
      ...(input.consentId ? { id: input.consentId } : {}),
      organizationId: input.sourceOrganizationId,
      patientId: input.patientId,
      status: "active",
      withdrawnAt: null,
      OR: [
        { grantedToOrganizationId: input.requestingOrganizationId },
        ...(input.requestingUserId ? [{ grantedToUserId: input.requestingUserId }] : []),
      ],
    },
    orderBy: { signedAt: "desc" },
  });
  const consent = consents.find((candidate) => consentAllowsAccess(candidate, {
    sourceOrganizationId: input.sourceOrganizationId,
    patientId: input.patientId,
    requestingOrganizationId: input.requestingOrganizationId,
    requestingUserId: input.requestingUserId,
    purposeOfUse: input.purposeOfUse,
    categories: input.categories,
    now: input.now,
  }));
  if (!consent) throw new NetworkAccessError("No active patient consent covers this recipient, purpose, and every requested category.", 403);
  return consent;
}

export async function listConsentsForOrganization(organizationId: string) {
  const consents = await db.consent.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
  const patientIds = [...new Set(consents.map((consent) => consent.patientId))];
  const organizationIds = [...new Set(consents.map((consent) => consent.grantedToOrganizationId).filter((value): value is string => !!value))];
  const [patients, organizations] = await Promise.all([
    db.patient.findMany({ where: { organizationId, id: { in: patientIds } }, select: { id: true, firstName: true, lastName: true, mrn: true } }),
    db.organization.findMany({ where: { id: { in: organizationIds } }, select: { id: true, name: true } }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const now = new Date();

  return consents.map((consent) => {
    const patient = patientMap.get(consent.patientId);
    const state = consent.withdrawnAt || consent.status === "withdrawn"
      ? "withdrawn"
      : consent.expiresAt && consent.expiresAt <= now
        ? "expired"
        : consent.status;
    return {
      id: consent.id,
      patientId: consent.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
      mrn: patient?.mrn ?? "Unknown MRN",
      type: consent.type,
      purposeOfUse: consent.purposeOfUse,
      dataCategories: consent.dataCategories,
      grantedToOrganizationId: consent.grantedToOrganizationId,
      grantedToOrganization: consent.grantedToOrganizationId ? organizationMap.get(consent.grantedToOrganizationId) ?? "Unknown organization" : "Named user",
      signerName: consent.signerName,
      signerRelationship: consent.signerRelationship,
      source: consent.source,
      state,
      signedAt: consent.signedAt?.toISOString() ?? null,
      expiresAt: consent.expiresAt?.toISOString() ?? null,
      withdrawnAt: consent.withdrawnAt?.toISOString() ?? null,
      withdrawalReason: consent.withdrawalReason,
    };
  });
}

export type ConsentSummary = Awaited<ReturnType<typeof listConsentsForOrganization>>[number];

export async function listConsentsForPatient(organizationId: string, patientId: string): Promise<PatientConsentSummary[]> {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true } });
  if (!patient) return [];
  const consents = await db.consent.findMany({ where: { organizationId, patientId }, orderBy: { createdAt: "desc" }, take: 100 });
  const recipientIds = [...new Set(consents.map((consent) => consent.grantedToOrganizationId).filter((value): value is string => Boolean(value)))];
  const recipients = await db.organization.findMany({ where: { id: { in: recipientIds } }, select: { id: true, name: true } });
  const recipientMap = new Map(recipients.map((recipient) => [recipient.id, recipient.name]));
  const now = new Date();
  return consents.map((consent) => ({
    id: consent.id,
    type: consent.type,
    purposeOfUse: consent.purposeOfUse,
    dataCategories: consent.dataCategories,
    recipient: consent.grantedToOrganizationId ? recipientMap.get(consent.grantedToOrganizationId) ?? "Unknown organization" : consent.grantedToUserId ? "Named user" : "Internal form consent",
    signerName: consent.signerName,
    signerRelationship: consent.signerRelationship,
    status: consent.withdrawnAt || consent.status === "withdrawn" ? "withdrawn" : consent.expiresAt && consent.expiresAt <= now ? "expired" : consent.status,
    signedAt: isoConsentDate(consent.signedAt),
    expiresAt: isoConsentDate(consent.expiresAt),
    withdrawnAt: isoConsentDate(consent.withdrawnAt),
  }));
}

function isoConsentDate(value: Date | null) {
  return value?.toISOString() ?? null;
}

export async function createPatientConsent(session: ClinicSession, rawInput: unknown) {
  const input = createConsentSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" } });
    if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    const connection = await tx.networkConnection.findFirst({
      where: {
        status: "active",
        suspendedAt: null,
        OR: [
          { sourceOrganizationId: session.organizationId, targetOrganizationId: input.grantedToOrganizationId },
          { sourceOrganizationId: input.grantedToOrganizationId, targetOrganizationId: session.organizationId },
        ],
      },
    });
    if (!connection) throw new NetworkAccessError("Consent can only be granted to an active connected organization.", 403);

    const consent = await tx.consent.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        type: input.type,
        version: 1,
        purposeOfUse: input.purposeOfUse,
        dataCategories: input.dataCategories,
        grantedToOrganizationId: input.grantedToOrganizationId,
        sensitiveRestrictions: input.sensitiveRestrictions,
        source: "staff_capture",
        signerName: input.signerName,
        signerRelationship: input.signerRelationship,
        capturedBy: session.userId,
        status: "active",
        effectiveAt: now,
        signedAt: now,
        expiresAt: addDays(now, input.expiresInDays),
      },
    });
    const signatureHash = createHash("sha256").update(JSON.stringify({
      consentId: consent.id,
      patientId: patient.id,
      signerName: input.signerName,
      signedAt: now.toISOString(),
      purposeOfUse: input.purposeOfUse,
      dataCategories: input.dataCategories,
      grantedToOrganizationId: input.grantedToOrganizationId,
    })).digest("hex");
    await tx.signature.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        entityType: "consent",
        entityId: consent.id,
        signerName: input.signerName,
        signatureHash,
        context: { signerRelationship: input.signerRelationship, source: "staff_capture", syntheticDemo: session.demo },
        signedAt: now,
      },
    });
    await tx.auditLog.createMany({
      data: [
        {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "consent.captured",
          resourceType: "consent",
          resourceId: consent.id,
          patientId: patient.id,
          metadata: { purposeOfUse: input.purposeOfUse, dataCategories: input.dataCategories, grantedToOrganizationId: input.grantedToOrganizationId, expiresAt: consent.expiresAt?.toISOString() },
        },
        {
          organizationId: input.grantedToOrganizationId,
          actorId: session.userId,
          actorType: "user",
          action: "consent.received",
          resourceType: "consent",
          resourceId: consent.id,
          patientId: patient.id,
          metadata: { sourceOrganizationId: session.organizationId, purposeOfUse: input.purposeOfUse, dataCategories: input.dataCategories, expiresAt: consent.expiresAt?.toISOString() },
        },
      ],
    });
    return consent;
  });
}

export async function withdrawPatientConsent(session: ClinicSession, consentId: string, rawInput: unknown) {
  const input = withdrawConsentSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const consent = await tx.consent.findFirst({ where: { id: consentId, organizationId: session.organizationId } });
    if (!consent) throw new NetworkAccessError("Consent not found for this organization.", 404);
    if (consent.withdrawnAt || consent.status === "withdrawn") throw new NetworkAccessError("Consent has already been withdrawn.", 409);

    const withdrawn = await tx.consent.update({
      where: { id: consent.id },
      data: { status: "withdrawn", withdrawnAt: now, withdrawnBy: session.userId, withdrawalReason: input.reason },
    });
    const revoked = await tx.accessGrant.updateMany({
      where: { consentId: consent.id, revokedAt: null },
      data: { revokedAt: now, revokedBy: session.userId, revocationReason: `Consent withdrawn: ${input.reason}` },
    });
    const auditOrganizations = [...new Set([session.organizationId, consent.grantedToOrganizationId].filter((value): value is string => !!value))];
    await tx.auditLog.createMany({
      data: auditOrganizations.map((organizationId) => ({
        organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "consent.withdrawn",
        resourceType: "consent",
        resourceId: consent.id,
        patientId: consent.patientId,
        metadata: { reason: input.reason, revokedGrantCount: revoked.count, representedOrganizationId: session.organizationId },
      })),
    });
    return { consent: withdrawn, revokedGrantCount: revoked.count };
  });
}
