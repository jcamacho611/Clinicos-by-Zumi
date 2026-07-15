import "server-only";

import type { Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  correctImagingResultSchema,
  createImagingOrderSchema,
  createImagingResultSchema,
  imagingResultActionRequiresProviderIdentity,
  nextImagingOrderStatus,
  nextImagingResultStatus,
  transitionImagingOrderSchema,
  transitionImagingResultSchema,
  type ImagingOrderAction,
} from "@/lib/imaging-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import type { PatientImagingResult } from "@/lib/types";

type Transaction = Prisma.TransactionClient;
const activeIntegrationStatuses = ["active", "connected"];

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function normalizeAuthorizationStatus(value: string) {
  const status = value.toLowerCase().replaceAll(" ", "_");
  if (["approved", "pending", "denied", "expired"].includes(status)) return status;
  return "pending";
}

async function requireImagingIntegration(tx: Transaction, organizationId: string, integrationId: string) {
  const integration = await tx.integration.findFirst({
    where: { id: integrationId, organizationId, type: "imaging", status: { in: activeIntegrationStatuses } },
  });
  if (!integration) throw new NetworkAccessError("The imaging adapter is not active for this organization.", 409);
  return integration;
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireClinicalSigner(tx: Transaction, session: ClinicSession) {
  if (!can(session.role, "imaging", "sign")) {
    throw new NetworkAccessError("Imaging provider-signing permission is required for this action.", 403);
  }
  const provider = await tx.provider.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId, status: "active" },
    select: { id: true, name: true, credential: true },
  });
  if (!provider) throw new NetworkAccessError("An active provider identity in this organization is required for clinical imaging sign-off.", 403);
  return provider;
}

async function createReportReviewWork(tx: Transaction, input: {
  organizationId: string;
  patientId: string;
  resultId: string;
  reportTitle: string;
  urgent: boolean;
  createdBy: string;
}) {
  await tx.task.create({
    data: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: "imaging_review",
      title: `${input.urgent ? "Urgent-source" : "New"} imaging report requires provider review`,
      details: `${input.reportTitle} report ${input.resultId}. Review the source report, document clinical follow-up, and explicitly approve any patient release.`,
      priority: input.urgent ? "urgent" : "high",
      riskLevel: input.urgent ? "URGENT" : "NEEDS_PROVIDER",
      dueAt: new Date(),
      createdBy: input.createdBy,
    },
  });
  if (!input.urgent) return;
  await tx.escalation.create({
    data: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      sourceType: "imaging_result",
      sourceId: input.resultId,
      category: "urgent_imaging_source_flag",
      riskLevel: "URGENT",
      assignedTeam: "clinical_provider",
    },
  });
  const recipients = await tx.user.findMany({
    where: { organizationId: input.organizationId, status: "active", roleKey: { in: ["clinic_owner", "provider"] } },
    select: { id: true },
  });
  if (recipients.length) {
    await tx.notification.createMany({
      data: recipients.map((recipient) => ({
        organizationId: input.organizationId,
        userId: recipient.id,
        type: "urgent_imaging_source_flag",
        title: "Imaging report requires urgent human review",
        body: `${input.reportTitle} carries an urgent flag from the source. ClinicOS has not interpreted the report.`,
      })),
    });
  }
}

