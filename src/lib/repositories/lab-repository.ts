import "server-only";

import type { Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  correctLabResultSchema,
  createLabOrderSchema,
  createLabResultSchema,
  labResultActionRequiresProviderIdentity,
  nextLabOrderStatus,
  nextLabResultStatus,
  summarizeLabFlags,
  transitionLabOrderSchema,
  transitionLabResultSchema,
  type LabOrderAction,
} from "@/lib/lab-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import type { LabResult } from "@/lib/types";

type Transaction = Prisma.TransactionClient;

const activeIntegrationStatuses = ["active", "connected"];

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asTests(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.filter((item): item is { name: string; loincCode?: string } => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    return typeof (item as { name?: unknown }).name === "string";
  }) : [];
}

async function requireLabIntegration(tx: Transaction, organizationId: string, integrationId: string) {
  const integration = await tx.integration.findFirst({
    where: { id: integrationId, organizationId, type: "lab", status: { in: activeIntegrationStatuses } },
  });
  if (!integration) throw new NetworkAccessError("The laboratory adapter is not active for this organization.", 409);
  return integration;
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireClinicalSigner(tx: Transaction, session: ClinicSession) {
  if (!can(session.role, "labs", "sign")) {
    throw new NetworkAccessError("Laboratory provider-signing permission is required for this action.", 403);
  }
  const provider = await tx.provider.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId, status: "active" },
    select: { id: true, name: true, credential: true },
  });
  if (!provider) {
    throw new NetworkAccessError("An active provider identity in this organization is required for clinical laboratory sign-off.", 403);
  }
  return provider;
}

async function createResultReviewWork(tx: Transaction, input: {
  organizationId: string;
  patientId: string;
  resultId: string;
  panelName: string;
  critical: boolean;
  createdBy: string;
}) {
  await tx.task.create({
    data: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: "lab_review",
      title: `${input.critical ? "Critical" : "New"} lab result requires provider review`,
      details: `${input.panelName} result ${input.resultId}. Review source data, document clinical follow-up, and explicitly approve any patient release.`,
      priority: input.critical ? "urgent" : "high",
      riskLevel: input.critical ? "URGENT" : "NEEDS_PROVIDER",
      dueAt: new Date(),
      createdBy: input.createdBy,
    },
  });

  if (!input.critical) return;
  await tx.escalation.create({
    data: {
      organizationId: input.organizationId,
      patientId: input.patientId,
      sourceType: "lab_result",
      sourceId: input.resultId,
      category: "critical_lab_result",
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
        type: "critical_lab_result",
        title: "Critical result requires immediate human review",
        body: `${input.panelName} is flagged critical by source data. ClinicOS has not interpreted the result.`,
      })),
    });
  }
}

