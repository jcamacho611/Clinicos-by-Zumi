import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getKlinikosPath } from "@/lib/paths/catalog";
import { evaluateCapabilityPolicy } from "@/lib/orchestration/capability-engine";
import type { ActorContext } from "@/lib/orchestration/contracts";
import {
  advancePathSnapshot,
  baselineSnapshotForPath,
  type PersistedPathSnapshot,
} from "@/lib/orchestration/path-engine";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type PathRow = {
  id: string;
  organizationId: string;
  actorId: string;
  pathId: string;
  goal: string;
  status: PersistedPathSnapshot["status"];
  currentNodeId: string | null;
  completedNodeIds: unknown;
  blockedNodeIds: unknown;
  blockers: unknown;
  context: unknown;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toSnapshot(row: PathRow): PersistedPathSnapshot {
  return {
    instanceId: row.id,
    pathId: row.pathId,
    goal: row.goal,
    status: row.status,
    currentNodeId: row.currentNodeId,
    completedNodeIds: asStringArray(row.completedNodeIds),
    blockedNodeIds: asStringArray(row.blockedNodeIds),
    blockers: asStringArray(row.blockers),
  };
}

function actorContextFromSession(session: ClinicSession): ActorContext {
  const aliases = session.role === "clinic_owner"
    ? ["clinic_owner", "owner"]
    : session.role === "administrator"
      ? ["administrator", "admin"]
      : [session.role];
  return {
    actorId: session.userId,
    actorKind: "user",
    userId: session.userId,
    organizationId: session.organizationId,
    contextKind: "clinic",
    roleKeys: aliases,
    permissionKeys: [],
  };
}

async function appendPathEvent(input: {
  instanceId: string;
  organizationId: string;
  actorId: string;
  eventType: string;
  nodeId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const payload = JSON.stringify(input.payload ?? {});
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "KlinikosPathEvent" (
      "id", "instanceId", "organizationId", "actorId", "eventType", "nodeId", "payload", "occurredAt"
    ) VALUES (
      ${randomUUID()}, ${input.instanceId}, ${input.organizationId}, ${input.actorId}, ${input.eventType}, ${input.nodeId ?? null}, CAST(${payload} AS JSONB), CURRENT_TIMESTAMP
    )
  `);
}

export async function listActivePathSnapshots(session: ClinicSession) {
  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    SELECT *
    FROM "KlinikosPathInstance"
    WHERE "actorId" = ${session.userId}
      AND "organizationId" = ${session.organizationId}
      AND "status" IN ('active','blocked','paused')
    ORDER BY "lastActivityAt" DESC
    LIMIT 12
  `);
  return rows.map(toSnapshot);
}

export async function getPathSnapshot(session: ClinicSession, instanceId: string) {
  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    SELECT *
    FROM "KlinikosPathInstance"
    WHERE "id" = ${instanceId}
      AND "actorId" = ${session.userId}
      AND "organizationId" = ${session.organizationId}
    LIMIT 1
  `);
  return rows[0] ? toSnapshot(rows[0]) : null;
}

export async function getLatestPathSnapshotForDefinition(session: ClinicSession, pathId: string) {
  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    SELECT *
    FROM "KlinikosPathInstance"
    WHERE "pathId" = ${pathId}
      AND "actorId" = ${session.userId}
      AND "organizationId" = ${session.organizationId}
      AND "status" IN ('active','blocked','paused','completed')
    ORDER BY "lastActivityAt" DESC
    LIMIT 1
  `);
  return rows[0] ? toSnapshot(rows[0]) : null;
}