export async function listImagingWorkspace(organizationId: string) {
  const [orders, results, patients, providers, integrations, sourceDocuments, priorAuthorizations] = await Promise.all([
    db.imagingOrder.findMany({ where: { organizationId }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 }),
    db.imagingResult.findMany({ where: { organizationId }, orderBy: [{ urgentSourceFlag: "desc" }, { studyPerformedAt: "desc" }, { receivedAt: "desc" }], take: 100 }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId, status: "active" }, select: { id: true, name: true, credential: true, userId: true }, orderBy: { name: "asc" } }),
    db.integration.findMany({ where: { organizationId, type: "imaging" }, select: { id: true, vendor: true, status: true, phase: true, lastSyncAt: true }, orderBy: { vendor: "asc" } }),
    db.document.findMany({ where: { organizationId, patientId: { not: null }, mimeType: "application/pdf" }, select: { id: true, patientId: true, name: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.priorAuthorization.findMany({ where: { organizationId }, select: { id: true, patientId: true, payer: true, service: true, referenceNumber: true, status: true, expiresAt: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  const orderIds = orders.map((order) => order.id);
  const resultIds = results.map((result) => result.id);
  const [events, integrationEvents] = await Promise.all([
    db.imagingEvent.findMany({ where: { organizationId, OR: [{ imagingOrderId: { in: orderIds } }, { imagingResultId: { in: resultIds } }] }, orderBy: { createdAt: "desc" }, take: 250 }),
    db.integrationEvent.findMany({ where: { organizationId, resourceType: { in: ["imaging_order", "imaging_result"] }, resourceId: { in: [...orderIds, ...resultIds] } }, orderBy: { occurredAt: "desc" }, take: 100 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const orderMap = new Map(orders.map((order) => [order.id, order]));

  return {
    orders: orders.map((order) => {
      const patient = patientMap.get(order.patientId);
      const provider = order.providerId ? providerMap.get(order.providerId) : undefined;
      return {
        ...order,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        providerName: provider ? `${provider.name}, ${provider.credential}` : "Unassigned provider",
        orderedAt: iso(order.orderedAt),
        readyAt: iso(order.readyAt),
        transmittedAt: iso(order.transmittedAt),
        scheduledAt: iso(order.scheduledAt),
        completedAt: iso(order.completedAt),
        reportReceivedAt: iso(order.reportReceivedAt),
        lastDeliveryAttemptAt: iso(order.lastDeliveryAttemptAt),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    }),
    results: results.map((result) => {
      const patient = patientMap.get(result.patientId);
      const order = result.orderId ? orderMap.get(result.orderId) : undefined;
      const provider = order?.providerId ? providerMap.get(order.providerId) : undefined;
      return {
        ...result,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        study: order?.study ?? result.reportTitle,
        modality: order?.modality ?? "other",
        bodyPart: order?.bodyPart ?? "Not specified",
        orderingProviderName: provider ? `${provider.name}, ${provider.credential}` : "Unlinked report",
        studyPerformedAt: iso(result.studyPerformedAt),
        receivedAt: result.receivedAt.toISOString(),
        reviewedAt: iso(result.reviewedAt),
        releaseApprovedAt: iso(result.releaseApprovedAt),
        releasedAt: iso(result.releasedAt),
        patientNotifiedAt: iso(result.patientNotifiedAt),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    }),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    integrationEvents: integrationEvents.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString() })),
    patients: patients.map((patient) => ({ ...patient, name: `${patient.firstName} ${patient.lastName}` })),
    providers: providers.map((provider) => ({ ...provider, label: `${provider.name}, ${provider.credential}` })),
    integrations: integrations.map((integration) => ({ ...integration, active: activeIntegrationStatuses.includes(integration.status), lastSyncAt: iso(integration.lastSyncAt) })),
    sourceDocuments,
    priorAuthorizations: priorAuthorizations.map((authorization) => ({ ...authorization, expiresAt: iso(authorization.expiresAt) })),
  };
}

export type ImagingWorkspace = Awaited<ReturnType<typeof listImagingWorkspace>>;

export async function listImagingResultsForPatient(patientId: string, organizationId: string): Promise<PatientImagingResult[]> {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true } });
  if (!patient) return [];
  const results = await db.imagingResult.findMany({ where: { organizationId, patientId }, orderBy: [{ studyPerformedAt: "desc" }, { receivedAt: "desc" }, { version: "desc" }], take: 100 });
  const orderIds = results.flatMap((result) => result.orderId ? [result.orderId] : []);
  const orders = orderIds.length ? await db.imagingOrder.findMany({ where: { organizationId, patientId, id: { in: orderIds } } }) : [];
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  return results.map((result) => {
    const order = result.orderId ? orderMap.get(result.orderId) : undefined;
    return {
      id: result.id,
      patientId: result.patientId,
      title: result.reportTitle,
      study: order?.study ?? result.reportTitle,
      modality: order?.modality ?? "other",
      bodyPart: order?.bodyPart ?? "Not specified",
      facility: result.facility ?? order?.facility ?? "Unknown source",
      source: result.sourceType.replaceAll("_", " "),
      sourceReference: result.sourceReference,
      findings: result.findings,
      impression: result.impression,
      imageReference: result.imageReference,
      studyPerformedAt: iso(result.studyPerformedAt) ?? result.receivedAt.toISOString(),
      status: result.status,
      urgentSourceFlag: result.urgentSourceFlag,
      patientVisible: result.patientVisible,
      version: result.version,
      correctionOfId: result.correctionOfId,
    };
  });
}

export async function createImagingOrder(session: ClinicSession, rawInput: unknown) {
  const input = createImagingOrderSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    const provider = await tx.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" } });
    if (!provider) throw new NetworkAccessError("Ordering provider not found for this organization.", 404);
    if (input.encounterId) {
      const encounter = await tx.encounter.findFirst({ where: { id: input.encounterId, organizationId: session.organizationId, patientId: patient.id } });
      if (!encounter) throw new NetworkAccessError("The selected encounter does not belong to this patient.", 400);
    }
    const diagnosisRows = await Promise.all(input.diagnosisCodes.map(async (code) => ({
      code,
      exists: (await tx.diagnosis.count({ where: { organizationId: session.organizationId, patientId: patient.id, code } })) > 0
        || (await tx.problem.count({ where: { organizationId: session.organizationId, patientId: patient.id, code } })) > 0,
    })));
    const missingCodes = diagnosisRows.filter((row) => !row.exists).map((row) => row.code);
    if (missingCodes.length) throw new NetworkAccessError(`Diagnosis codes are not attached to this patient: ${missingCodes.join(", ")}.`, 400);
    let authorizationStatus = input.authorizationStatus;
    if (input.priorAuthorizationId) {
      const authorization = await tx.priorAuthorization.findFirst({ where: { id: input.priorAuthorizationId, organizationId: session.organizationId, patientId: patient.id } });
      if (!authorization) throw new NetworkAccessError("The prior authorization does not belong to this patient.", 400);
      authorizationStatus = normalizeAuthorizationStatus(authorization.status) as typeof authorizationStatus;
    }
    let integration = null;
    if (input.deliveryMethod === "electronic_adapter") integration = await requireImagingIntegration(tx, session.organizationId, input.integrationId!);
    const clinicalOrder = await tx.clinicalOrder.create({ data: { organizationId: session.organizationId, patientId: patient.id, encounterId: input.encounterId, providerId: provider.id, type: "imaging", details: { study: input.study, modality: input.modality, bodyPart: input.bodyPart, laterality: input.laterality, diagnosisCodes: input.diagnosisCodes, clinicalIndication: input.clinicalIndication, priority: input.priority, facility: input.facility }, status: "draft" } });
    const order = await tx.imagingOrder.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        encounterId: input.encounterId,
        providerId: provider.id,
        clinicalOrderId: clinicalOrder.id,
        priorAuthorizationId: input.priorAuthorizationId,
        integrationId: integration?.id,
        study: input.study,
        modality: input.modality,
        bodyPart: input.bodyPart,
        laterality: input.laterality === "none" ? null : input.laterality,
        diagnosisCodes: input.diagnosisCodes,
        clinicalIndication: input.clinicalIndication,
        priority: input.priority,
        facility: input.facility,
        authorizationStatus,
        deliveryMethod: input.deliveryMethod,
        createdBy: session.userId,
        provenance: { source: "clinicos", createdBy: session.userId, syntheticDemo: session.demo },
      },
    });
    await tx.imagingEvent.create({ data: { organizationId: session.organizationId, imagingOrderId: order.id, actorId: session.userId, eventType: "created", toStatus: "draft", metadata: { clinicalOrderId: clinicalOrder.id, authorizationStatus } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "imaging_order.created", resourceType: "imaging_order", resourceId: order.id, patientId: patient.id, metadata: { providerId: provider.id, deliveryMethod: order.deliveryMethod, authorizationStatus, integrationId: order.integrationId } } });
    return order;
  });
}

function imagingOrderTransitionData(action: ImagingOrderAction, order: { deliveryMethod: string }, now: Date, note?: string, scheduledAt?: Date, completedAt?: Date): Prisma.ImagingOrderUpdateManyMutationInput {
  if (action === "mark_ready") return { status: "ready_to_send", readyAt: now, orderedAt: now };
  if (["queue_delivery", "retry_delivery"].includes(action)) return { status: order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send", deliveryStatus: order.deliveryMethod === "electronic_adapter" ? "queued" : "pending_manual", deliveryAttempts: { increment: 1 }, lastDeliveryAttemptAt: now, failureReason: null };
  if (action === "confirm_delivery") return { status: "sent", deliveryStatus: "delivered", transmittedAt: now, failureReason: null };
  if (action === "mark_scheduled") return { status: "scheduled", appointmentStatus: "scheduled", scheduledAt };
  if (action === "mark_completed") return { status: "completed", appointmentStatus: "completed", completedAt };
  if (action === "fail_delivery") return { deliveryStatus: "failed", failureReason: note };
  if (action === "cancel") return { status: "cancelled", appointmentStatus: "cancelled", cancelledAt: now, failureReason: note };
  return {};
}

export async function transitionImagingOrder(session: ClinicSession, imagingOrderId: string, rawInput: unknown) {
  const input = transitionImagingOrderSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const order = await tx.imagingOrder.findFirst({ where: { id: imagingOrderId, organizationId: session.organizationId } });
    if (!order) throw new NetworkAccessError("Imaging order not found for this organization.", 404);
    const nextStatus = nextImagingOrderStatus(order, input.action);
    if (!nextStatus) throw new NetworkAccessError("That imaging order action is not allowed from the current state or authorization status.", 409);
    if (order.deliveryMethod === "electronic_adapter" && order.integrationId) await requireImagingIntegration(tx, session.organizationId, order.integrationId);
    const now = new Date();
    const update = await tx.imagingOrder.updateMany({ where: { id: order.id, organizationId: session.organizationId, status: order.status, deliveryStatus: order.deliveryStatus }, data: imagingOrderTransitionData(input.action, order, now, input.note, input.scheduledAt, input.completedAt) });
    if (update.count !== 1) throw new NetworkAccessError("The imaging order changed. Refresh and try again.", 409);
    const clinicalStatus: Partial<Record<ImagingOrderAction, string>> = { mark_ready: "ordered", confirm_delivery: "sent", mark_scheduled: "scheduled", mark_completed: "completed", cancel: "cancelled" };
    if (order.clinicalOrderId && clinicalStatus[input.action]) await tx.clinicalOrder.updateMany({ where: { id: order.clinicalOrderId, organizationId: session.organizationId }, data: { status: clinicalStatus[input.action] } });
    if (["queue_delivery", "retry_delivery"].includes(input.action)) {
      if (order.deliveryMethod === "electronic_adapter") {
        await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: order.integrationId, resourceType: "imaging_order", resourceId: order.id, direction: "outbound", eventType: input.action, status: "queued", retryCount: Math.max(order.deliveryAttempts, input.action === "retry_delivery" ? 1 : 0), metadata: { facility: order.facility, noLiveTransmissionClaim: true } } });
      } else {
        await tx.task.create({ data: { organizationId: session.organizationId, patientId: order.patientId, category: "imaging_delivery", title: `Complete ${order.deliveryMethod} imaging order delivery`, details: `Order ${order.id} to ${order.facility ?? "external imaging facility"}. Confirm only after staff verifies delivery.`, priority: order.priority === "routine" ? "normal" : "high", dueAt: now, createdBy: session.userId } });
      }
    }
    if (input.action === "confirm_delivery") {
      await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: order.patientId, category: "imaging_delivery", status: "open", details: { contains: order.id } }, data: { status: "completed", completedAt: now } });
      if (order.deliveryMethod === "electronic_adapter") await tx.integrationEvent.updateMany({ where: { organizationId: session.organizationId, resourceType: "imaging_order", resourceId: order.id, status: { in: ["queued", "sent"] } }, data: { status: "acknowledged", acknowledgmentCode: "RECORDED_BY_AUTHORIZED_USER" } });
    }
    if (input.action === "fail_delivery") {
      await tx.escalation.create({ data: { organizationId: session.organizationId, patientId: order.patientId, sourceType: "imaging_order", sourceId: order.id, category: "failed_imaging_delivery", riskLevel: order.priority === "stat" ? "URGENT" : "NEEDS_STAFF", assignedTeam: "imaging_coordination" } });
      await tx.integrationEvent.updateMany({ where: { organizationId: session.organizationId, resourceType: "imaging_order", resourceId: order.id, status: { in: ["queued", "sent"] } }, data: { status: "failed", errorMessage: input.note } });
    }
    if (input.action === "retry_delivery") await tx.escalation.updateMany({ where: { organizationId: session.organizationId, sourceType: "imaging_order", sourceId: order.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: "Authorized imaging delivery retry started." } });
    await tx.imagingEvent.create({ data: { organizationId: session.organizationId, imagingOrderId: order.id, actorId: session.userId, eventType: input.action, fromStatus: order.status, toStatus: nextStatus, note: input.note, metadata: { deliveryStatusBefore: order.deliveryStatus, deliveryMethod: order.deliveryMethod } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `imaging_order.${input.action}`, resourceType: "imaging_order", resourceId: order.id, patientId: order.patientId, changes: { status: { from: order.status, to: nextStatus }, deliveryStatus: { from: order.deliveryStatus, action: input.action } }, metadata: { note: input.note, scheduledAt: iso(input.scheduledAt), completedAt: iso(input.completedAt) } } });
    return tx.imagingOrder.findFirstOrThrow({ where: { id: order.id, organizationId: session.organizationId } });
  });
}

