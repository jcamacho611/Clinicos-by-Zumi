import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { reviewPatientMatchSchema, scorePatientIdentity } from "@/lib/patient-identity-rules";
import { listConsentsForOrganization } from "@/lib/repositories/consent-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function identitySnapshot(patient: {
  id: string;
  organizationId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  formerNames: string[];
  aliases: string[];
  dateOfBirth: Date;
  sexAtBirth: string | null;
  pronouns: string | null;
  phone: string | null;
  email: string | null;
}) {
  return {
    patientId: patient.id,
    organizationId: patient.organizationId,
    mrn: patient.mrn,
    firstName: patient.firstName,
    lastName: patient.lastName,
    preferredName: patient.preferredName,
    formerNames: patient.formerNames,
    aliases: patient.aliases,
    dateOfBirth: patient.dateOfBirth.toISOString(),
    sexAtBirth: patient.sexAtBirth,
    pronouns: patient.pronouns,
    phone: patient.phone,
    email: patient.email,
  };
}

async function connectedOrganizationIds(tx: Transaction, organizationId: string) {
  const connections = await tx.networkConnection.findMany({
    where: {
      status: "active",
      suspendedAt: null,
      OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }],
    },
  });
  return connections.map((connection) => connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId);
}

async function identityExchangeOrganizationIds(tx: Transaction, organizationId: string) {
  const connectedIds = await connectedOrganizationIds(tx, organizationId);
  if (!connectedIds.length) return [];
  const now = new Date();
  const agreements = await tx.dataSharingAgreement.findMany({
    where: {
      sourceOrganizationId: { in: connectedIds },
      targetOrganizationId: organizationId,
      status: { startsWith: "active" },
      dataCategories: { has: "demographics" },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }] }],
    },
  });
  return agreements
    .filter((agreement) => agreement.allowedPurposes.some((purpose) => purpose === "treatment" || purpose === "operations"))
    .map((agreement) => agreement.sourceOrganizationId);
}

export async function scanForPatientMatches(session: ClinicSession) {
  return db.$transaction(async (tx) => {
    const connectedIds = await identityExchangeOrganizationIds(tx, session.organizationId);
    const identitySelect = {
      id: true,
      organizationId: true,
      mrn: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      formerNames: true,
      aliases: true,
      dateOfBirth: true,
      sexAtBirth: true,
      pronouns: true,
      phone: true,
      email: true,
    } as const;
    const [sourcePatients, externalCandidates] = await Promise.all([
      tx.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: identitySelect }),
      tx.patient.findMany({ where: { organizationId: { in: connectedIds }, status: "active" }, select: identitySelect }),
    ]);
    let candidatesFound = 0;

    for (const source of sourcePatients) {
      for (const candidate of externalCandidates) {
        const result = scorePatientIdentity(source, candidate);
        if (result.score < 0.6) continue;
        candidatesFound += 1;
        await tx.patientMatch.upsert({
          where: { patientId_candidatePatientId: { patientId: source.id, candidatePatientId: candidate.id } },
          create: {
            organizationId: session.organizationId,
            patientId: source.id,
            candidatePatientId: candidate.id,
            confidenceScore: result.score,
            matchedFields: { matched: result.matchedFields, conflicts: result.conflictingFields, classification: result.classification },
            sourceSnapshot: identitySnapshot(source),
            candidateSnapshot: identitySnapshot(candidate),
            status: "possible",
          },
          update: {
            confidenceScore: result.score,
            matchedFields: { matched: result.matchedFields, conflicts: result.conflictingFields, classification: result.classification },
            sourceSnapshot: identitySnapshot(source),
            candidateSnapshot: identitySnapshot(candidate),
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "identity.match_scan_completed",
        resourceType: "patient_match_scan",
        resourceId: randomUUID(),
        metadata: { sourcePatientCount: sourcePatients.length, connectedOrganizationCount: connectedIds.length, candidatesFound, deterministicRules: true, minimumNecessary: true, sharingAgreementRequired: true },
      },
    });
    return { sourcePatientCount: sourcePatients.length, connectedOrganizationCount: connectedIds.length, candidatesFound };
  });
}