export async function listLabWorkspace(organizationId: string) {
  const [orders, results, patients, providers, integrations, sourceDocuments] = await Promise.all([
    db.labOrder.findMany({ where: { organizationId }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 }),
    db.labResult.findMany({ where: { organizationId }, orderBy: [{ critical: "desc" }, { resultedAt: "desc" }, { createdAt: "desc" }], take: 100 }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId, status: "active" }, select: { id: true, name: true, credential: true }, orderBy: { name: "asc" } }),
    db.integration.findMany({ where: { organizationId, type: "lab" }, select: { id: true, vendor: true, status: true, phase: true, lastSyncAt: true }, orderBy: { vendor: "asc" } }),
    db.document.findMany({ where: { organizationId, patientId: { not: null } }, select: { id: true, patientId: true, name: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const resultIds = results.map((result) => result.id);
  const orderIds = orders.map((order) => order.id);
  const [items, events, integrationEvents] = await Promise.all([
    db.labResultItem.findMany({ where: { organizationId, labResultId: { in: resultIds } }, orderBy: [{ labResultId: "asc" }, { sequence: "asc" }] }),
    db.labEvent.findMany({ where: { organizationId, OR: [{ labOrderId: { in: orderIds } }, { labResultId: { in: resultIds } }] }, orderBy: { createdAt: "desc" }, take: 250 }),
    db.integrationEvent.findMany({ where: { organizationId, resourceType: "lab_order", resourceId: { in: orderIds } }, orderBy: { occurredAt: "desc" }, take: 100 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const trendGroups = new Map<string, Array<{ date: string; value: number; unit: string | null; resultId: string }>>();
  const trendLabels = new Map<string, string>();
  for (const item of items) {
    if (item.numericValue === null) continue;
    const result = results.find((candidate) => candidate.id === item.labResultId);
    if (!result) continue;
    const key = `${result.patientId}:${item.loincCode ?? item.name.toLowerCase()}`;
    trendLabels.set(key, `${patientMap.get(result.patientId)?.firstName ?? "Patient"} · ${item.name}`);
    const points = trendGroups.get(key) ?? [];
    points.push({ date: (result.resultedAt ?? result.createdAt).toISOString(), value: item.numericValue, unit: item.unit, resultId: result.id });
    trendGroups.set(key, points);
  }

  return {
    orders: orders.map((order) => {
      const patient = patientMap.get(order.patientId);
      const provider = order.providerId ? providerMap.get(order.providerId) : undefined;
      return {
        ...order,
        tests: asTests(order.tests),
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        providerName: provider ? `${provider.name}, ${provider.credential}` : "Unassigned provider",
        orderedAt: iso(order.orderedAt),
        readyAt: iso(order.readyAt),
        transmittedAt: iso(order.transmittedAt),
        collectedAt: iso(order.collectedAt),
        resultsReceivedAt: iso(order.resultsReceivedAt),
        lastDeliveryAttemptAt: iso(order.lastDeliveryAttemptAt),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    }),
    results: results.map((result) => {
      const patient = patientMap.get(result.patientId);
      const order = result.orderId ? orderMap.get(result.orderId) : undefined;
      return {
        ...result,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        orderingProviderName: order?.providerId ? `${providerMap.get(order.providerId)?.name ?? "Unknown"}, ${providerMap.get(order.providerId)?.credential ?? "Provider"}` : "Unlinked result",
        items: items.filter((item) => item.labResultId === result.id),
        collectedAt: iso(result.collectedAt),
        resultedAt: iso(result.resultedAt),
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
    trends: [...trendGroups.entries()].map(([key, points]) => ({ key, label: trendLabels.get(key) ?? key, points: points.sort((a, b) => a.date.localeCompare(b.date)) })).filter((trend) => trend.points.length > 1),
  };
}

export type LabWorkspace = Awaited<ReturnType<typeof listLabWorkspace>>;

function resultStatusLabel(status: string): LabResult["reviewStatus"] {
  if (status === "released") return "Released";
  if (status === "reviewed") return "Reviewed";
  if (status === "corrected") return "Corrected";
  return "Needs Review";
}

export async function listLabResultsForPatient(
  patientId: string,
  organizationId: string,
): Promise<LabResult[]> {
  const patient = await db.patient.findFirst({
    where: { id: patientId, organizationId, status: "active" },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!patient) return [];

  const results = await db.labResult.findMany({
    where: { organizationId, patientId },
    orderBy: [{ resultedAt: "desc" }, { receivedAt: "desc" }, { version: "desc" }],
    take: 100,
  });
  if (results.length === 0) return [];

  const items = await db.labResultItem.findMany({
    where: { organizationId, labResultId: { in: results.map((result) => result.id) } },
    orderBy: [{ labResultId: "asc" }, { sequence: "asc" }],
  });
  const patientName = `${patient.firstName} ${patient.lastName}`;

  return results.map((result) => {
    const resultItems = items.filter((item) => item.labResultId === result.id);
    return {
      id: result.id,
      patientId: result.patientId,
      patient: patientName,
      panel: result.panelName,
      vendor: result.vendor ?? "Manual source",
      collectedAt: iso(result.collectedAt),
      resultedAt: iso(result.resultedAt) ?? result.receivedAt.toISOString(),
      abnormalCount: resultItems.filter((item) => item.abnormalFlag && item.abnormalFlag !== "normal").length,
      critical: result.critical,
      reviewStatus: resultStatusLabel(result.status),
      patientVisible: result.patientVisible,
      source: result.sourceType.replaceAll("_", " "),
      sourceReference: result.sourceReference,
      version: result.version,
      correctionOfId: result.correctionOfId,
      items: resultItems.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        unit: item.unit,
        range: item.referenceRange,
        flag: item.abnormalFlag,
        critical: item.critical,
      })),
    };
  });
}

export async function createLabOrder(session: ClinicSession, rawInput: unknown) {
  const input = createLabOrderSchema.parse(rawInput);
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
      exists: (await tx.diagnosis.count({ where: { organizationId: session.organizationId, patientId: patient.id, code } })) > 0 ||
        (await tx.problem.count({ where: { organizationId: session.organizationId, patientId: patient.id, code } })) > 0,
    })));
    const missingCodes = diagnosisRows.filter((row) => !row.exists).map((row) => row.code);
    if (missingCodes.length) throw new NetworkAccessError(`Diagnosis codes are not attached to this patient: ${missingCodes.join(", ")}.`, 400);
    let integration = null;
    if (input.deliveryMethod === "electronic_adapter") integration = await requireLabIntegration(tx, session.organizationId, input.integrationId!);

    const now = new Date();
    const clinicalOrder = await tx.clinicalOrder.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        encounterId: input.encounterId,
        providerId: provider.id,
        type: "lab",
        details: { tests: input.tests, diagnosisCodes: input.diagnosisCodes, priority: input.priority, vendor: input.vendor },
        status: "draft",
      },
    });
    const order = await tx.labOrder.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        encounterId: input.encounterId,
        providerId: provider.id,
        clinicalOrderId: clinicalOrder.id,
        vendor: input.vendor,
        integrationId: integration?.id,
        tests: input.tests,
        diagnosisCodes: input.diagnosisCodes,
        priority: input.priority,
        specimenType: input.specimenType,
        collectionSite: input.collectionSite,
        collectionInstructions: input.collectionInstructions,
        deliveryMethod: input.deliveryMethod,
        createdBy: session.userId,
        provenance: { source: "clinicos", createdBy: session.userId, syntheticDemo: session.demo },
      },
    });
    await tx.labEvent.create({ data: { organizationId: session.organizationId, labOrderId: order.id, actorId: session.userId, eventType: "created", toStatus: "draft", metadata: { clinicalOrderId: clinicalOrder.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "lab_order.created", resourceType: "lab_order", resourceId: order.id, patientId: patient.id, metadata: { providerId: provider.id, deliveryMethod: order.deliveryMethod, integrationId: order.integrationId, createdAt: now.toISOString() } } });
    return order;
  });
}

