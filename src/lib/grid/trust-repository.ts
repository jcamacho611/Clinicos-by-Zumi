import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import {
  canTransitionGridDispute,
  canTransitionGridSafetyIncident,
  gridDisputeCreateSchema,
  gridDisputeTransitionSchema,
  gridSafetyIncidentCreateSchema,
  gridSafetyIncidentTransitionSchema,
  type GridDisputeStatus,
  type GridSafetyIncidentStatus,
} from "@/lib/grid/trust-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ReservationContext = {
  id: string;
  organizationId: string;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  providerId: string | null;
  locationId: string | null;
  resourceKind: string | null;
  resourceReference: string | null;
  fulfillmentStatus: string;
};

type DisputeRow = {
  id: string;
  organizationId: string;
  reservationId: string;
  openedByOrganizationId: string;
  createdBy: string;
  category: string;
  summary: string;
  requestedOutcome: string | null;
  status: GridDisputeStatus;
  resolutionNote: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type IncidentRow = {
  id: string;
  organizationId: string;
  reservationId: string;
  reportedByOrganizationId: string;
  createdBy: string;
  category: string;
  severity: string;
  summary: string;
  status: GridSafetyIncidentStatus;
  providerId: string | null;
  locationId: string | null;
  resourceKind: string | null;
  resourceReference: string | null;
  resolutionNote: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireRead(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read")) {
    throw new NetworkAccessError("Grid trust information is not permitted for this role.", 403);
  }
}

function requireUpdate(session: ClinicSession) {
  if (!can(session.role, "grid", "update") && !can(session.role, "network", "update")) {
    throw new NetworkAccessError("Grid issue reporting is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { demoMode: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) {
    throw new NetworkAccessError("Grid trust workflows require production governance review before live regulated use.", 409);
  }
}

async function requirePlatformReviewAuthority(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) {
    throw new NetworkAccessError("Grid issue review requires owner-level platform permission.", 403);
  }
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { slug: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) {
    throw new NetworkAccessError("Grid issue review is restricted to the Klinikos platform organization.", 403);
  }
}

function serializeDispute(row: DisputeRow) {
  return {
    ...row,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeIncident(row: IncidentRow) {
  return {
    ...row,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function loadReservationContext(
  client: Prisma.TransactionClient | typeof db,
  reservationId: string,
  organizationId: string,
  lock = false,
) {
  const lockSql = lock ? Prisma.sql`FOR UPDATE OF r` : Prisma.empty;
  const rows = await client.$queryRaw<ReservationContext[]>(Prisma.sql`
    SELECT r."id", r."organizationId", r."providerId", r."locationId", r."resourceKind", r."resourceReference",
           r."fulfillmentStatus", o."senderOrganizationId", o."recipientOrganizationId"
    FROM "GridReservationRecord" r
    JOIN "GridOfferRecord" o ON o."id" = r."offerId"
    WHERE r."id" = ${reservationId}
      AND (
        r."organizationId" = ${organizationId}
        OR o."senderOrganizationId" = ${organizationId}
        OR o."recipientOrganizationId" = ${organizationId}
      )
    ${lockSql}
  `);
  const context = rows[0];
  if (!context) throw new NetworkAccessError("Grid reservation not found for this participant.", 404);
  return context;
}

async function appendDisputeEvent(client: Prisma.TransactionClient, input: {
  organizationId: string;
  disputeId: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note: string;
  metadata?: Record<string, unknown>;
}) {
  await client.$executeRaw(Prisma.sql`
    INSERT INTO "GridDisputeEventRecord" (
      "id", "organizationId", "disputeId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${input.disputeId}, ${input.actorId}, ${input.action},
      ${input.fromStatus ?? null}, ${input.toStatus ?? null}, ${input.note},
      CAST(${JSON.stringify(input.metadata ?? {})} AS JSONB), CURRENT_TIMESTAMP
    )
  `);
}

async function appendIncidentEvent(client: Prisma.TransactionClient, input: {
  organizationId: string;
  incidentId: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note: string;
  metadata?: Record<string, unknown>;
}) {
  await client.$executeRaw(Prisma.sql`
    INSERT INTO "GridSafetyIncidentEventRecord" (
      "id", "organizationId", "incidentId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${input.incidentId}, ${input.actorId}, ${input.action},
      ${input.fromStatus ?? null}, ${input.toStatus ?? null}, ${input.note},
      CAST(${JSON.stringify(input.metadata ?? {})} AS JSONB), CURRENT_TIMESTAMP
    )
  `);
}

export async function reservationHasActiveGridIssues(client: Prisma.TransactionClient, reservationId: string) {
  const rows = await client.$queryRaw<Array<{ disputes: number; incidents: number }>>(Prisma.sql`
    SELECT
      (SELECT COUNT(*)::int FROM "GridDisputeRecord" WHERE "reservationId" = ${reservationId} AND "status" <> 'closed') AS "disputes",
      (SELECT COUNT(*)::int FROM "GridSafetyIncidentRecord" WHERE "reservationId" = ${reservationId} AND "status" <> 'closed') AS "incidents"
  `);
  return {
    activeDisputes: rows[0]?.disputes ?? 0,
    activeSafetyIncidents: rows[0]?.incidents ?? 0,
    blocked: (rows[0]?.disputes ?? 0) + (rows[0]?.incidents ?? 0) > 0,
  };
}

export async function listGridIssuesForReservation(session: ClinicSession, reservationId: string) {
  requireRead(session);
  await loadReservationContext(db, reservationId, session.organizationId);
  const [disputes, incidents] = await Promise.all([
    db.$queryRaw<DisputeRow[]>(Prisma.sql`
      SELECT * FROM "GridDisputeRecord" WHERE "reservationId" = ${reservationId} ORDER BY "updatedAt" DESC
    `),
    db.$queryRaw<IncidentRow[]>(Prisma.sql`
      SELECT * FROM "GridSafetyIncidentRecord" WHERE "reservationId" = ${reservationId} ORDER BY "updatedAt" DESC
    `),
  ]);
  return {
    disputes: disputes.map(serializeDispute),
    safetyIncidents: incidents.map(serializeIncident),
  };
}

export async function createGridDispute(session: ClinicSession, reservationId: string, rawInput: unknown) {
  requireUpdate(session);
  await requireSyntheticOrganization(session.organizationId);
  const input = gridDisputeCreateSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const context = await loadReservationContext(tx, reservationId, session.organizationId, true);
    const existing = await tx.$queryRaw<DisputeRow[]>(Prisma.sql`
      SELECT * FROM "GridDisputeRecord"
      WHERE "reservationId" = ${reservationId}
        AND "openedByOrganizationId" = ${session.organizationId}
        AND "status" <> 'closed'
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `);
    if (existing[0]) {
      throw new NetworkAccessError("Your organization already has an active marketplace dispute on this reservation.", 409);
    }

    const id = randomUUID();
    const rows = await tx.$queryRaw<DisputeRow[]>(Prisma.sql`
      INSERT INTO "GridDisputeRecord" (
        "id", "organizationId", "reservationId", "openedByOrganizationId", "createdBy",
        "category", "summary", "requestedOutcome", "status", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${context.organizationId}, ${reservationId}, ${session.organizationId}, ${session.userId},
        ${input.category}, ${input.summary}, ${input.requestedOutcome ?? null}, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const created = rows[0];
    if (!created) throw new NetworkAccessError("Grid dispute could not be created.", 500);

    await appendDisputeEvent(tx, {
      organizationId: context.organizationId,
      disputeId: id,
      actorId: session.userId,
      action: "grid.dispute.opened",
      toStatus: "open",
      note: input.summary,
      metadata: { category: input.category, openedByOrganizationId: session.organizationId },
    });
    await tx.auditLog.create({
      data: {
        organizationId: context.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.dispute_opened",
        resourceType: "grid_dispute",
        resourceId: id,
        metadata: {
          reservationId,
          category: input.category,
          openedByOrganizationId: session.organizationId,
          settlementHold: true,
          processorActionTaken: false,
        },
      },
    });
    return serializeDispute(created);
  });
}

export async function createGridSafetyIncident(session: ClinicSession, reservationId: string, rawInput: unknown) {
  requireUpdate(session);
  await requireSyntheticOrganization(session.organizationId);
  const input = gridSafetyIncidentCreateSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const context = await loadReservationContext(tx, reservationId, session.organizationId, true);
    const id = randomUUID();
    const rows = await tx.$queryRaw<IncidentRow[]>(Prisma.sql`
      INSERT INTO "GridSafetyIncidentRecord" (
        "id", "organizationId", "reservationId", "reportedByOrganizationId", "createdBy",
        "category", "severity", "summary", "status", "providerId", "locationId", "resourceKind", "resourceReference",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${context.organizationId}, ${reservationId}, ${session.organizationId}, ${session.userId},
        ${input.category}, ${input.severity}, ${input.summary}, 'open', ${context.providerId}, ${context.locationId},
        ${context.resourceKind}, ${context.resourceReference}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const created = rows[0];
    if (!created) throw new NetworkAccessError("Grid safety incident could not be created.", 500);

    await appendIncidentEvent(tx, {
      organizationId: context.organizationId,
      incidentId: id,
      actorId: session.userId,
      action: "grid.safety_incident.opened",
      toStatus: "open",
      note: input.summary,
      metadata: { category: input.category, severity: input.severity, reportedByOrganizationId: session.organizationId },
    });
    await tx.auditLog.create({
      data: {
        organizationId: context.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.safety_incident_opened",
        resourceType: "grid_safety_incident",
        resourceId: id,
        metadata: {
          reservationId,
          category: input.category,
          severity: input.severity,
          reportedByOrganizationId: session.organizationId,
          settlementHold: true,
          medicalDeterminationMade: false,
          participantRestrictionExecuted: false,
          resourceSuspensionExecuted: false,
        },
      },
    });
    return serializeIncident(created);
  });
}

export async function transitionGridDispute(session: ClinicSession, disputeId: string, rawInput: unknown) {
  await requirePlatformReviewAuthority(session);
  const input = gridDisputeTransitionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<DisputeRow[]>(Prisma.sql`
      SELECT * FROM "GridDisputeRecord" WHERE "id" = ${disputeId} FOR UPDATE
    `);
    const dispute = rows[0];
    if (!dispute) throw new NetworkAccessError("Grid dispute not found.", 404);
    if (!canTransitionGridDispute(dispute.status, input.targetStatus)) {
      throw new NetworkAccessError(`Grid dispute cannot move from ${dispute.status} to ${input.targetStatus}.`, 409);
    }
    const closedAt = input.targetStatus === "closed" ? new Date() : null;
    const updatedRows = await tx.$queryRaw<DisputeRow[]>(Prisma.sql`
      UPDATE "GridDisputeRecord"
      SET "status" = ${input.targetStatus}, "resolutionNote" = ${input.note}, "closedAt" = ${closedAt}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${dispute.id}
      RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid dispute transition failed.", 500);

    await appendDisputeEvent(tx, {
      organizationId: dispute.organizationId,
      disputeId: dispute.id,
      actorId: session.userId,
      action: `grid.dispute.${input.targetStatus}`,
      fromStatus: dispute.status,
      toStatus: input.targetStatus,
      note: input.note,
      metadata: { refundProcessorVerified: false },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.dispute_${input.targetStatus}`,
        resourceType: "grid_dispute",
        resourceId: dispute.id,
        metadata: { reservationId: dispute.reservationId, fromStatus: dispute.status, toStatus: input.targetStatus },
      },
    });
    return serializeDispute(updated);
  });
}

export async function transitionGridSafetyIncident(session: ClinicSession, incidentId: string, rawInput: unknown) {
  await requirePlatformReviewAuthority(session);
  const input = gridSafetyIncidentTransitionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<IncidentRow[]>(Prisma.sql`
      SELECT * FROM "GridSafetyIncidentRecord" WHERE "id" = ${incidentId} FOR UPDATE
    `);
    const incident = rows[0];
    if (!incident) throw new NetworkAccessError("Grid safety incident not found.", 404);
    if (!canTransitionGridSafetyIncident(incident.status, input.targetStatus)) {
      throw new NetworkAccessError(`Grid safety incident cannot move from ${incident.status} to ${input.targetStatus}.`, 409);
    }
    const closedAt = input.targetStatus === "closed" ? new Date() : null;
    const updatedRows = await tx.$queryRaw<IncidentRow[]>(Prisma.sql`
      UPDATE "GridSafetyIncidentRecord"
      SET "status" = ${input.targetStatus}, "resolutionNote" = ${input.note}, "closedAt" = ${closedAt}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${incident.id}
      RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid safety incident transition failed.", 500);

    await appendIncidentEvent(tx, {
      organizationId: incident.organizationId,
      incidentId: incident.id,
      actorId: session.userId,
      action: `grid.safety_incident.${input.targetStatus}`,
      fromStatus: incident.status,
      toStatus: input.targetStatus,
      note: input.note,
      metadata: {
        recommendationOnly: ["restriction_recommended", "resource_hold_recommended"].includes(input.targetStatus),
        restrictionExecuted: false,
        resourceSuspensionExecuted: false,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.safety_incident_${input.targetStatus}`,
        resourceType: "grid_safety_incident",
        resourceId: incident.id,
        metadata: {
          reservationId: incident.reservationId,
          fromStatus: incident.status,
          toStatus: input.targetStatus,
          medicalDeterminationMade: false,
          restrictionExecuted: false,
        },
      },
    });
    return serializeIncident(updated);
  });
}

