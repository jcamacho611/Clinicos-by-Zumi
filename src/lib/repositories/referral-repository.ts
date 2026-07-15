import "server-only";

import type { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { isActiveNetworkRelationship, isActiveSharingAgreement } from "@/lib/network-access-rules";
import { consentAllowsAccess } from "@/lib/patient-identity-rules";
import {
  createReferralSchema,
  nextReferralStatus,
  transitionReferralSchema,
  type ReferralAction,
} from "@/lib/referral-rules";
import { requireActiveAccessConsent } from "@/lib/repositories/consent-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { requireActiveAgreement, requireActiveConnection } from "@/lib/repositories/network-access-repository";

type Transaction = Prisma.TransactionClient;

const inboundVisibleStatuses = [
  "sent", "received", "accepted", "declined", "scheduled", "completed", "consultation_received", "closed",
];

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1_000);
}

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function eventOrganizations(referral: { organizationId: string; destinationOrganizationId: string | null; status: string }, action: ReferralAction) {
  if (!referral.destinationOrganizationId || (referral.status === "draft" && action === "mark_ready")) {
    return [referral.organizationId];
  }
  return [referral.organizationId, referral.destinationOrganizationId];
}

async function assertSupportingDocuments(tx: Transaction, organizationId: string, patientId: string, documentIds: string[]) {
  if (!documentIds.length) return;
  const count = await tx.document.count({
    where: { id: { in: documentIds }, organizationId, patientId },
  });
  if (count !== documentIds.length) {
    throw new NetworkAccessError("Every supporting document must belong to this patient and organization.", 400);
  }
}

async function assertConnectedReferralAuthority(tx: Transaction, input: {
  sourceOrganizationId: string;
  destinationOrganizationId: string;
  patientId: string;
  actorId: string;
}) {
  await requireActiveConnection(tx, input.sourceOrganizationId, input.destinationOrganizationId, "treatment");
  await requireActiveAgreement(tx, input.sourceOrganizationId, input.destinationOrganizationId, "treatment", ["demographics", "referrals"]);
  return requireActiveAccessConsent(tx, {
    sourceOrganizationId: input.sourceOrganizationId,
    patientId: input.patientId,
    requestingOrganizationId: input.destinationOrganizationId,
    requestingUserId: input.actorId,
    purposeOfUse: "treatment",
    categories: ["demographics", "referrals"],
  });
}

function referralUpdate(action: ReferralAction, input: ReturnType<typeof transitionReferralSchema.parse>, now: Date, destinationType: string) {
  const data: Prisma.ReferralUpdateManyMutationInput = {};
  if (action === "mark_ready") data.status = "ready_to_send";
  if (action === "send") {
    data.status = "sent";
    data.deliveryStatus = "delivered";
    data.deliveryAttempts = { increment: 1 };
    data.lastDeliveryAttemptAt = now;
    data.failureReason = null;
    data.sentAt = now;
  }
  if (action === "queue_manual_delivery") {
    data.deliveryStatus = "pending_manual";
    data.deliveryAttempts = { increment: 1 };
    data.lastDeliveryAttemptAt = now;
    data.failureReason = null;
  }
  if (action === "confirm_manual_delivery") {
    data.status = "sent";
    data.deliveryStatus = "delivered";
    data.failureReason = null;
    data.sentAt = now;
  }
  if (action === "acknowledge") {
    data.status = "received";
    data.receivedAt = now;
  }
  if (action === "accept") {
    data.status = "accepted";
    data.acceptedAt = now;
  }
  if (action === "decline") {
    data.status = "declined";
    data.declinedAt = now;
    data.declineReason = input.note;
  }
  if (action === "schedule") {
    data.status = "scheduled";
    data.scheduledAt = now;
    data.appointmentAt = input.appointmentAt;
  }
  if (action === "complete") {
    data.status = "completed";
    data.completedAt = now;
  }
  if (action === "consultation_received") {
    data.status = "consultation_received";
    data.consultationNoteReceivedAt = now;
    data.consultationNoteDocumentId = input.consultationNoteDocumentId;
    data.specialistResponse = input.specialistResponse;
  }
  if (action === "record_patient_outreach") {
    data.patientOutreachStatus = "notified";
    data.patientNotifiedAt = now;
  }
  if (action === "close") {
    data.status = "closed";
    data.closedLoopAt = now;
  }
  if (action === "fail_delivery") {
    data.deliveryStatus = "failed";
    data.failureReason = input.note;
  }
  if (action === "retry_delivery") {
    data.deliveryStatus = destinationType === "connected" ? "delivered" : "pending_manual";
    data.deliveryAttempts = { increment: 1 };
    data.lastDeliveryAttemptAt = now;
    data.failureReason = null;
  }
  return data;
}

