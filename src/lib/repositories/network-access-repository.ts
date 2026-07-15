import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { requireActiveAccessConsent } from "@/lib/repositories/consent-repository";
import {
  BREAK_GLASS_TTL_MINUTES,
  breakGlassRequestSchema,
  createRecordRequestSchema,
  getAccessGrantState,
  grantAllowsAccess,
  isActiveNetworkRelationship,
  isActiveSharingAgreement,
  roleAllowsSharedCategories,
  reviewRecordRequestSchema,
  type NetworkPurpose,
  type ShareableCategory,
} from "@/lib/network-access-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function requirePatientSource(tx: Transaction, sourceOrganizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({
    where: { id: patientId, organizationId: sourceOrganizationId, status: "active" },
    select: { id: true, firstName: true, lastName: true, mrn: true, organizationId: true },
  });
  if (!patient) throw new NetworkAccessError("The requested patient was not found in the source organization.", 404);
  return patient;
}

async function requireActiveConnection(
  tx: Transaction,
  sourceOrganizationId: string,
  requestingOrganizationId: string,
  purpose: NetworkPurpose,
) {
  const connections = await tx.networkConnection.findMany({
    where: {
      OR: [
        { sourceOrganizationId, targetOrganizationId: requestingOrganizationId },
        { sourceOrganizationId: requestingOrganizationId, targetOrganizationId: sourceOrganizationId },
      ],
    },
  });
  const connection = connections.find((candidate) => isActiveNetworkRelationship(
    candidate,
    sourceOrganizationId,
    requestingOrganizationId,
    purpose,
  ));
  if (!connection) throw new NetworkAccessError("No active clinic relationship permits this purpose of use.", 403);
  return connection;
}

async function requireActiveAgreement(
  tx: Transaction,
  sourceOrganizationId: string,
  requestingOrganizationId: string,
  purpose: NetworkPurpose,
  categories: ShareableCategory[],
  now = new Date(),
) {
  const agreements = await tx.dataSharingAgreement.findMany({
    where: { sourceOrganizationId, targetOrganizationId: requestingOrganizationId },
  });
  const agreement = agreements.find((candidate) => isActiveSharingAgreement(
    candidate,
    sourceOrganizationId,
    requestingOrganizationId,
    purpose,
    categories,
    now,
  ));
  if (!agreement) throw new NetworkAccessError("The sharing agreement does not permit every requested data category.", 403);
  return agreement;
}

function auditRows(input: {
  sourceOrganizationId: string;
  requestingOrganizationId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId: string;
  metadata: Prisma.InputJsonValue;
}) {
  const base = {
    actorId: input.actorId,
    actorType: "user",
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    patientId: input.patientId,
    metadata: input.metadata,
  };
  return input.sourceOrganizationId === input.requestingOrganizationId
    ? [{ organizationId: input.sourceOrganizationId, ...base }]
    : [
        { organizationId: input.sourceOrganizationId, ...base },
        { organizationId: input.requestingOrganizationId, ...base },
      ];
}