export async function getGridTrustSummary(session: ClinicSession) {
  requireRead(session);
  const rows = await db.$queryRaw<Array<{
    reservations: number;
    fulfilled: number;
    failed: number;
    partial: number;
    activeDisputes: number;
    totalDisputes: number;
    activeSafetyIncidents: number;
    totalSafetyIncidents: number;
    repeatCounterparties: number;
  }>>(Prisma.sql`
    WITH involved_reservations AS (
      SELECT DISTINCT r."id", r."fulfillmentStatus",
        CASE
          WHEN o."senderOrganizationId" = ${session.organizationId} THEN o."recipientOrganizationId"
          ELSE o."senderOrganizationId"
        END AS "counterparty"
      FROM "GridReservationRecord" r
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      WHERE r."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
    )
    SELECT
      COUNT(*)::int AS "reservations",
      COUNT(*) FILTER (WHERE ir."fulfillmentStatus" = 'fulfilled')::int AS "fulfilled",
      COUNT(*) FILTER (WHERE ir."fulfillmentStatus" = 'failed')::int AS "failed",
      COUNT(*) FILTER (WHERE ir."fulfillmentStatus" = 'partial')::int AS "partial",
      (SELECT COUNT(*)::int FROM "GridDisputeRecord" d JOIN involved_reservations x ON x."id" = d."reservationId" WHERE d."status" <> 'closed') AS "activeDisputes",
      (SELECT COUNT(*)::int FROM "GridDisputeRecord" d JOIN involved_reservations x ON x."id" = d."reservationId") AS "totalDisputes",
      (SELECT COUNT(*)::int FROM "GridSafetyIncidentRecord" s JOIN involved_reservations x ON x."id" = s."reservationId" WHERE s."status" <> 'closed') AS "activeSafetyIncidents",
      (SELECT COUNT(*)::int FROM "GridSafetyIncidentRecord" s JOIN involved_reservations x ON x."id" = s."reservationId") AS "totalSafetyIncidents",
      (SELECT COUNT(*)::int FROM (SELECT "counterparty" FROM involved_reservations WHERE "counterparty" IS NOT NULL GROUP BY "counterparty" HAVING COUNT(*) > 1) repeat) AS "repeatCounterparties"
    FROM involved_reservations ir
  `);
  const summary = rows[0] ?? {
    reservations: 0,
    fulfilled: 0,
    failed: 0,
    partial: 0,
    activeDisputes: 0,
    totalDisputes: 0,
    activeSafetyIncidents: 0,
    totalSafetyIncidents: 0,
    repeatCounterparties: 0,
  };

  return {
    ...summary,
    fulfillmentRate: summary.reservations > 0 ? summary.fulfilled / summary.reservations : null,
    objectiveOnly: true,
    rating: null,
    note: "Grid trust summarizes objective transaction history. It is not a clinical-quality score or universal safety certification.",
  };
}