function orderTransitionData(action: LabOrderAction, order: { deliveryMethod: string }, now: Date, note?: string, collectedAt?: Date) {
  const data: Prisma.LabOrderUpdateManyMutationInput = {};
  if (action === "mark_ready") Object.assign(data, { status: "ready_to_send", readyAt: now, orderedAt: now });
  if (action === "queue_delivery") Object.assign(data, { status: order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send", deliveryStatus: order.deliveryMethod === "electronic_adapter" ? "queued" : "pending_manual", deliveryAttempts: { increment: 1 }, lastDeliveryAttemptAt: now, failureReason: null });
  if (action === "confirm_delivery") Object.assign(data, { status: "sent", deliveryStatus: "delivered", transmittedAt: now, failureReason: null });
  if (action === "record_collection") Object.assign(data, { status: "collected", collectedAt: collectedAt ?? now });
  if (action === "fail_delivery") Object.assign(data, { deliveryStatus: "failed", failureReason: note });
  if (action === "retry_delivery") Object.assign(data, { status: order.deliveryMethod === "electronic_adapter" ? "transmission_queued" : "ready_to_send", deliveryStatus: order.deliveryMethod === "electronic_adapter" ? "queued" : "pending_manual", deliveryAttempts: { increment: 1 }, lastDeliveryAttemptAt: now, failureReason: null });
  if (action === "cancel") Object.assign(data, { status: "cancelled", cancelledAt: now, failureReason: note });
  return data;
}

export async function transitionLabOrder(session: ClinicSession, labOrderId: string, rawInput: unknown) {
  const input = transitionLabOrderSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const order = await tx.labOrder.findFirst({ where: { id: labOrderId, organizationId: session.organizationId } });
    if (!order) throw new NetworkAccessError("Laboratory order not found for this organization.", 404);
    const nextStatus = nextLabOrderStatus(order, input.action);
    if (!nextStatus) throw new NetworkAccessError("That laboratory order action is not allowed from the current state.", 409);
    if (order.deliveryMethod === "electronic_adapter" && order.integrationId) await requireLabIntegration(tx, session.organizationId, order.integrationId);
    const now = new Date();
    const update = await tx.labOrder.updateMany({
      where: { id: order.id, organizationId: session.organizationId, status: order.status, deliveryStatus: order.deliveryStatus },
      data: orderTransitionData(input.action, order, now, input.note, input.collectedAt),
    });
    if (update.count !== 1) throw new NetworkAccessError("The laboratory order changed. Refresh and try again.", 409);

    const clinicalStatus: Partial<Record<LabOrderAction, string>> = { mark_ready: "ordered", confirm_delivery: "sent", record_collection: "collected", cancel: "cancelled" };
    if (order.clinicalOrderId && clinicalStatus[input.action]) await tx.clinicalOrder.updateMany({ where: { id: order.clinicalOrderId, organizationId: session.organizationId }, data: { status: clinicalStatus[input.action] } });

    if (["queue_delivery", "retry_delivery"].includes(input.action)) {
      if (order.deliveryMethod === "electronic_adapter") {
        await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: order.integrationId, resourceType: "lab_order", resourceId: order.id, direction: "outbound", eventType: input.action, status: "queued", retryCount: Math.max(order.deliveryAttempts, input.action === "retry_delivery" ? 1 : 0), metadata: { vendor: order.vendor, noLiveTransmissionClaim: true } } });
      } else {
        await tx.task.create({ data: { organizationId: session.organizationId, patientId: order.patientId, category: "lab_delivery", title: `Complete ${order.deliveryMethod} lab order delivery`, details: `Order ${order.id} for ${order.vendor ?? "external laboratory"}. Confirm only after staff verifies delivery.`, priority: order.priority === "routine" ? "normal" : "high", dueAt: now, createdBy: session.userId } });
      }
    }
    if (input.action === "confirm_delivery") {
      await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: order.patientId, category: "lab_delivery", status: "open", details: { contains: order.id } }, data: { status: "completed", completedAt: now } });
      if (order.deliveryMethod === "electronic_adapter") await tx.integrationEvent.updateMany({ where: { organizationId: session.organizationId, resourceType: "lab_order", resourceId: order.id, status: { in: ["queued", "sent"] } }, data: { status: "acknowledged", acknowledgmentCode: "RECORDED_BY_AUTHORIZED_USER" } });
    }
    if (input.action === "fail_delivery") {
      await tx.escalation.create({ data: { organizationId: session.organizationId, patientId: order.patientId, sourceType: "lab_order", sourceId: order.id, category: "failed_lab_delivery", riskLevel: order.priority === "stat" ? "URGENT" : "NEEDS_STAFF", assignedTeam: "laboratory_coordination" } });
      await tx.integrationEvent.updateMany({ where: { organizationId: session.organizationId, resourceType: "lab_order", resourceId: order.id, status: { in: ["queued", "sent"] } }, data: { status: "failed", errorMessage: input.note } });
    }
    if (input.action === "retry_delivery") await tx.escalation.updateMany({ where: { organizationId: session.organizationId, sourceType: "lab_order", sourceId: order.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: "Authorized delivery retry started." } });

    await tx.labEvent.create({ data: { organizationId: session.organizationId, labOrderId: order.id, actorId: session.userId, eventType: input.action, fromStatus: order.status, toStatus: nextStatus, note: input.note, metadata: { deliveryStatusBefore: order.deliveryStatus, deliveryMethod: order.deliveryMethod } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `lab_order.${input.action}`, resourceType: "lab_order", resourceId: order.id, patientId: order.patientId, changes: { status: { from: order.status, to: nextStatus }, deliveryStatus: { from: order.deliveryStatus, action: input.action } }, metadata: { deliveryMethod: order.deliveryMethod, note: input.note } } });
    return tx.labOrder.findUniqueOrThrow({ where: { id: order.id } });
  });
}

