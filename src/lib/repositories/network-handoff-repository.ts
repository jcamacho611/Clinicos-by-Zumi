import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import {
  createNetworkHandoffSchema,
  nextNetworkHandoffStatus,
  transitionNetworkHandoffSchema,
  type NetworkHandoffAction,
} from "@/lib/network-handoff-rules";
import { isActiveNetworkRelationship, isActiveSharingAgreement } from "@/lib/network-access-rules";
import { consentAllowsAccess } from "@/lib/patient-identity-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { requireActiveAgreement, requireActiveConnection } from "@/lib/repositories/network-access-repository";
import { requireActiveAccessConsent } from "@/lib/repositories/consent-repository";

type Transaction = Prisma.TransactionClient;

const inboundVisibleStatuses = [
  "sent_connected", "sent_manual", "fax_pending", "direct_pending", "received", "acknowledged",
  "needs_clarification", "scheduled", "completed", "failed", "cancelled",
];

function requirePermission(session: ClinicSession, action: "read" | "create" | "update") {
  if (!can(session.role, "network", action)) throw new NetworkAccessError("Network handoff access is not permitted for this role.", 403);
}

function partnerId(connection: { sourceOrganizationId: string; targetOrganizationId: string }, organizationId: string) {
  return connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId;
}

function eventOrganizations(handoff: { organizationId: string; destinationOrganizationId: string | null }) {
  return handoff.destinationOrganizationId && handoff.destinationOrganizationId !== handoff.organizationId
    ? [handoff.organizationId, handoff.destinationOrganizationId]
    : [handoff.organizationId];
}