export async function createImagingResult(session: ClinicSession, rawInput: unknown) {
  const input = createImagingResultSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    let order = null;
    if (input.orderId) {
      order = await tx.imagingOrder.findFirst({ where: { id: input.orderId, organizationId: session.organizationId, patientId: patient.id } });
      if (!order) throw new NetworkAccessError("The imaging order does not belong to this patient.", 400);
      if (order.status !== "completed") throw new NetworkAccessError("Record study completion before receiving the report.", 409);
    }
    let integration = null;
    if (input.sourceType === "electronic_interface") integration = await requireImagingIntegration(tx, session.organizationId, input.integrationId!);
    if (input.reportDocumentId) {
      const document = await tx.document.findFirst({ where: { id: input.reportDocumentId, organizationId: session.organizationId, patientId: patient.id, mimeType: "application/pdf" } });
      if (!document) throw new NetworkAccessError("The report document does not belong to this patient and organization.", 400);
    }
    const result = await tx.imagingResult.create({ data: { organizationId: session.organizationId, patientId: patient.id, orderId: order?.id, integrationId: integration?.id ?? order?.integrationId, reportDocumentId: input.reportDocumentId, facility: input.facility ?? order?.facility, reportTitle: input.reportTitle, sourceType: input.sourceType, sourceReference: input.sourceReference, findings: input.findings, impression: input.impression, imageReference: input.imageReference, studyPerformedAt: input.studyPerformedAt, urgentSourceFlag: input.urgentSourceFlag, provenance: { source: input.sourceType, sourceReference: input.sourceReference, reportDocumentId: input.reportDocumentId, enteredBy: session.userId, syntheticDemo: session.demo } } });
    if (order) {
      await tx.imagingOrder.updateMany({ where: { id: order.id, organizationId: session.organizationId, status: order.status }, data: { status: "report_received", reportReceivedAt: new Date() } });
      if (order.clinicalOrderId) await tx.clinicalOrder.updateMany({ where: { id: order.clinicalOrderId, organizationId: session.organizationId }, data: { status: "result_received" } });
    }
    if (input.sourceType === "electronic_interface") await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: integration?.id, resourceType: "imaging_result", resourceId: result.id, direction: "inbound", eventType: "report_received", status: "acknowledged", acknowledgmentCode: "STRUCTURED_REPORT_ACCEPTED", metadata: { sourceReference: input.sourceReference } } });
    await createReportReviewWork(tx, { organizationId: session.organizationId, patientId: patient.id, resultId: result.id, reportTitle: result.reportTitle, urgent: result.urgentSourceFlag, createdBy: session.userId });
    await tx.imagingEvent.create({ data: { organizationId: session.organizationId, imagingOrderId: order?.id, imagingResultId: result.id, actorId: session.userId, eventType: "report_received", toStatus: "needs_review", metadata: { urgentSourceFlag: result.urgentSourceFlag, sourceType: result.sourceType } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "imaging_result.received", resourceType: "imaging_result", resourceId: result.id, patientId: patient.id, metadata: { orderId: order?.id, sourceType: result.sourceType, reportDocumentId: result.reportDocumentId, urgentSourceFlag: result.urgentSourceFlag } } });
    return result;
  });
}