export async function createLabResult(session: ClinicSession, rawInput: unknown) {
  const input = createLabResultSchema.parse(rawInput);
  const flags = summarizeLabFlags(input.items);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    let order = null;
    if (input.orderId) {
      order = await tx.labOrder.findFirst({ where: { id: input.orderId, organizationId: session.organizationId, patientId: patient.id } });
      if (!order) throw new NetworkAccessError("The laboratory order does not belong to this patient.", 400);
      if (!["sent", "collected"].includes(order.status)) throw new NetworkAccessError("Confirm order delivery before receiving results.", 409);
    }
    let integration = null;
    if (input.sourceType === "electronic_interface") integration = await requireLabIntegration(tx, session.organizationId, input.integrationId!);
    if (input.sourceDocumentId) {
      const document = await tx.document.findFirst({ where: { id: input.sourceDocumentId, organizationId: session.organizationId, patientId: patient.id } });
      if (!document) throw new NetworkAccessError("The source document does not belong to this patient and organization.", 400);
    }
    const result = await tx.labResult.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient.id,
        orderId: order?.id,
        vendor: input.vendor ?? order?.vendor,
        integrationId: integration?.id ?? order?.integrationId,
        panelName: input.panelName,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        sourceDocumentId: input.sourceDocumentId,
        specimenType: input.specimenType ?? order?.specimenType,
        collectedAt: input.collectedAt ?? order?.collectedAt,
        resultedAt: input.resultedAt,
        abnormal: flags.abnormal,
        critical: flags.critical,
        provenance: { source: input.sourceType, sourceReference: input.sourceReference, sourceDocumentId: input.sourceDocumentId, enteredBy: session.userId, syntheticDemo: session.demo },
      },
    });
    await tx.labResultItem.createMany({ data: input.items.map((item, sequence) => ({ organizationId: session.organizationId, labResultId: result.id, sequence, ...item })) });
    if (order) {
      await tx.labOrder.updateMany({ where: { id: order.id, organizationId: session.organizationId, status: order.status }, data: { status: "resulted", resultsReceivedAt: new Date() } });
      if (order.clinicalOrderId) await tx.clinicalOrder.updateMany({ where: { id: order.clinicalOrderId, organizationId: session.organizationId }, data: { status: "result_received" } });
    }
    if (input.sourceType === "electronic_interface") await tx.integrationEvent.create({ data: { organizationId: session.organizationId, integrationId: integration?.id, resourceType: "lab_result", resourceId: result.id, direction: "inbound", eventType: "result_received", status: "acknowledged", acknowledgmentCode: "STRUCTURED_RESULT_ACCEPTED", metadata: { sourceReference: input.sourceReference } } });
    await createResultReviewWork(tx, { organizationId: session.organizationId, patientId: patient.id, resultId: result.id, panelName: result.panelName, critical: result.critical, createdBy: session.userId });
    await tx.labEvent.create({ data: { organizationId: session.organizationId, labOrderId: order?.id, labResultId: result.id, actorId: session.userId, eventType: "result_received", toStatus: "needs_review", metadata: { abnormal: result.abnormal, critical: result.critical, sourceType: result.sourceType } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "lab_result.received", resourceType: "lab_result", resourceId: result.id, patientId: patient.id, metadata: { orderId: order?.id, sourceType: result.sourceType, sourceDocumentId: result.sourceDocumentId, abnormal: result.abnormal, critical: result.critical } } });
    return result;
  });
}