export async function listReferralWorkspace(organizationId: string, userId: string) {
  const candidateReferrals = await db.referral.findMany({
    where: {
      OR: [
        { organizationId },
        { destinationOrganizationId: organizationId, status: { in: inboundVisibleStatuses } },
      ],
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });
  const inboundCandidates = candidateReferrals.filter((referral) => referral.destinationOrganizationId === organizationId && referral.organizationId !== organizationId);
  const inboundSourceIds = [...new Set(inboundCandidates.map((referral) => referral.organizationId))];
  const inboundPatientIds = [...new Set(inboundCandidates.map((referral) => referral.patientId))];
  const [inboundConnections, inboundAgreements, inboundConsents] = inboundCandidates.length ? await Promise.all([
    db.networkConnection.findMany({
      where: {
        OR: [
          { sourceOrganizationId: organizationId, targetOrganizationId: { in: inboundSourceIds } },
          { sourceOrganizationId: { in: inboundSourceIds }, targetOrganizationId: organizationId },
        ],
      },
    }),
    db.dataSharingAgreement.findMany({ where: { sourceOrganizationId: { in: inboundSourceIds }, targetOrganizationId: organizationId } }),
    db.consent.findMany({
      where: {
        organizationId: { in: inboundSourceIds },
        patientId: { in: inboundPatientIds },
        status: "active",
        withdrawnAt: null,
        OR: [{ grantedToOrganizationId: organizationId }, { grantedToUserId: userId }],
      },
    }),
  ]) : [[], [], []];
  const visibleInboundIds = new Set(inboundCandidates.filter((referral) =>
    inboundConnections.some((connection) => isActiveNetworkRelationship(connection, referral.organizationId, organizationId, "treatment")) &&
    inboundAgreements.some((agreement) => isActiveSharingAgreement(agreement, referral.organizationId, organizationId, "treatment", ["demographics", "referrals"])) &&
    inboundConsents.some((consent) => consentAllowsAccess(consent, {
      sourceOrganizationId: referral.organizationId,
      patientId: referral.patientId,
      requestingOrganizationId: organizationId,
      requestingUserId: userId,
      purposeOfUse: "treatment",
      categories: ["demographics", "referrals"],
    })),
  ).map((referral) => referral.id));
  const referrals = candidateReferrals.filter((referral) => referral.organizationId === organizationId || visibleInboundIds.has(referral.id));
  const patientIds = [...new Set(referrals.map((referral) => referral.patientId))];
  const organizationIds = [...new Set(referrals.flatMap((referral) => [referral.organizationId, referral.destinationOrganizationId].filter((value): value is string => !!value)))];
  const referralIds = referrals.map((referral) => referral.id);
  const now = new Date();
  const [patients, organizations, events, localPatients, agreements] = await Promise.all([
    db.patient.findMany({ where: { id: { in: patientIds } }, select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true, organizationId: true } }),
    db.organization.findMany({ where: { id: { in: organizationIds } }, select: { id: true, name: true } }),
    db.referralEvent.findMany({ where: { organizationId, referralId: { in: referralIds } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.dataSharingAgreement.findMany({
      where: {
        sourceOrganizationId: organizationId,
        status: { startsWith: "active" },
        allowedPurposes: { has: "treatment" },
        dataCategories: { hasEvery: ["demographics", "referrals"] },
        OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      select: { targetOrganizationId: true },
    }),
  ]);
  const eligibleDestinationIds = [...new Set(agreements.map((agreement) => agreement.targetOrganizationId))];
  const [destinations, facilities] = await Promise.all([
    db.organization.findMany({ where: { id: { in: eligibleDestinationIds }, status: "active" }, select: { id: true, name: true, clinicType: true }, orderBy: { name: "asc" } }),
    db.facility.findMany({ where: { organizationId: { in: eligibleDestinationIds }, status: "verified" }, select: { id: true, organizationId: true, name: true, specialty: true }, orderBy: { name: "asc" } }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization.name]));

  return {
    referrals: referrals.map((referral) => {
      const patient = patientMap.get(referral.patientId);
      const direction = referral.organizationId === organizationId ? "outbound" as const : "inbound" as const;
      return {
        ...referral,
        direction,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        sourceOrganizationName: organizationMap.get(referral.organizationId) ?? "Unknown clinic",
        destinationName: referral.destinationOrganizationId
          ? organizationMap.get(referral.destinationOrganizationId) ?? referral.destination ?? "Connected clinic"
          : referral.destination ?? "External destination",
        createdAt: referral.createdAt.toISOString(),
        updatedAt: referral.updatedAt.toISOString(),
        sentAt: iso(referral.sentAt),
        receivedAt: iso(referral.receivedAt),
        acceptedAt: iso(referral.acceptedAt),
        scheduledAt: iso(referral.scheduledAt),
        appointmentAt: iso(referral.appointmentAt),
        completedAt: iso(referral.completedAt),
        consultationNoteReceivedAt: iso(referral.consultationNoteReceivedAt),
        closedLoopAt: iso(referral.closedLoopAt),
        followUpDueAt: iso(referral.followUpDueAt),
        lastDeliveryAttemptAt: iso(referral.lastDeliveryAttemptAt),
      };
    }),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    localPatients: localPatients.map((patient) => ({ ...patient, name: `${patient.firstName} ${patient.lastName}` })),
    destinations,
    facilities,
  };
}

export type ReferralWorkspace = Awaited<ReturnType<typeof listReferralWorkspace>>;

export async function createReferral(session: ClinicSession, rawInput: unknown) {
  const input = createReferralSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" } });
    if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    if (input.encounterId) {
      const encounter = await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId: session.organizationId, patientId: patient.id } });
      if (!encounter) throw new NetworkAccessError("The selected encounter does not belong to this patient.", 400);
    }
    await assertSupportingDocuments(tx, session.organizationId, patient.id, input.supportingDocumentIds);

    const destinationType = input.deliveryMethod === "connected_network" ? "connected" : "external";
    let destination = input.destinationName ?? null;
    let consentId: string | null = null;
    if (destinationType === "connected") {
      if (input.destinationOrganizationId === session.organizationId) throw new NetworkAccessError("Choose a different clinic for a connected referral.", 400);
      const destinationOrganization = await tx.organization.findFirst({ where: { id: input.destinationOrganizationId, status: "active" } });
      if (!destinationOrganization) throw new NetworkAccessError("Connected destination not found.", 404);
      if (input.destinationFacilityId) {
        const facility = await tx.facility.findFirst({ where: { id: input.destinationFacilityId, organizationId: destinationOrganization.id, status: "verified" } });
        if (!facility) throw new NetworkAccessError("The selected facility is not verified for that clinic.", 400);
        destination = facility.name;
      } else {
        destination = destinationOrganization.name;
      }
      const consent = await assertConnectedReferralAuthority(tx, {
        sourceOrganizationId: session.organizationId,
        destinationOrganizationId: destinationOrganization.id,
        patientId: patient.id,
        actorId: session.userId,
      });
      consentId = consent.id;
    }

    const order = await tx.clinicalOrder.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        encounterId: input.encounterId,
        type: "referral",
        details: { specialty: input.specialty, reason: input.reason, clinicalQuestion: input.clinicalQuestion, priority: input.priority },
        status: "ordered",
        orderedAt: now,
      },
    });
    const referral = await tx.referral.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        encounterId: input.encounterId,
        orderId: order.id,
        specialty: input.specialty,
        destination,
        destinationType,
        destinationOrganizationId: input.destinationOrganizationId,
        destinationFacilityId: input.destinationFacilityId,
        reason: input.reason,
        clinicalQuestion: input.clinicalQuestion,
        priority: input.priority,
        authorizationStatus: input.authorizationStatus,
        deliveryMethod: input.deliveryMethod,
        supportingDocumentIds: input.supportingDocumentIds,
        followUpDueAt: addDays(now, input.followUpInDays),
        createdBy: session.userId,
        provenance: { source: "clinicos", sourceOrganizationId: session.organizationId, consentId, syntheticDemo: session.demo },
      },
    });
    await tx.referralEvent.create({
      data: { organizationId: session.organizationId, referralId: referral.id, actorId: session.userId, eventType: "created", toStatus: "draft", deliveryMethod: referral.deliveryMethod, metadata: { orderId: order.id } },
    });
    await tx.auditLog.create({
      data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "referral.created", resourceType: "referral", resourceId: referral.id, patientId: patient.id, metadata: { destinationType, destinationOrganizationId: referral.destinationOrganizationId, deliveryMethod: referral.deliveryMethod, consentId } },
    });
    return referral;
  });
}