export async function listIdentityWorkspace(organizationId: string) {
  const [patients, matches, connections, consents, history, identityExchangeIds] = await Promise.all([
    db.patient.findMany({
      where: { organizationId, status: "active" },
      select: { id: true, mrn: true, masterPatientId: true, firstName: true, lastName: true, preferredName: true, dateOfBirth: true, phone: true, email: true, identityStatus: true, identityVerifiedAt: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.patientMatch.findMany({
      where: { organizationId },
      include: {
        patient: { include: { organization: { select: { name: true } } } },
        candidatePatient: { include: { organization: { select: { name: true } } } },
      },
      orderBy: [{ status: "asc" }, { confidenceScore: "desc" }],
      take: 50,
    }),
    db.networkConnection.findMany({
      where: { status: "active", suspendedAt: null, OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }] },
      include: { sourceOrganization: { select: { name: true } }, targetOrganization: { select: { name: true } } },
    }),
    listConsentsForOrganization(organizationId),
    db.auditLog.findMany({
      where: { organizationId, action: { startsWith: "identity." } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.$transaction((tx) => identityExchangeOrganizationIds(tx, organizationId)),
  ]);

  const masterIds = patients.map((patient) => patient.masterPatientId).filter((value): value is string => !!value);
  const locatedRecords = masterIds.length ? await db.patient.findMany({
    where: { masterPatientId: { in: masterIds }, status: "active", organizationId: { in: [organizationId, ...identityExchangeIds] } },
    include: { organization: { select: { name: true } } },
  }) : [];
  const locatorCounts = new Map<string, number>();
  for (const record of locatedRecords) locatorCounts.set(record.masterPatientId!, (locatorCounts.get(record.masterPatientId!) ?? 0) + 1);

  return {
    patients: patients.map((patient) => ({
      ...patient,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      identityVerifiedAt: patient.identityVerifiedAt?.toISOString() ?? null,
      locatedRecordCount: patient.masterPatientId ? locatorCounts.get(patient.masterPatientId) ?? 1 : 1,
    })),
    matches: matches.map((match) => ({
      id: match.id,
      source: {
        patientId: match.patient.id,
        organizationId: match.patient.organizationId,
        organization: match.patient.organization.name,
        mrn: match.patient.mrn,
        name: `${match.patient.firstName} ${match.patient.lastName}`,
        preferredName: match.patient.preferredName,
        dateOfBirth: match.patient.dateOfBirth.toISOString(),
        phone: match.patient.phone,
        email: match.patient.email,
      },
      candidate: {
        patientId: match.candidatePatient.id,
        organizationId: match.candidatePatient.organizationId,
        organization: match.candidatePatient.organization.name,
        mrn: match.candidatePatient.mrn,
        name: `${match.candidatePatient.firstName} ${match.candidatePatient.lastName}`,
        preferredName: match.candidatePatient.preferredName,
        dateOfBirth: match.candidatePatient.dateOfBirth.toISOString(),
        phone: match.candidatePatient.phone,
        email: match.candidatePatient.email,
      },
      confidenceScore: match.confidenceScore,
      matchedFields: match.matchedFields,
      status: match.status,
      reviewAction: match.reviewAction,
      decisionReason: match.decisionReason,
      masterPatientId: match.masterPatientId,
      reviewedAt: match.reviewedAt?.toISOString() ?? null,
    })),
    connections: connections.map((connection) => ({
      organizationId: connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId,
      organizationName: connection.sourceOrganizationId === organizationId ? connection.targetOrganization.name : connection.sourceOrganization.name,
    })),
    consents,
    history: history.map((event) => ({ id: event.id, action: event.action, resourceId: event.resourceId, patientId: event.patientId, metadata: event.metadata, createdAt: event.createdAt.toISOString() })),
  };
}

export type IdentityWorkspace = Awaited<ReturnType<typeof listIdentityWorkspace>>;

function selectedCandidateValue<T>(choice: "source" | "candidate" | undefined, source: T, candidate: T) {
  return choice === "candidate" ? candidate : source;
}

export async function reviewPatientMatch(session: ClinicSession, matchId: string, rawInput: unknown) {
  const input = reviewPatientMatchSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const match = await tx.patientMatch.findFirst({
      where: { id: matchId, organizationId: session.organizationId },
      include: { patient: true, candidatePatient: true },
    });
    if (!match) throw new NetworkAccessError("Patient match was not found for this organization.", 404);

    if (input.action === "not_match") {
      const candidateWasLinked = !!match.masterPatientId && match.patient.masterPatientId === match.candidatePatient.masterPatientId;
      if (candidateWasLinked) {
        await tx.patient.update({
          where: { id: match.candidatePatientId },
          data: { masterPatientId: `mpi_${randomUUID()}`, identityStatus: "separated", identityVerifiedAt: now, identityVerifiedBy: session.userId },
        });
      }
      const reviewed = await tx.patientMatch.update({
        where: { id: match.id },
        data: { status: "not_match", reviewAction: "separated", decisionReason: input.reason, reviewedBy: session.userId, reviewedAt: now },
      });
      await tx.auditLog.createMany({
        data: [match.patient.organizationId, match.candidatePatient.organizationId].map((organizationId) => ({
          organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "identity.records_separated",
          resourceType: "patient_match",
          resourceId: match.id,
          patientId: organizationId === match.patient.organizationId ? match.patientId : match.candidatePatientId,
          metadata: { reason: input.reason, representedOrganizationId: session.organizationId, candidateWasLinked },
        })),
      });
      return reviewed;
    }

    if (match.status === "confirmed") throw new NetworkAccessError("These records are already linked.", 409);
    if (match.patient.masterPatientId && match.candidatePatient.masterPatientId && match.patient.masterPatientId !== match.candidatePatient.masterPatientId) {
      throw new NetworkAccessError("Both records already belong to different master identities. A cluster-level review is required before they can be linked.", 409);
    }
    const masterPatientId = match.patient.masterPatientId ?? match.candidatePatient.masterPatientId ?? `mpi_${randomUUID()}`;
    const resolutions = input.fieldResolutions;
    const sourceOriginalName = `${match.patient.firstName} ${match.patient.lastName}`;
    const resolvedFirstName = selectedCandidateValue(resolutions.firstName, match.patient.firstName, match.candidatePatient.firstName);
    const resolvedLastName = selectedCandidateValue(resolutions.lastName, match.patient.lastName, match.candidatePatient.lastName);
    const resolvedName = `${resolvedFirstName} ${resolvedLastName}`;
    const formerNames = [...new Set([...match.patient.formerNames, ...(resolvedName !== sourceOriginalName ? [sourceOriginalName] : [])])];

    await tx.patient.update({
      where: { id: match.patientId },
      data: {
        masterPatientId,
        identityStatus: "verified_linked",
        identityVerifiedAt: now,
        identityVerifiedBy: session.userId,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        preferredName: selectedCandidateValue(resolutions.preferredName, match.patient.preferredName, match.candidatePatient.preferredName),
        phone: selectedCandidateValue(resolutions.phone, match.patient.phone, match.candidatePatient.phone),
        email: selectedCandidateValue(resolutions.email, match.patient.email, match.candidatePatient.email),
        pronouns: selectedCandidateValue(resolutions.pronouns, match.patient.pronouns, match.candidatePatient.pronouns),
        formerNames,
      },
    });
    await tx.patient.update({
      where: { id: match.candidatePatientId },
      data: { masterPatientId, identityStatus: "verified_linked", identityVerifiedAt: now, identityVerifiedBy: session.userId },
    });
    const reviewed = await tx.patientMatch.update({
      where: { id: match.id },
      data: {
        status: "confirmed",
        reviewAction: "linked",
        decisionReason: input.reason,
        masterPatientId,
        reconciliation: { fieldResolutions: resolutions, sourceOriginalName, resolvedName },
        reviewedBy: session.userId,
        reviewedAt: now,
      },
    });
    await tx.auditLog.createMany({
      data: [match.patient.organizationId, match.candidatePatient.organizationId].map((organizationId) => ({
        organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "identity.records_linked",
        resourceType: "master_patient_identity",
        resourceId: masterPatientId,
        patientId: organizationId === match.patient.organizationId ? match.patientId : match.candidatePatientId,
        changes: { fieldResolutions: resolutions },
        metadata: { patientMatchId: match.id, confidenceScore: match.confidenceScore, reason: input.reason, representedOrganizationId: session.organizationId, sourceRecordsPreserved: true },
      })),
    });
    return reviewed;
  });
}

export async function locateMasterPatientRecords(session: ClinicSession, masterPatientId: string) {
  const local = await db.patient.findFirst({ where: { organizationId: session.organizationId, masterPatientId, status: "active" } });
  if (!local) throw new NetworkAccessError("Master patient identity not found for this organization.", 404);
  const connectedIds = await db.$transaction((tx) => identityExchangeOrganizationIds(tx, session.organizationId));
  const records = await db.patient.findMany({
    where: { masterPatientId, status: "active", organizationId: { in: [session.organizationId, ...connectedIds] } },
    include: { organization: { select: { name: true } }, identifiers: { where: { status: { in: ["active", "verified"] } } } },
  });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "identity.record_locator_used",
      resourceType: "master_patient_identity",
      resourceId: masterPatientId,
      patientId: local.id,
      metadata: { representedOrganizationId: session.organizationId, locatedRecordCount: records.length, minimumNecessary: true },
    },
  });
  return records.map((record) => ({
    patientId: record.id,
    organizationId: record.organizationId,
    organization: record.organization.name,
    mrn: record.mrn,
    identityStatus: record.identityStatus,
    identifiers: record.identifiers.map((identifier) => ({ system: identifier.system, value: identifier.value, status: identifier.status })),
  }));
}