export async function transitionLabResult(session: ClinicSession, labResultId: string, rawInput: unknown) {
  const input = transitionLabResultSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const clinicalSigner = labResultActionRequiresProviderIdentity(input.action)
      ? await requireClinicalSigner(tx, session)
      : null;
    const result = await tx.labResult.findFirst({ where: { id: labResultId, organizationId: session.organizationId } });
    if (!result) throw new NetworkAccessError("Laboratory result not found for this organization.", 404);
    const nextStatus = nextLabResultStatus(result.status, input.action);
    if (!nextStatus) throw new NetworkAccessError("That laboratory result action is not allowed from the current state.", 409);
    const now = new Date();
    const data: Prisma.LabResultUpdateManyMutationInput = {};
    if (input.action === "review") Object.assign(data, { status: "reviewed", reviewComments: input.note, reviewedBy: session.userId, reviewedAt: now });
    if (input.action === "release") Object.assign(data, { status: "released", releaseApprovedBy: session.userId, releaseApprovedAt: now, patientVisible: true, releasedAt: now, patientNotificationStatus: "pending" });
    if (input.action === "notify_patient") Object.assign(data, { patientNotificationStatus: "notified", patientNotifiedAt: now });
    const update = await tx.labResult.updateMany({ where: { id: result.id, organizationId: session.organizationId, status: result.status }, data: Object.keys(data).length ? data : { updatedAt: now } });
    if (update.count !== 1) throw new NetworkAccessError("The laboratory result changed. Refresh and try again.", 409);

    if (input.action === "review") {
      await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: result.patientId, category: "lab_review", status: "open", details: { contains: result.id } }, data: { status: "completed", completedAt: now } });
      await tx.escalation.updateMany({ where: { organizationId: session.organizationId, sourceType: "lab_result", sourceId: result.id, status: "open" }, data: { status: "resolved", reviewedBy: session.userId, reviewedAt: now, resolution: "Licensed provider documented review. Clinical meaning is not generated by ClinicOS." } });
    }
    if (input.action === "create_follow_up") await tx.task.create({ data: { organizationId: session.organizationId, patientId: result.patientId, category: "lab_follow_up", title: `Follow up on ${result.panelName}`, details: input.note, priority: result.critical ? "urgent" : "high", riskLevel: result.critical ? "URGENT" : "NEEDS_PROVIDER", dueAt: input.followUpDueAt, createdBy: session.userId } });
    if (input.action === "notify_patient") await tx.task.updateMany({ where: { organizationId: session.organizationId, patientId: result.patientId, category: "lab_follow_up", status: "open", details: { contains: result.id } }, data: { status: "completed", completedAt: now } });
    if (input.action === "repeat_order") {
      const items = await tx.labResultItem.findMany({ where: { organizationId: session.organizationId, labResultId: result.id }, orderBy: { sequence: "asc" } });
      const sourceOrder = result.orderId ? await tx.labOrder.findFirst({ where: { id: result.orderId, organizationId: session.organizationId } }) : null;
      const provider = clinicalSigner;
      if (!provider) throw new NetworkAccessError("An active ordering provider is required to create a repeat order.", 409);
      const tests = items.map((item) => ({ name: item.name, ...(item.loincCode ? { loincCode: item.loincCode } : {}) }));
      const clinicalOrder = await tx.clinicalOrder.create({ data: { organizationId: session.organizationId, patientId: result.patientId, providerId: provider.id, type: "lab", details: { tests, repeatOfResultId: result.id }, status: "draft" } });
      const repeat = await tx.labOrder.create({ data: { organizationId: session.organizationId, patientId: result.patientId, providerId: provider.id, clinicalOrderId: clinicalOrder.id, vendor: sourceOrder?.vendor ?? result.vendor, tests, diagnosisCodes: sourceOrder?.diagnosisCodes ?? [], priority: sourceOrder?.priority ?? "routine", specimenType: sourceOrder?.specimenType ?? result.specimenType, deliveryMethod: "manual", createdBy: session.userId, provenance: { source: "repeat_order", repeatOfResultId: result.id } } });
      await tx.labEvent.create({ data: { organizationId: session.organizationId, labOrderId: repeat.id, labResultId: result.id, actorId: session.userId, eventType: "repeat_order_created", toStatus: "draft" } });
    }
    await tx.labEvent.create({ data: { organizationId: session.organizationId, labResultId: result.id, actorId: session.userId, eventType: input.action, fromStatus: result.status, toStatus: nextStatus, note: input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `lab_result.${input.action}`, resourceType: "lab_result", resourceId: result.id, patientId: result.patientId, changes: { status: { from: result.status, to: nextStatus } }, metadata: { note: input.note, followUpDueAt: input.followUpDueAt?.toISOString() } } });
    return tx.labResult.findUniqueOrThrow({ where: { id: result.id } });
  });
}