export async function createPathInstance(
  session: ClinicSession,
  input: { pathId: string; goal?: string | null; context?: Record<string, unknown> },
) {
  const definition = getKlinikosPath(input.pathId);
  if (!definition) throw new NetworkAccessError("Unknown Klinikos Path.", 404);

  const existing = await getLatestPathSnapshotForDefinition(session, input.pathId);
  if (existing && ["active", "blocked", "paused"].includes(existing.status)) return existing;

  const instanceId = randomUUID();
  const goal = input.goal?.trim() || definition.summary;
  const baseline = baselineSnapshotForPath({ instanceId, pathId: definition.id, goal });
  if (!baseline) throw new NetworkAccessError("Klinikos Path could not be resolved.", 500);

  const context = JSON.stringify(input.context ?? {});
  const completedNodeIds = JSON.stringify(baseline.completedNodeIds);
  const blockedNodeIds = JSON.stringify(baseline.blockedNodeIds);
  const blockers = JSON.stringify(baseline.blockers);
  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    INSERT INTO "KlinikosPathInstance" (
      "id", "organizationId", "actorId", "pathId", "goal", "status", "currentNodeId",
      "completedNodeIds", "blockedNodeIds", "blockers", "context",
      "startedAt", "lastActivityAt", "createdAt", "updatedAt"
    ) VALUES (
      ${instanceId}, ${session.organizationId}, ${session.userId}, ${definition.id}, ${goal}, ${baseline.status}, ${baseline.currentNodeId ?? null},
      CAST(${completedNodeIds} AS JSONB), CAST(${blockedNodeIds} AS JSONB), CAST(${blockers} AS JSONB), CAST(${context} AS JSONB),
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `);

  const created = rows[0];
  if (!created) throw new NetworkAccessError("Klinikos Path could not be started.", 500);

  await appendPathEvent({
    instanceId,
    organizationId: session.organizationId,
    actorId: session.userId,
    eventType: "path.started",
    nodeId: baseline.currentNodeId,
    payload: { pathId: definition.id, goal, baselineCompletedNodeIds: baseline.completedNodeIds },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "path.started",
      resourceType: "klinikos_path",
      resourceId: instanceId,
      metadata: { pathId: definition.id, currentNodeId: baseline.currentNodeId, baselineCompletedNodeIds: baseline.completedNodeIds, containsPhi: false },
    },
  });

  return toSnapshot(created);
}

export async function advancePathInstance(
  session: ClinicSession,
  input: { instanceId: string; completedNodeId: string },
) {
  const snapshot = await getPathSnapshot(session, input.instanceId);
  if (!snapshot) throw new NetworkAccessError("Klinikos Path not found.", 404);
  if (snapshot.status === "cancelled" || snapshot.status === "completed") {
    throw new NetworkAccessError("This Klinikos Path is not active.", 409);
  }
  if (snapshot.currentNodeId !== input.completedNodeId) {
    throw new NetworkAccessError("Only the current Path step can be completed.", 409);
  }

  const definition = getKlinikosPath(snapshot.pathId);
  const node = definition?.nodes.find((item) => item.id === input.completedNodeId);
  if (!definition || !node) throw new NetworkAccessError("Path step not found.", 404);

  if (node.capabilityKey) {
    const decision = evaluateCapabilityPolicy({
      context: actorContextFromSession(session),
      capabilityKey: node.capabilityKey,
      connectedConnectorIds: [],
    });
    if (decision.state !== "allowed") {
      const reason = decision.reasons[0] ?? "This step requires a governed review before completion.";
      throw new NetworkAccessError(reason, 409);
    }
  }

  const next = advancePathSnapshot({ snapshot, completedNodeId: input.completedNodeId });
  const nextCompletedNodeIds = JSON.stringify(next.completedNodeIds);
  const nextBlockedNodeIds = JSON.stringify(next.blockedNodeIds);
  const nextBlockers = JSON.stringify(next.blockers);
  const completedAt = next.status === "completed" ? new Date() : null;

  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    UPDATE "KlinikosPathInstance"
    SET "status" = ${next.status},
        "currentNodeId" = ${next.currentNodeId ?? null},
        "completedNodeIds" = CAST(${nextCompletedNodeIds} AS JSONB),
        "blockedNodeIds" = CAST(${nextBlockedNodeIds} AS JSONB),
        "blockers" = CAST(${nextBlockers} AS JSONB),
        "lastActivityAt" = CURRENT_TIMESTAMP,
        "completedAt" = ${completedAt},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${snapshot.instanceId}
      AND "actorId" = ${session.userId}
      AND "organizationId" = ${session.organizationId}
    RETURNING *
  `);

  const updated = rows[0];
  if (!updated) throw new NetworkAccessError("Klinikos Path could not be advanced.", 500);

  await appendPathEvent({
    instanceId: snapshot.instanceId,
    organizationId: session.organizationId,
    actorId: session.userId,
    eventType: next.status === "completed" ? "path.completed" : "path.node_completed",
    nodeId: input.completedNodeId,
    payload: { pathId: snapshot.pathId, nextNodeId: next.currentNodeId, capabilityKey: node.capabilityKey ?? null },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: next.status === "completed" ? "path.completed" : "path.node_completed",
      resourceType: "klinikos_path",
      resourceId: snapshot.instanceId,
      metadata: { pathId: snapshot.pathId, nodeId: input.completedNodeId, nextNodeId: next.currentNodeId, capabilityKey: node.capabilityKey ?? null, containsPhi: false },
    },
  });

  return toSnapshot(updated);
}