function eventRows(input: {
  handoff: { id: string; organizationId: string; destinationOrganizationId: string | null };
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return eventOrganizations(input.handoff).map((organizationId) => ({
    organizationId,
    careHandoffId: input.handoff.id,
    actorId: input.actorId,
    actorType: "user",
    action: input.action,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note: input.note,
    metadata: input.metadata,
  }));
}

function auditRows(input: {
  handoff: { id: string; organizationId: string; destinationOrganizationId: string | null; patientId: string };
  actorId: string;
  action: string;
  changes?: Prisma.InputJsonValue;
  metadata: Prisma.InputJsonValue;
}) {
  return eventOrganizations(input.handoff).map((organizationId) => ({
    organizationId,
    actorId: input.actorId,
    actorType: "user",
    action: input.action,
    resourceType: "care_handoff",
    resourceId: input.handoff.id,
    patientId: input.handoff.patientId,
    changes: input.changes,
    metadata: input.metadata,
  }));
}

async function requireSyntheticOrganization(tx: Transaction, organizationId: string) {
  const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { demoMode: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Participating organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("This handoff composer requires production review before real patient data can be used.", 409);
}

async function requireHandoffAuthority(tx: Transaction, input: {
  sourceOrganizationId: string;
  destinationOrganizationId: string;
  patientId: string;
  actorId: string;
  purposeOfUse: "treatment" | "payment" | "operations";
  dataCategories: Parameters<typeof requireActiveAgreement>[4];
}) {
  const connection = await requireActiveConnection(tx, input.sourceOrganizationId, input.destinationOrganizationId, input.purposeOfUse);
  const agreement = await requireActiveAgreement(tx, input.sourceOrganizationId, input.destinationOrganizationId, input.purposeOfUse, input.dataCategories);
  const consent = await requireActiveAccessConsent(tx, {
    sourceOrganizationId: input.sourceOrganizationId,
    patientId: input.patientId,
    requestingOrganizationId: input.destinationOrganizationId,
    requestingUserId: input.actorId,
    purposeOfUse: input.purposeOfUse,
    categories: input.dataCategories,
  });
  return { connection, agreement, consent };
}

export async function listNetworkCommandWorkspace(session: ClinicSession) {
  requirePermission(session, "read");
  const now = new Date();
  const [currentOrganization, organizations, connections, agreements, candidateHandoffs, capacities, referrals, localPatients] = await Promise.all([
    db.organization.findUnique({ where: { id: session.organizationId }, select: { id: true, name: true, clinicType: true, demoMode: true } }),
    db.organization.findMany({ where: { status: "active" }, select: { id: true, name: true, slug: true, clinicType: true, demoMode: true }, orderBy: { name: "asc" } }),
    db.networkConnection.findMany({ where: { OR: [{ sourceOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] }, orderBy: { updatedAt: "desc" } }),
    db.dataSharingAgreement.findMany({ where: { OR: [{ sourceOrganizationId: session.organizationId }, { targetOrganizationId: session.organizationId }] }, orderBy: { updatedAt: "desc" } }),
    db.careHandoff.findMany({
      where: { OR: [{ organizationId: session.organizationId, destinationOrganizationId: { not: null } }, { destinationOrganizationId: session.organizationId, status: { in: inboundVisibleStatuses } }] },
      include: { events: { where: { organizationId: session.organizationId }, orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    db.capacityListing.findMany({ where: { status: { in: ["open", "open_demo"] } }, include: { organization: { select: { id: true, name: true } }, facility: { select: { name: true } }, location: { select: { name: true } } }, orderBy: { startsAt: "asc" }, take: 100 }),
    db.referral.findMany({ where: { OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId }] }, select: { id: true, organizationId: true, destinationOrganizationId: true, status: true, deliveryStatus: true }, take: 200 }),
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
  ]);
  if (!currentOrganization) throw new NetworkAccessError("Current organization not found.", 404);

  const inboundCandidates = candidateHandoffs.filter((handoff) => handoff.organizationId !== session.organizationId);
  const inboundSourceIds = [...new Set(inboundCandidates.map((handoff) => handoff.organizationId))];
  const inboundPatientIds = [...new Set(inboundCandidates.map((handoff) => handoff.patientId))];
  const inboundConsents = inboundCandidates.length ? await db.consent.findMany({
    where: {
      organizationId: { in: inboundSourceIds },
      patientId: { in: inboundPatientIds },
      status: "active",
      withdrawnAt: null,
      OR: [{ grantedToOrganizationId: session.organizationId }, { grantedToUserId: session.userId }],
    },
  }) : [];
  const visibleInboundIds = new Set(inboundCandidates.filter((handoff) => {
    const categories = handoff.dataCategories as Parameters<typeof consentAllowsAccess>[1]["categories"];
    const purpose = handoff.purposeOfUse as "treatment" | "payment" | "operations";
    return connections.some((connection) => isActiveNetworkRelationship(connection, handoff.organizationId, session.organizationId, purpose)) &&
      agreements.some((agreement) => isActiveSharingAgreement(agreement, handoff.organizationId, session.organizationId, purpose, categories)) &&
      inboundConsents.some((consent) => consentAllowsAccess(consent, {
      sourceOrganizationId: handoff.organizationId,
      patientId: handoff.patientId,
      requestingOrganizationId: session.organizationId,
      requestingUserId: session.userId,
      purposeOfUse: purpose,
      categories,
    }));
  }).map((handoff) => handoff.id));
  const handoffs = candidateHandoffs.filter((handoff) => handoff.organizationId === session.organizationId || visibleInboundIds.has(handoff.id));
  const handoffPatientIds = [...new Set(handoffs.map((handoff) => handoff.patientId))];
  const patients = await db.patient.findMany({ where: { id: { in: handoffPatientIds } }, select: { id: true, firstName: true, lastName: true, mrn: true, organizationId: true } });

  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization]));
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const connectionIds = connections.map((connection) => connection.id);
  const handoffIds = handoffs.map((handoff) => handoff.id);
  const [locations, departments, facilities, audits] = await Promise.all([
    db.location.findMany({ where: { organizationId: { in: organizations.map((organization) => organization.id) }, status: "active" }, select: { id: true, organizationId: true, name: true, city: true, state: true, locationType: true }, orderBy: { name: "asc" } }),
    db.department.findMany({ where: { organizationId: { in: organizations.map((organization) => organization.id) }, status: "active" }, select: { id: true, organizationId: true, name: true }, orderBy: { name: "asc" } }),
    db.facility.findMany({ where: { organizationId: { in: organizations.map((organization) => organization.id) }, status: { in: ["active", "verified", "pending"] } }, select: { id: true, organizationId: true, name: true, type: true, specialty: true, status: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ where: { organizationId: session.organizationId, OR: [{ resourceType: "network_connection", resourceId: { in: connectionIds } }, { resourceType: "care_handoff", resourceId: { in: handoffIds } }] }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const agreementForPartner = (id: string) => agreements.find((agreement) => agreement.sourceOrganizationId === session.organizationId && agreement.targetOrganizationId === id);
  const activeHandoffStatuses = new Set(["sent_connected", "sent_manual", "fax_pending", "direct_pending", "received", "acknowledged", "needs_clarification", "scheduled"]);
  const failedStatuses = new Set(["failed"]);
  const partners = connections.map((connection) => {
    const id = partnerId(connection, session.organizationId);
    const organization = organizationMap.get(id);
    const partnerHandoffs = handoffs.filter((handoff) => handoff.organizationId === id || handoff.destinationOrganizationId === id);
    const partnerReferrals = referrals.filter((referral) => referral.organizationId === id || referral.destinationOrganizationId === id);
    const partnerCapacity = capacities.filter((capacity) => capacity.organizationId === id && capacity.startsAt > now);
    const agreement = agreementForPartner(id);
    return {
      id,
      connectionId: connection.id,
      name: organization?.name ?? "Unknown partner",
      slug: organization?.slug ?? "unknown",
      type: organization?.clinicType ?? "partner",
      relationshipType: connection.relationshipType,
      status: connection.status,
      trustLevel: connection.trustLevel,
      allowedPurposes: connection.allowedPurposes,
      acceptedReferralTypes: connection.acceptedReferralTypes,
      services: connection.services,
      capacityStatus: connection.capacityStatus,
      contactMethod: connection.contactMethod,
      contactDetails: connection.contactDetails,
      integrationStatus: connection.integrationStatus,
      manualFallbackMethod: connection.manualFallbackMethod,
      consentRequiredCategories: connection.consentRequiredCategories,
      locations: locations.filter((location) => location.organizationId === id),
      departments: departments.filter((department) => department.organizationId === id),
      facilities: facilities.filter((facility) => facility.organizationId === id),
      sharingAgreement: agreement ? { id: agreement.id, status: agreement.status, allowedPurposes: agreement.allowedPurposes, dataCategories: agreement.dataCategories, expiresAt: agreement.expiresAt?.toISOString() ?? null } : null,
      handoffCount: partnerHandoffs.length,
      pendingHandoffs: partnerHandoffs.filter((handoff) => activeHandoffStatuses.has(handoff.status)).length,
      failedDeliveries: partnerHandoffs.filter((handoff) => failedStatuses.has(handoff.status)).length,
      referralCount: partnerReferrals.length,
      capacityAvailable: partnerCapacity.length,
      auditHistory: audits.filter((audit) => audit.resourceId === connection.id || partnerHandoffs.some((handoff) => handoff.id === audit.resourceId)).slice(0, 12).map((audit) => ({ id: audit.id, action: audit.action, createdAt: audit.createdAt.toISOString() })),
      lastReviewedAt: connection.lastReviewedAt?.toISOString() ?? null,
    };
  });

  const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const handoffViews = handoffs.map((handoff) => {
    const patient = patientMap.get(handoff.patientId);
    return {
      id: handoff.id,
      direction: handoff.organizationId === session.organizationId ? "outbound" as const : "inbound" as const,
      sourceOrganizationId: handoff.organizationId,
      sourceOrganizationName: organizationNames.get(handoff.organizationId) ?? "Unknown clinic",
      destinationOrganizationId: handoff.destinationOrganizationId,
      destinationOrganizationName: handoff.destinationOrganizationId ? organizationNames.get(handoff.destinationOrganizationId) ?? "Unknown clinic" : "Internal",
      patientId: handoff.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Authorized synthetic patient",
      patientMrn: patient?.mrn ?? "Protected",
      category: handoff.category,
      type: handoff.type,
      purposeOfUse: handoff.purposeOfUse,
      dataCategories: handoff.dataCategories,
      requestedAction: handoff.requestedAction,
      priority: handoff.priority,
      status: handoff.status,
      deliveryMethod: handoff.deliveryMethod,
      humanReviewRequired: handoff.humanReviewRequired,
      confirmedAt: handoff.confirmedAt?.toISOString() ?? null,
      dueAt: handoff.dueAt?.toISOString() ?? null,
      scheduledAt: handoff.scheduledAt?.toISOString() ?? null,
      failureReason: handoff.failureReason,
      manualFallbackReason: handoff.manualFallbackReason,
      updatedAt: handoff.updatedAt.toISOString(),
      events: handoff.events.map((event) => ({ id: event.id, action: event.action, fromStatus: event.fromStatus, toStatus: event.toStatus, note: event.note, createdAt: event.createdAt.toISOString() })),
    };
  });

  return {
    mode: currentOrganization.demoMode ? "synthetic_demo" as const : "requires_production_review" as const,
    currentOrganization,
    partners,
    handoffs: handoffViews,
    patients: currentOrganization.demoMode ? localPatients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })) : [],
    metrics: {
      connectedPartners: partners.filter((partner) => partner.status === "active").length,
      pendingActions: handoffViews.filter((handoff) => activeHandoffStatuses.has(handoff.status)).length,
      failedDeliveries: handoffViews.filter((handoff) => handoff.status === "failed").length,
      openCapacity: capacities.filter((capacity) => capacity.startsAt > now).length,
      manualFallbacks: handoffViews.filter((handoff) => ["manual", "fax", "direct_secure_message"].includes(handoff.deliveryMethod)).length,
    },
    permissions: {
      canCreate: can(session.role, "network", "create"),
      canUpdate: can(session.role, "network", "update"),
      canManage: can(session.role, "network", "manage"),
    },
  };
}

export type NetworkCommandWorkspace = Awaited<ReturnType<typeof listNetworkCommandWorkspace>>;

export async function createNetworkHandoff(session: ClinicSession, rawInput: unknown) {
  requirePermission(session, "create");
  const input = createNetworkHandoffSchema.parse(rawInput);
  if (input.destinationOrganizationId === session.organizationId) throw new NetworkAccessError("Choose a connected partner organization.", 400);

  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(tx, session.organizationId);
    await requireSyntheticOrganization(tx, input.destinationOrganizationId);
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true } });
    if (!patient) throw new NetworkAccessError("Synthetic patient not found in this organization.", 404);
    const authority = await requireHandoffAuthority(tx, {
      sourceOrganizationId: session.organizationId,
      destinationOrganizationId: input.destinationOrganizationId,
      patientId: patient.id,
      actorId: session.userId,
      purposeOfUse: input.purposeOfUse,
      dataCategories: input.dataCategories,
    });
    const handoff = await tx.careHandoff.create({
      data: {
        organizationId: session.organizationId,
        destinationOrganizationId: input.destinationOrganizationId,
        networkConnectionId: authority.connection.id,
        patientId: patient.id,
        senderId: session.userId,
        receiverId: null,
        type: input.category,
        category: input.category,
        purposeOfUse: input.purposeOfUse,
        dataCategories: input.dataCategories,
        summary: { minimumNecessary: input.minimumNecessarySummary, syntheticDemo: true, chartPayloadShared: false },
        requestedAction: input.requestedAction,
        priority: input.priority,
        dueAt: input.dueAt,
        status: "ready_to_send",
        deliveryMethod: input.deliveryMethod,
        consentId: authority.consent.id,
        sharingAgreementId: authority.agreement.id,
        humanReviewRequired: true,
        confirmedBy: session.userId,
        confirmedAt: new Date(),
      },
    });
    await tx.careHandoffEvent.createMany({ data: eventRows({ handoff, actorId: session.userId, action: "handoff_prepared", fromStatus: "draft", toStatus: "ready_to_send", note: "Human reviewer prepared a minimum-necessary synthetic handoff.", metadata: { consentId: authority.consent.id, agreementId: authority.agreement.id, chartPayloadShared: false, syntheticDemo: true } }) });
    await tx.auditLog.createMany({ data: auditRows({ handoff, actorId: session.userId, action: "network.handoff_prepared", metadata: { destinationOrganizationId: input.destinationOrganizationId, category: input.category, deliveryMethod: input.deliveryMethod, purposeOfUse: input.purposeOfUse, dataCategories: input.dataCategories, consentId: authority.consent.id, sharingAgreementId: authority.agreement.id, humanConfirmed: true, chartPayloadShared: false } }) });
    return handoff;
  });
}