export async function listNetworkAccessWorkspace(organizationId: string) {
  const [requests, grants, agreements, wallets, history] = await Promise.all([
    db.recordRequest.findMany({
      where: { OR: [{ requestingOrganizationId: organizationId }, { receivingOrganizationId: organizationId }] },
      include: {
        patient: { select: { firstName: true, lastName: true, mrn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    db.accessGrant.findMany({
      where: { OR: [{ organizationId }, { granteeOrganizationId: organizationId }] },
      include: {
        patient: { select: { firstName: true, lastName: true, mrn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    db.dataSharingAgreement.findMany({
      where: { OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }] },
      include: {
        sourceOrganization: { select: { name: true } },
        targetOrganization: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.consentWallet.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true, mrn: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.auditLog.findMany({
      where: {
        organizationId,
        action: { in: [
          "network.record_requested",
          "network.record_request_approved",
          "network.record_request_denied",
          "network.record_read",
          "network.break_glass_started",
          "network.access_revoked",
        ] },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const organizationIds = new Set<string>([organizationId]);
  for (const request of requests) {
    organizationIds.add(request.requestingOrganizationId);
    organizationIds.add(request.receivingOrganizationId);
  }
  for (const grant of grants) {
    organizationIds.add(grant.organizationId);
    if (grant.granteeOrganizationId) organizationIds.add(grant.granteeOrganizationId);
  }
  const organizations = await db.organization.findMany({
    where: { id: { in: [...organizationIds] } },
    select: { id: true, name: true },
  });
  const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const now = new Date();

  return {
    requests: requests.map((request) => ({
      id: request.id,
      patientId: request.patientId,
      patientName: `${request.patient.firstName} ${request.patient.lastName}`,
      mrn: request.patient.mrn,
      requester: organizationNames.get(request.requestingOrganizationId) ?? "Unknown organization",
      receiver: organizationNames.get(request.receivingOrganizationId) ?? "Unknown organization",
      direction: request.requestingOrganizationId === organizationId ? "outbound" : "inbound",
      purposeOfUse: request.purposeOfUse,
      dataCategories: request.dataCategories,
      status: request.status,
      deliveryStatus: request.deliveryStatus,
      decisionReason: request.decisionReason,
      createdAt: request.createdAt.toISOString(),
    })),
    grants: grants.map((grant) => ({
      id: grant.id,
      patientId: grant.patientId,
      patientName: `${grant.patient.firstName} ${grant.patient.lastName}`,
      mrn: grant.patient.mrn,
      source: organizationNames.get(grant.organizationId) ?? "Unknown organization",
      sourceOrganizationId: grant.organizationId,
      grantee: grant.granteeOrganizationId ? organizationNames.get(grant.granteeOrganizationId) ?? "Unknown organization" : "Named user",
      granteeOrganizationId: grant.granteeOrganizationId,
      direction: grant.organizationId === organizationId ? "granted" : "received",
      purposeOfUse: grant.purposeOfUse,
      dataCategories: grant.dataCategories,
      accessLevel: grant.accessLevel,
      consentId: grant.consentId,
      reason: grant.reason,
      state: getAccessGrantState(grant, now),
      expiresAt: grant.expiresAt?.toISOString() ?? null,
      downloadAllowed: grant.downloadAllowed,
      printAllowed: grant.printAllowed,
    })),
    agreements: agreements.map((agreement) => ({
      id: agreement.id,
      source: agreement.sourceOrganization.name,
      sourceOrganizationId: agreement.sourceOrganizationId,
      target: agreement.targetOrganization.name,
      targetOrganizationId: agreement.targetOrganizationId,
      status: agreement.status,
      allowedPurposes: agreement.allowedPurposes,
      dataCategories: agreement.dataCategories,
      expiresAt: agreement.expiresAt?.toISOString() ?? null,
    })),
    wallets: wallets.map((wallet) => ({
      id: wallet.id,
      patientName: `${wallet.patient.firstName} ${wallet.patient.lastName}`,
      mrn: wallet.patient.mrn,
      emergencyPreference: wallet.emergencyPreference,
      sharingDefaults: wallet.sharingDefaults,
      status: wallet.recoveryStatus,
    })),
    history: history.map((event) => ({
      id: event.id,
      action: event.action,
      actorId: event.actorId,
      patientId: event.patientId,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export type NetworkAccessWorkspace = Awaited<ReturnType<typeof listNetworkAccessWorkspace>>;

export async function createRecordRequest(session: ClinicSession, rawInput: unknown) {
  const input = createRecordRequestSchema.parse(rawInput);
  if (input.sourceOrganizationId === session.organizationId) {
    throw new NetworkAccessError("Use the local patient chart for records owned by your organization.", 400);
  }

  return db.$transaction(async (tx) => {
    const patient = await requirePatientSource(tx, input.sourceOrganizationId, input.patientId);
    await requireActiveConnection(tx, input.sourceOrganizationId, session.organizationId, input.purposeOfUse);
    await requireActiveAgreement(tx, input.sourceOrganizationId, session.organizationId, input.purposeOfUse, input.dataCategories);

    const duplicate = await tx.recordRequest.findFirst({
      where: {
        patientId: input.patientId,
        requestingOrganizationId: session.organizationId,
        receivingOrganizationId: input.sourceOrganizationId,
        purposeOfUse: input.purposeOfUse,
        status: "requested",
      },
    });
    if (duplicate) throw new NetworkAccessError("A matching request is already awaiting review.", 409);

    const request = await tx.recordRequest.create({
      data: {
        organizationId: input.sourceOrganizationId,
        patientId: input.patientId,
        requestingOrganizationId: session.organizationId,
        receivingOrganizationId: input.sourceOrganizationId,
        purposeOfUse: input.purposeOfUse,
        dataCategories: input.dataCategories,
        requestedBy: session.userId,
      },
    });
    await tx.auditLog.createMany({
      data: auditRows({
        sourceOrganizationId: input.sourceOrganizationId,
        requestingOrganizationId: session.organizationId,
        actorId: session.userId,
        action: "network.record_requested",
        resourceType: "record_request",
        resourceId: request.id,
        patientId: patient.id,
        metadata: {
          representedOrganizationId: session.organizationId,
          purposeOfUse: input.purposeOfUse,
          dataCategories: input.dataCategories,
          minimumNecessary: true,
        },
      }),
    });
    return request;
  });
}

export async function reviewRecordRequest(session: ClinicSession, requestId: string, rawInput: unknown) {
  const input = reviewRecordRequestSchema.parse(rawInput);
  const now = new Date();

  return db.$transaction(async (tx) => {
    const request = await tx.recordRequest.findFirst({
      where: { id: requestId, receivingOrganizationId: session.organizationId },
    });
    if (!request) throw new NetworkAccessError("Record request not found for this organization.", 404);
    if (request.status !== "requested") throw new NetworkAccessError("This record request has already been reviewed.", 409);

    if (input.decision === "deny") {
      const denied = await tx.recordRequest.update({
        where: { id: request.id },
        data: {
          status: "denied",
          deliveryStatus: "not_started",
          decisionReason: input.reason,
          reviewedBy: session.userId,
          reviewedAt: now,
        },
      });
      await tx.auditLog.createMany({
        data: auditRows({
          sourceOrganizationId: request.receivingOrganizationId,
          requestingOrganizationId: request.requestingOrganizationId,
          actorId: session.userId,
          action: "network.record_request_denied",
          resourceType: "record_request",
          resourceId: request.id,
          patientId: request.patientId,
          metadata: { reason: input.reason, representedOrganizationId: session.organizationId },
        }),
      });
      return { request: denied, grant: null };
    }

    await requireActiveConnection(tx, request.receivingOrganizationId, request.requestingOrganizationId, request.purposeOfUse as NetworkPurpose);
    await requireActiveAgreement(
      tx,
      request.receivingOrganizationId,
      request.requestingOrganizationId,
      request.purposeOfUse as NetworkPurpose,
      request.dataCategories as ShareableCategory[],
      now,
    );
    const consent = await requireActiveAccessConsent(tx, {
      sourceOrganizationId: request.receivingOrganizationId,
      patientId: request.patientId,
      requestingOrganizationId: request.requestingOrganizationId,
      purposeOfUse: request.purposeOfUse as NetworkPurpose,
      categories: request.dataCategories as ShareableCategory[],
      now,
    });
    const grant = await tx.accessGrant.create({
      data: {
        organizationId: request.receivingOrganizationId,
        patientId: request.patientId,
        granteeOrganizationId: request.requestingOrganizationId,
        purposeOfUse: request.purposeOfUse,
        dataCategories: request.dataCategories,
        accessLevel: "read_only",
        requestId: request.id,
        reason: input.reason,
        approvedBy: session.userId,
        approvedAt: now,
        startsAt: now,
        expiresAt: addDays(now, input.expiresInDays),
        downloadAllowed: false,
        printAllowed: false,
        consentId: consent.id,
        createdBy: session.userId,
      },
    });
    const approved = await tx.recordRequest.update({
      where: { id: request.id },
      data: {
        status: "approved",
        deliveryStatus: "ready",
        decisionReason: input.reason,
        approvedGrantId: grant.id,
        reviewedBy: session.userId,
        reviewedAt: now,
      },
    });
    await tx.auditLog.createMany({
      data: auditRows({
        sourceOrganizationId: request.receivingOrganizationId,
        requestingOrganizationId: request.requestingOrganizationId,
        actorId: session.userId,
        action: "network.record_request_approved",
        resourceType: "access_grant",
        resourceId: grant.id,
        patientId: request.patientId,
        metadata: {
          recordRequestId: request.id,
          representedOrganizationId: session.organizationId,
          purposeOfUse: request.purposeOfUse,
          dataCategories: request.dataCategories,
          expiresAt: grant.expiresAt?.toISOString(),
          downloadAllowed: false,
          printAllowed: false,
        },
      }),
    });
    return { request: approved, grant };
  });
}

export async function startBreakGlassAccess(session: ClinicSession, rawInput: unknown) {
  const input = breakGlassRequestSchema.parse(rawInput);
  if (input.sourceOrganizationId === session.organizationId) {
    throw new NetworkAccessError("Emergency network access is only for records held by another organization.", 400);
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BREAK_GLASS_TTL_MINUTES * 60 * 1000);

  return db.$transaction(async (tx) => {
    const patient = await requirePatientSource(tx, input.sourceOrganizationId, input.patientId);
    await requireActiveConnection(tx, input.sourceOrganizationId, session.organizationId, "treatment");
    const wallet = await tx.consentWallet.findFirst({
      where: { organizationId: input.sourceOrganizationId, patientId: input.patientId },
    });
    if (!wallet?.emergencyPreference?.startsWith("allow_break_glass")) {
      throw new NetworkAccessError("The patient consent wallet does not permit break-glass access.", 403);
    }

    const grant = await tx.accessGrant.create({
      data: {
        organizationId: input.sourceOrganizationId,
        patientId: input.patientId,
        granteeOrganizationId: session.organizationId,
        granteeUserId: session.userId,
        purposeOfUse: "treatment",
        dataCategories: input.dataCategories,
        accessLevel: "break_glass",
        reason: input.reason,
        approvedBy: session.userId,
        approvedAt: now,
        startsAt: now,
        expiresAt,
        downloadAllowed: false,
        printAllowed: false,
        createdBy: session.userId,
      },
    });
    await tx.auditLog.createMany({
      data: auditRows({
        sourceOrganizationId: input.sourceOrganizationId,
        requestingOrganizationId: session.organizationId,
        actorId: session.userId,
        action: "network.break_glass_started",
        resourceType: "access_grant",
        resourceId: grant.id,
        patientId: patient.id,
        metadata: {
          reason: input.reason,
          representedOrganizationId: session.organizationId,
          purposeOfUse: "treatment",
          dataCategories: input.dataCategories,
          expiresAt: expiresAt.toISOString(),
          emergencyAccessAlert: true,
          downloadAllowed: false,
          printAllowed: false,
        },
      }),
    });
    return grant;
  });
}

export async function revokeNetworkAccess(session: ClinicSession, grantId: string, reason: string) {
  const normalizedReason = reason.trim();
  if (normalizedReason.length < 8) throw new NetworkAccessError("A revocation reason of at least 8 characters is required.", 400);
  const grant = await db.accessGrant.findFirst({
    where: {
      id: grantId,
      revokedAt: null,
      OR: [{ organizationId: session.organizationId }, { granteeOrganizationId: session.organizationId }],
    },
  });
  if (!grant) throw new NetworkAccessError("Active access grant not found for this organization.", 404);

  const revokedAt = new Date();
  return db.$transaction(async (tx) => {
    const revoked = await tx.accessGrant.update({
      where: { id: grant.id },
      data: { revokedAt, revokedBy: session.userId, revocationReason: normalizedReason },
    });
    await tx.auditLog.createMany({
      data: auditRows({
        sourceOrganizationId: grant.organizationId,
        requestingOrganizationId: grant.granteeOrganizationId ?? grant.organizationId,
        actorId: session.userId,
        action: "network.access_revoked",
        resourceType: "access_grant",
        resourceId: grant.id,
        patientId: grant.patientId,
        metadata: { reason: normalizedReason, representedOrganizationId: session.organizationId },
      }),
    });
    return revoked;
  });
}

async function loadSharedRecord(sourceOrganizationId: string, patientId: string, categories: ShareableCategory[]) {
  const wants = (category: ShareableCategory) => categories.includes(category);
  const [patient, allergies, medications, problems, encounters, labs, imaging, referrals, carePlans, immunizations] = await Promise.all([
    db.patient.findFirst({
      where: { id: patientId, organizationId: sourceOrganizationId, status: "active" },
      select: { id: true, mrn: true, firstName: true, lastName: true, dateOfBirth: true, sexAtBirth: true, pronouns: true, preferredLanguage: true },
    }),
    wants("allergies") ? db.allergy.findMany({ where: { organizationId: sourceOrganizationId, patientId, status: "active" }, select: { substance: true, reaction: true, severity: true, status: true } }) : Promise.resolve([]),
    wants("medications") ? db.medication.findMany({ where: { organizationId: sourceOrganizationId, patientId, status: "active" }, select: { name: true, dose: true, route: true, frequency: true, startDate: true, status: true } }) : Promise.resolve([]),
    wants("problems") ? db.problem.findMany({ where: { organizationId: sourceOrganizationId, patientId, status: "active" }, select: { code: true, label: true, onsetDate: true, status: true } }) : Promise.resolve([]),
    wants("approved_visit_summary") ? db.encounter.findMany({
      where: { organizationId: sourceOrganizationId, patientId, status: { in: ["SIGNED", "LOCKED"] } },
      select: { id: true, type: true, serviceDate: true, status: true, assessment: true, plan: true, patientInstructions: true, followUpPlan: true, signedAt: true },
      orderBy: { serviceDate: "desc" }, take: 10,
    }) : Promise.resolve([]),
    wants("labs") ? db.labResult.findMany({
      where: { organizationId: sourceOrganizationId, patientId, patientVisible: true, releasedAt: { not: null } },
      select: { id: true, panelName: true, vendor: true, collectedAt: true, resultedAt: true, abnormal: true, releasedAt: true },
      orderBy: { resultedAt: "desc" }, take: 20,
    }) : Promise.resolve([]),
    wants("imaging") ? db.imagingResult.findMany({
      where: { organizationId: sourceOrganizationId, patientId, patientVisible: true, releasedAt: { not: null } },
      select: { id: true, facility: true, status: true, releasedAt: true, reportDocumentId: true },
      orderBy: { releasedAt: "desc" }, take: 20,
    }) : Promise.resolve([]),
    wants("referrals") ? db.referral.findMany({ where: { organizationId: sourceOrganizationId, patientId }, select: { id: true, specialty: true, destination: true, reason: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 20 }) : Promise.resolve([]),
    wants("care_plans") ? db.carePlan.findMany({ where: { organizationId: sourceOrganizationId, patientId, status: "active" }, select: { id: true, title: true, goals: true, interventions: true, status: true, updatedAt: true } }) : Promise.resolve([]),
    wants("immunizations") ? db.immunization.findMany({ where: { organizationId: sourceOrganizationId, patientId }, select: { vaccine: true, cvxCode: true, administeredAt: true, status: true }, orderBy: { administeredAt: "desc" } }) : Promise.resolve([]),
  ]);
  if (!patient) throw new NetworkAccessError("The shared patient record is no longer available.", 404);

  return {
    demographics: wants("demographics") ? patient : undefined,
    allergies: wants("allergies") ? allergies : undefined,
    medications: wants("medications") ? medications : undefined,
    problems: wants("problems") ? problems : undefined,
    approvedVisitSummaries: wants("approved_visit_summary") ? encounters : undefined,
    labs: wants("labs") ? labs : undefined,
    imaging: wants("imaging") ? imaging : undefined,
    referrals: wants("referrals") ? referrals : undefined,
    carePlans: wants("care_plans") ? carePlans : undefined,
    immunizations: wants("immunizations") ? immunizations : undefined,
  };
}

export async function readSharedPatientRecord(session: ClinicSession, input: {
  sourceOrganizationId: string;
  patientId: string;
  purposeOfUse: NetworkPurpose;
  categories: ShareableCategory[];
}) {
  if (input.sourceOrganizationId === session.organizationId) {
    throw new NetworkAccessError("Use the organization-scoped patient API for local records.", 400);
  }
  if (!roleAllowsSharedCategories(session.role, input.purposeOfUse, input.categories)) {
    throw new NetworkAccessError("Your role does not permit every requested shared-record category.", 403);
  }
  const now = new Date();
  await db.$transaction(async (tx) => {
    await requirePatientSource(tx, input.sourceOrganizationId, input.patientId);
    await requireActiveConnection(tx, input.sourceOrganizationId, session.organizationId, input.purposeOfUse);
  });
  const grants = await db.accessGrant.findMany({
    where: {
      organizationId: input.sourceOrganizationId,
      patientId: input.patientId,
      revokedAt: null,
      OR: [{ granteeOrganizationId: session.organizationId }, { granteeUserId: session.userId }],
    },
    orderBy: { createdAt: "desc" },
  });
  const grant = grants.find((candidate) => grantAllowsAccess(candidate, {
    sourceOrganizationId: input.sourceOrganizationId,
    requestingOrganizationId: session.organizationId,
    requestingUserId: session.userId,
    patientId: input.patientId,
    purpose: input.purposeOfUse,
    categories: input.categories,
    now,
  }));
  if (!grant) throw new NetworkAccessError("No active grant covers this purpose and every requested data category.", 403);

  if (grant.accessLevel !== "break_glass") {
    await db.$transaction(async (tx) => {
      await requireActiveAgreement(
        tx,
        input.sourceOrganizationId,
        session.organizationId,
        input.purposeOfUse,
        input.categories,
        now,
      );
      await requireActiveAccessConsent(tx, {
        consentId: grant.consentId,
        sourceOrganizationId: input.sourceOrganizationId,
        patientId: input.patientId,
        requestingOrganizationId: session.organizationId,
        requestingUserId: session.userId,
        purposeOfUse: input.purposeOfUse,
        categories: input.categories,
        now,
      });
    });
  }

  const data = await loadSharedRecord(input.sourceOrganizationId, input.patientId, input.categories);
  const accessReceiptId = randomUUID();
  const auditData = auditRows({
    sourceOrganizationId: input.sourceOrganizationId,
    requestingOrganizationId: session.organizationId,
    actorId: session.userId,
    action: "network.record_read",
    resourceType: "access_receipt",
    resourceId: accessReceiptId,
    patientId: input.patientId,
    metadata: {
      accessGrantId: grant.id,
      representedOrganizationId: session.organizationId,
      purposeOfUse: input.purposeOfUse,
      dataCategories: input.categories,
      informationAccessed: input.categories,
      accessLevel: grant.accessLevel,
      downloadAllowed: grant.downloadAllowed,
      printAllowed: grant.printAllowed,
    },
  });
  await db.$transaction([
    db.auditLog.createMany({ data: auditData }),
    ...(grant.requestId ? [db.recordRequest.updateMany({
      where: { id: grant.requestId, deliveredAt: null },
      data: { deliveryStatus: "delivered", deliveredAt: now },
    })] : []),
  ]);

  return {
    accessReceiptId,
    sourceOrganizationId: input.sourceOrganizationId,
    representedOrganizationId: session.organizationId,
    purposeOfUse: input.purposeOfUse,
    dataCategories: input.categories,
    accessLevel: grant.accessLevel,
    expiresAt: grant.expiresAt?.toISOString() ?? null,
    downloadAllowed: grant.downloadAllowed,
    printAllowed: grant.printAllowed,
    provenance: { source: "ClinicOS connected-care network", accessGrantId: grant.id, accessedAt: now.toISOString() },
    data,
  };
}

export async function listPatientAccessHistory(organizationId: string, patientId: string) {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId }, select: { id: true } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);

  const events = await db.auditLog.findMany({
    where: {
      organizationId,
      patientId,
      action: { in: ["network.record_requested", "network.record_request_approved", "network.record_request_denied", "network.record_read", "network.break_glass_started", "network.access_revoked"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return events.map((event) => ({
    id: event.id,
    action: event.action,
    actorId: event.actorId,
    actorType: event.actorType,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    metadata: event.metadata,
    createdAt: event.createdAt.toISOString(),
  }));
}