export async function transitionImagingResult(session: ClinicSession, imagingResultId: string, rawInput: unknown) {
  const input = transitionImagingResultSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    if (imagingResultActionRequiresProviderIdentity(input.action)) await requireClinicalSigner(tx, session);
    const result = await tx.imagingResult.findFirst({ where: { id: imagingResultId, organizationId: session.organizationId } });
    if (!result) throw new NetworkAccessError("Imaging report not found for this organization.", 404);
    const nextStatus = nextImagingResultStatus(result.status, input.action);
    if (!nextStatus) throw new NetworkAccessError("That imaging report action is not allowed from the current state.", 409);
    const now = new Date();
    const data: Prisma.ImagingResultUpdateManyMutationInput = {};
    if (input.action === "review") Object.assign(data, { status: "reviewed", reviewComments: input.note, reviewedBy: session.userId, reviewedAt: now });
    if (input.action === "release") Object.assign(data, { status: "released", releaseApprovedBy: session.userId, releaseApprovedAt: now, patientVisible: true, releasedAt: now, patientNotificationStatus: "pending" });
    if (input.action === "notify_patient") Object.assign(data, { patientNotificationStatus: "notified", patientNotifiedAt: now });
    const update = await tx.imagingResult.updateMany({ where: { id: result.id, organizationId: session.organizationId, status: result.status }, data: Object.keys(data).length ? data : { updatedAt: now } });
    if (update.count !== 1) throw new NetworkAccessError("The imaging report changed. Refresh and try again.", 409);
    if (input.action === "review") {
      await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: result.patientId, category: "imaging_review", status: "open", details: { contains: result.id } }, data: { status: "completed", completedAt: now } });
      await tx.escalation.updateMany({ where: { organizationId: session.organizationId, sourceType: "imaging_result", sourceId: result.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: "Active provider documented source report review. ClinicOS did not interpret the report." } });
    }
    if (input.action === "create_follow_up") await tx.task.create({ data: { organizationId: session.organizationId, patientId: result.patientId, category: "imaging_follow_up", title: `Follow up on ${result.reportTitle}`, details: input.note, priority: result.urgentSourceFlag ? "urgent" : "high", riskLevel: result.urgentSourceFlag ? "URGENT" : "NEEDS_PROVIDER", dueAt: input.followUpDueAt, createdBy: session.userId } });
    await tx.imagingEvent.create({ data: { organizationId: session.organizationId, imagingResultId: result.id, actorId: session.userId, eventType: input.action, fromStatus: result.status, toStatus: nextStatus, note: input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `imaging_result.${input.action}`, resourceType: "imaging_result", resourceId: result.id, patientId: result.patientId, changes: { status: { from: result.status, to: nextStatus } }, metadata: { note: input.note, followUpDueAt: iso(input.followUpDueAt) } } });
    return tx.imagingResult.findFirstOrThrow({ where: { id: result.id, organizationId: session.organizationId } });
  });
}