function transitionData(action: NetworkHandoffAction, now: Date, input: ReturnType<typeof transitionNetworkHandoffSchema.parse>) {
  const data: Prisma.CareHandoffUpdateInput = {};
  if (["send_connected", "send_manual", "queue_fax", "queue_direct"].includes(action)) data.sentAt = now;
  if (action === "mark_received") data.receivedAt = now;
  if (action === "acknowledge") data.acknowledgedAt = now;
  if (action === "schedule") data.scheduledAt = input.scheduledAt;
  if (action === "complete") { data.completedAt = now; data.resolvedAt = now; }
  if (action === "fail") { data.failedAt = now; data.failureReason = input.note; }
  if (action === "retry") { data.failedAt = null; data.failureReason = null; }
  if (action === "cancel") data.cancelledAt = now;
  if (["send_manual", "queue_fax", "queue_direct"].includes(action)) data.manualFallbackReason = input.note;
  return data;
}

export async function transitionNetworkHandoff(session: ClinicSession, handoffId: string, rawInput: unknown) {
  requirePermission(session, "update");
  const input = transitionNetworkHandoffSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const handoff = await tx.careHandoff.findFirst({ where: { id: handoffId, OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId, status: { in: inboundVisibleStatuses } }] } });
    if (!handoff || !handoff.destinationOrganizationId) throw new NetworkAccessError("Network handoff not found in this organization workspace.", 404);
    const direction = handoff.organizationId === session.organizationId ? "outbound" as const : "inbound" as const;
    const nextStatus = nextNetworkHandoffStatus({ status: handoff.status, deliveryMethod: handoff.deliveryMethod, direction }, input.action);
    if (!nextStatus) throw new NetworkAccessError("That action is not allowed from the current handoff state or organization.", 409);
    await requireHandoffAuthority(tx, {
      sourceOrganizationId: handoff.organizationId,
      destinationOrganizationId: handoff.destinationOrganizationId,
      patientId: handoff.patientId,
      actorId: session.userId,
      purposeOfUse: handoff.purposeOfUse as "treatment" | "payment" | "operations",
      dataCategories: handoff.dataCategories as Parameters<typeof requireActiveAgreement>[4],
    });
    const updated = await tx.careHandoff.updateMany({ where: { id: handoff.id, status: handoff.status }, data: { status: nextStatus, ...transitionData(input.action, now, input) } });
    if (updated.count !== 1) throw new NetworkAccessError("The handoff changed. Refresh and try again.", 409);

    if (["send_manual", "queue_fax", "queue_direct"].includes(input.action)) {
      await tx.task.create({ data: { organizationId: handoff.organizationId, patientId: handoff.patientId, category: "network_handoff_delivery", title: `Confirm ${handoff.deliveryMethod.replaceAll("_", " ")} delivery`, details: `handoff:${handoff.id} Manual fallback requires a documented receipt before completion.`, priority: handoff.priority === "normal" ? "normal" : "high", riskLevel: handoff.priority === "urgent" ? RiskLevel.URGENT : RiskLevel.NEEDS_STAFF, dueAt: handoff.dueAt ?? now, createdBy: session.userId } });
    }
    if (input.action === "mark_received") {
      await tx.task.updateMany({ where: { organizationId: handoff.organizationId, patientId: handoff.patientId, category: "network_handoff_delivery", status: "open", details: { contains: `handoff:${handoff.id}` } }, data: { status: "completed", completedAt: now } });
    }
    const eventHandoff = { id: handoff.id, organizationId: handoff.organizationId, destinationOrganizationId: handoff.destinationOrganizationId };
    await tx.careHandoffEvent.createMany({ data: eventRows({ handoff: eventHandoff, actorId: session.userId, action: input.action, fromStatus: handoff.status, toStatus: nextStatus, note: input.note, metadata: { representedOrganizationId: session.organizationId, deliveryMethod: handoff.deliveryMethod, humanDecision: true } }) });
    await tx.auditLog.createMany({ data: auditRows({ handoff, actorId: session.userId, action: `network.handoff_${input.action}`, changes: { status: { from: handoff.status, to: nextStatus } }, metadata: { representedOrganizationId: session.organizationId, deliveryMethod: handoff.deliveryMethod, note: input.note, humanDecision: true } }) });
    return tx.careHandoff.findUniqueOrThrow({ where: { id: handoff.id } });
  });
}
