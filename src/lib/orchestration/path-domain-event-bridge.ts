import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getKlinikosPath } from "@/lib/paths/catalog";
import { trustedRulesForEvent } from "@/lib/orchestration/path-domain-event-rules";
import { advancePathSnapshot, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";

type ActivePathRow = {
  id: string;
  pathId: string;
  goal: string;
  status: PersistedPathSnapshot["status"];
  currentNodeId: string | null;
  completedNodeIds: unknown;
  blockedNodeIds: unknown;
  blockers: unknown;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toSnapshot(row: ActivePathRow): PersistedPathSnapshot {
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

async function listActivePathsForActor(session: ClinicSession, actorId: string) {
  const rows = await db.$queryRaw<ActivePathRow[]>(Prisma.sql`
    SELECT "id", "pathId", "goal", "status", "currentNodeId", "completedNodeIds", "blockedNodeIds", "blockers"
    FROM "KlinikosPathInstance"
    WHERE "actorId" = ${actorId}
      AND "organizationId" = ${session.organizationId}
      AND "status" IN ('active','blocked','paused')
    ORDER BY "lastActivityAt" DESC
    LIMIT 12
  `);
  return rows.map(toSnapshot);
}

/**
 * Advance a Path from a server-trusted domain transition.
 *
 * `targetActorId` is intentionally internal-only. API callers never supply it
 * directly. It exists for legitimate cross-actor workflows such as an instructor
 * releasing a student's competency or a credentialing administrator verifying a
 * provider. Organization scope remains fixed to the acting session.
 */
export async function recordTrustedPathDomainEvent(
  session: ClinicSession,
  input: {
    eventType: string;
    sourceType: string;
    sourceId?: string | null;
    targetActorId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const rules = trustedRulesForEvent(input.eventType);
  if (!rules.length) return [];

  const targetActorId = input.targetActorId ?? session.userId;
  const active = await listActivePathsForActor(session, targetActorId);
  const advanced: string[] = [];

  for (const snapshot of active) {
    const rule = rules.find((candidate) => candidate.pathId === snapshot.pathId && candidate.nodeId === snapshot.currentNodeId);
    if (!rule) continue;

    const definition = getKlinikosPath(snapshot.pathId);
    if (!definition?.nodes.some((node) => node.id === rule.nodeId)) continue;

    const next = advancePathSnapshot({ snapshot, completedNodeId: rule.nodeId });
    const completedNodeIds = JSON.stringify(next.completedNodeIds);
    const blockedNodeIds = JSON.stringify(next.blockedNodeIds);
    const blockers = JSON.stringify(next.blockers);
    const eventPayload = JSON.stringify({
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      domainEventType: input.eventType,
      performedByActorId: session.userId,
      targetActorId,
      ...(input.metadata ?? {}),
    });

    const count = await db.$executeRaw(Prisma.sql`
      UPDATE "KlinikosPathInstance"
      SET "status" = ${next.status},
          "currentNodeId" = ${next.currentNodeId ?? null},
          "completedNodeIds" = CAST(${completedNodeIds} AS JSONB),
          "blockedNodeIds" = CAST(${blockedNodeIds} AS JSONB),
          "blockers" = CAST(${blockers} AS JSONB),
          "lastActivityAt" = CURRENT_TIMESTAMP,
          "completedAt" = CASE WHEN ${next.status} = 'completed' THEN CURRENT_TIMESTAMP ELSE "completedAt" END,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${snapshot.instanceId}
        AND "actorId" = ${targetActorId}
        AND "organizationId" = ${session.organizationId}
        AND "currentNodeId" = ${rule.nodeId}
        AND "status" IN ('active','blocked','paused')
    `);
    if (count === 0) continue;

    await db.$executeRaw(Prisma.sql`
      INSERT INTO "KlinikosPathEvent" (
        "id", "instanceId", "organizationId", "actorId", "eventType", "nodeId", "payload", "occurredAt"
      ) VALUES (
        ${randomUUID()}, ${snapshot.instanceId}, ${session.organizationId}, ${session.userId},
        ${next.status === "completed" ? "path.completed_from_domain_event" : "path.node_completed_from_domain_event"},
        ${rule.nodeId}, CAST(${eventPayload} AS JSONB), CURRENT_TIMESTAMP
      )
    `);

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: next.status === "completed" ? "path.completed_from_domain_event" : "path.node_completed_from_domain_event",
        resourceType: "klinikos_path",
        resourceId: snapshot.instanceId,
        metadata: {
          pathId: snapshot.pathId,
          nodeId: rule.nodeId,
          nextNodeId: next.currentNodeId,
          domainEventType: input.eventType,
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          targetActorId,
          containsPhi: false,
        },
      },
    });
    advanced.push(snapshot.instanceId);
  }

  return advanced;
}