export async function correctLabResult(session: ClinicSession, labResultId: string, rawInput: unknown) {
  const input = correctLabResultSchema.parse(rawInput);
  const flags = summarizeLabFlags(input.items);
  return db.$transaction(async (tx) => {
    await requireClinicalSigner(tx, session);
    const original = await tx.labResult.findFirst({ where: { id: labResultId, organizationId: session.organizationId } });
    if (!original) throw new NetworkAccessError("Laboratory result not found for this organization.", 404);
    if (original.status === "corrected") throw new NetworkAccessError("This result version has already been corrected.", 409);
    const update = await tx.labResult.updateMany({ where: { id: original.id, organizationId: session.organizationId, status: original.status }, data: { status: "corrected", patientVisible: false } });
    if (update.count !== 1) throw new NetworkAccessError("The laboratory result changed. Refresh and try again.", 409);
    const correction = await tx.labResult.create({ data: { organizationId: session.organizationId, patientId: original.patientId, orderId: original.orderId, vendor: input.vendor ?? original.vendor, integrationId: original.integrationId, panelName: input.panelName, sourceType: "manual_entry", sourceReference: input.sourceReference, sourceDocumentId: original.sourceDocumentId, specimenType: input.specimenType ?? original.specimenType, collectedAt: input.collectedAt ?? original.collectedAt, resultedAt: input.resultedAt, abnormal: flags.abnormal, critical: flags.critical, correctionOfId: original.id, correctionReason: input.reason, version: original.version + 1, provenance: { source: "provider_correction", correctionOfId: original.id, correctedBy: session.userId } } });
    await tx.labResultItem.createMany({ data: input.items.map((item, sequence) => ({ organizationId: session.organizationId, labResultId: correction.id, sequence, ...item, resultStatus: "corrected" })) });
    await createResultReviewWork(tx, { organizationId: session.organizationId, patientId: original.patientId, resultId: correction.id, panelName: correction.panelName, critical: correction.critical, createdBy: session.userId });
    await tx.labEvent.createMany({ data: [
      { organizationId: session.organizationId, labResultId: original.id, actorId: session.userId, eventType: "corrected", fromStatus: original.status, toStatus: "corrected", note: input.reason, metadata: { replacementResultId: correction.id } },
      { organizationId: session.organizationId, labResultId: correction.id, actorId: session.userId, eventType: "correction_created", toStatus: "needs_review", note: input.reason, metadata: { correctionOfId: original.id, version: correction.version } },
    ] });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "lab_result.corrected", resourceType: "lab_result", resourceId: original.id, patientId: original.patientId, changes: { status: { from: original.status, to: "corrected" }, replacementResultId: correction.id }, metadata: { reason: input.reason, replacementVersion: correction.version, previouslyPatientVisible: original.patientVisible } } });
    return correction;
  });
}