export async function correctImagingResult(session: ClinicSession, imagingResultId: string, rawInput: unknown) {
  const input = correctImagingResultSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireClinicalSigner(tx, session);
    const original = await tx.imagingResult.findFirst({ where: { id: imagingResultId, organizationId: session.organizationId } });
    if (!original) throw new NetworkAccessError("Imaging report not found for this organization.", 404);
    if (original.status === "corrected") throw new NetworkAccessError("This report version has already been corrected.", 409);
    const update = await tx.imagingResult.updateMany({ where: { id: original.id, organizationId: session.organizationId, status: original.status }, data: { status: "corrected", patientVisible: false } });
    if (update.count !== 1) throw new NetworkAccessError("The imaging report changed. Refresh and try again.", 409);
    const correction = await tx.imagingResult.create({ data: { organizationId: session.organizationId, patientId: original.patientId, orderId: original.orderId, integrationId: original.integrationId, reportDocumentId: original.reportDocumentId, facility: original.facility, reportTitle: input.reportTitle, sourceType: "structured_manual", sourceReference: input.sourceReference, findings: input.findings, impression: input.impression, imageReference: input.imageReference, studyPerformedAt: input.studyPerformedAt, urgentSourceFlag: input.urgentSourceFlag, correctionOfId: original.id, correctionReason: input.reason, version: original.version + 1, provenance: { source: "provider_correction", correctionOfId: original.id, correctedBy: session.userId } } });
    await createReportReviewWork(tx, { organizationId: session.organizationId, patientId: original.patientId, resultId: correction.id, reportTitle: correction.reportTitle, urgent: correction.urgentSourceFlag, createdBy: session.userId });
    await tx.imagingEvent.createMany({ data: [
      { organizationId: session.organizationId, imagingResultId: original.id, actorId: session.userId, eventType: "corrected", fromStatus: original.status, toStatus: "corrected", note: input.reason, metadata: { replacementResultId: correction.id } },
      { organizationId: session.organizationId, imagingResultId: correction.id, actorId: session.userId, eventType: "correction_created", toStatus: "needs_review", note: input.reason, metadata: { correctionOfId: original.id, version: correction.version } },
    ] });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "imaging_result.corrected", resourceType: "imaging_result", resourceId: original.id, patientId: original.patientId, changes: { status: { from: original.status, to: "corrected" }, replacementResultId: correction.id }, metadata: { reason: input.reason, replacementVersion: correction.version, previouslyPatientVisible: original.patientVisible } } });
    return correction;
  });
}