export async function transitionReferral(session: ClinicSession, referralId: string, rawInput: unknown) {
  const input = transitionReferralSchema.parse(rawInput);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const referral = await tx.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { organizationId: session.organizationId },
          { destinationOrganizationId: session.organizationId, status: { in: inboundVisibleStatuses } },
        ],
      },
    });
    if (!referral) throw new NetworkAccessError("Referral not found in this organization workspace.", 404);
    const direction = referral.organizationId === session.organizationId ? "outbound" as const : "inbound" as const;
    const nextStatus = nextReferralStatus({ status: referral.status, deliveryStatus: referral.deliveryStatus, destinationType: referral.destinationType, direction }, input.action);
    if (!nextStatus) throw new NetworkAccessError("That referral action is not allowed from the current state or organization.", 409);

    if ((direction === "inbound" || input.action === "send" || (input.action === "retry_delivery" && referral.destinationType === "connected")) && referral.destinationOrganizationId) {
      await assertConnectedReferralAuthority(tx, {
        sourceOrganizationId: referral.organizationId,
        destinationOrganizationId: referral.destinationOrganizationId,
        patientId: referral.patientId,
        actorId: session.userId,
      });
    }
    if (input.consultationNoteDocumentId) {
      const documentCount = await tx.document.count({ where: { id: input.consultationNoteDocumentId, organizationId: session.organizationId, patientId: referral.patientId } });
      if (documentCount !== 1) throw new NetworkAccessError("The consultation document is not available to this organization.", 400);
    }

    const update = await tx.referral.updateMany({
      where: { id: referral.id, status: referral.status, deliveryStatus: referral.deliveryStatus },
      data: { ...referralUpdate(input.action, input, now, referral.destinationType), ...(input.action === "close" ? { closedBy: session.userId } : {}) },
    });
    if (update.count !== 1) throw new NetworkAccessError("The referral changed. Refresh and try again.", 409);

    const orderStatusByAction: Partial<Record<ReferralAction, string>> = {
      mark_ready: "ready_to_send",
      send: "sent",
      confirm_manual_delivery: "sent",
      accept: "accepted",
      decline: "declined",
      schedule: "scheduled",
      complete: "completed",
      consultation_received: "result_received",
      close: "closed",
    };
    if (referral.orderId && orderStatusByAction[input.action]) {
      await tx.clinicalOrder.updateMany({
        where: { id: referral.orderId, organizationId: referral.organizationId, patientId: referral.patientId },
        data: { status: orderStatusByAction[input.action] },
      });
    }

    if (input.action === "queue_manual_delivery" || (input.action === "retry_delivery" && referral.destinationType === "external")) {
      await tx.task.create({
        data: { organizationId: referral.organizationId, patientId: referral.patientId, category: "referral_delivery", title: `Complete ${referral.deliveryMethod.replaceAll("_", " ")} referral delivery`, details: `Referral ${referral.id} to ${referral.destination ?? "external destination"}. Confirm delivery only after staff verifies receipt.`, ownerId: referral.assignedTo, priority: referral.priority === "routine" ? "normal" : "high", dueAt: now, createdBy: session.userId },
      });
    }
    if (input.action === "confirm_manual_delivery") {
      await tx.task.updateMany({ where: { organizationId: referral.organizationId, patientId: referral.patientId, category: "referral_delivery", status: "open", details: { contains: referral.id } }, data: { status: "completed", completedAt: now } });
    }
    if (input.action === "send" || input.action === "confirm_manual_delivery") {
      await tx.task.create({
        data: { organizationId: referral.organizationId, patientId: referral.patientId, category: "referral_follow_up", title: `Follow up on ${referral.specialty} referral`, details: `Referral ${referral.id} to ${referral.destination ?? "receiving clinic"}. Confirm scheduling, completion, consultation return, and patient outreach.`, ownerId: referral.assignedTo, priority: referral.priority === "routine" ? "normal" : "high", dueAt: referral.followUpDueAt, createdBy: session.userId },
      });
    }
    if (input.action === "close") {
      await tx.task.updateMany({ where: { organizationId: referral.organizationId, patientId: referral.patientId, category: "referral_follow_up", status: "open", details: { contains: referral.id } }, data: { status: "completed", completedAt: now } });
    }
    if (input.action === "decline") {
      await tx.task.create({
        data: { organizationId: referral.organizationId, patientId: referral.patientId, category: "referral_follow_up", title: `Redirect declined ${referral.specialty} referral`, details: `Referral ${referral.id} was declined. Review the reason, contact the patient, and select another destination.`, priority: "high", dueAt: now, createdBy: session.userId },
      });
    }
    if (input.action === "fail_delivery") {
      await tx.escalation.create({
        data: { organizationId: referral.organizationId, patientId: referral.patientId, sourceType: "referral", sourceId: referral.id, category: "failed_referral_delivery", riskLevel: referral.priority === "stat" ? "URGENT" : "NEEDS_STAFF", assignedTeam: "referral_coordination" },
      });
    }
    if (input.action === "retry_delivery") {
      await tx.escalation.updateMany({ where: { organizationId: referral.organizationId, sourceType: "referral", sourceId: referral.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: "Delivery retry initiated through the configured pathway." } });
    }

    const auditOrganizationIds = eventOrganizations(referral, input.action);
    await tx.referralEvent.createMany({
      data: auditOrganizationIds.map((organizationId) => ({ organizationId, referralId: referral.id, actorId: session.userId, eventType: input.action, fromStatus: referral.status, toStatus: nextStatus, deliveryMethod: referral.deliveryMethod, note: input.note, metadata: { representedOrganizationId: session.organizationId, direction, appointmentAt: input.appointmentAt?.toISOString(), consultationNoteDocumentId: input.consultationNoteDocumentId } })),
    });
    await tx.auditLog.createMany({
      data: auditOrganizationIds.map((organizationId) => ({ organizationId, actorId: session.userId, actorType: "user", action: `referral.${input.action}`, resourceType: "referral", resourceId: referral.id, patientId: referral.patientId, changes: { status: { from: referral.status, to: nextStatus }, deliveryStatus: { from: referral.deliveryStatus, action: input.action } }, metadata: { representedOrganizationId: session.organizationId, direction, destinationType: referral.destinationType, deliveryMethod: referral.deliveryMethod } })),
    });
    return tx.referral.findUniqueOrThrow({ where: { id: referral.id } });
  });
}
