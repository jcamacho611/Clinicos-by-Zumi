import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getKlinikosPath } from "@/lib/paths/catalog";
import {
  advancePathSnapshot,
  resolvePathRuntime,
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
  const runtime = resolvePathRuntime({ pathId: definition.id, goal });
  if (!runtime) throw new NetworkAccessError("Klinikos Path could not be resolved.", 500);

  const context = JSON.stringify(input.context ?? {});
  const empty = JSON.stringify([]);
  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    INSERT INTO "KlinikosPathInstance" (
      "id", "organizationId", "actorId", "pathId", "goal", "status", "currentNodeId",
      "completedNodeIds", "blockedNodeIds", "blockers", "context",
      "startedAt", "lastActivityAt", "createdAt", "updatedAt"
    ) VALUES (
      ${instanceId}, ${session.organizationId}, ${session.userId}, ${definition.id}, ${goal}, 'active', ${runtime.currentNodeId},
      CAST(${empty} AS JSONB), CAST(${empty} AS JSONB), CAST(${empty} AS JSONB), CAST(${context} AS JSONB),
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
    nodeId: runtime.currentNodeId,
    payload: { pathId: definition.id, goal },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "path.started",
      resourceType: "klinikos_path",
      resourceId: instanceId,
      metadata: { pathId: definition.id, currentNodeId: runtime.currentNodeId, containsPhi: false },
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

  const next = advancePathSnapshot({ snapshot, completedNodeId: input.completedNodeId });
  const completedNodeIds = JSON.stringify(next.completedNodeIds);
  const blockedNodeIds = JSON.stringify(next.blockedNodeIds);
  const blockers = JSON.stringify(next.blockers);
  const completedAt = next.status === "completed" ? new Date() : null;

  const rows = await db.$queryRaw<PathRow[]>(Prisma.sql`
    UPDATE "KlinikosPathInstance"
    SET "status" = ${next.status},
        "currentNodeId" = ${next.currentNodeId ?? null},
        "completedNodeIds" = CAST(${completedNodeIds} AS JSONB),
        "blockedNodeIds" = CAST(${blockedNodeIds} AS JSONB),
        "blockers" = CAST(${blockers} AS JSONB),
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
    payload: { pathId: snapshot.pathId, nextNodeId: next.currentNodeId },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: next.status === "completed" ? "path.completed" : "path.node_completed",
      resourceType: "klinikos_path",
      resourceId: snapshot.instanceId,
      metadata: { pathId: snapshot.pathId, nodeId: input.completedNodeId, nextNodeId: next.currentNodeId, containsPhi: false },
    },
  });

  return toSnapshot(updated);
}
