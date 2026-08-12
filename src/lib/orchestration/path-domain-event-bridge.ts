import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getKlinikosPath } from "@/lib/paths/catalog";
import { trustedRulesForEvent } from "@/lib/orchestration/path-domain-event-rules";
import { advancePathSnapshot } from "@/lib/orchestration/path-engine";
import { listActivePathSnapshots } from "@/lib/orchestration/path-persistence-repository";

export async function recordTrustedPathDomainEvent(
  session: ClinicSession,
  input: { eventType: string; sourceType: string; sourceId?: string | null; metadata?: Record<string, unknown> },
) {
  const rules = trustedRulesForEvent(input.eventType);
  if (!rules.length) return [];

  const active = await listActivePathSnapshots(session);
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
        AND "actorId" = ${session.userId}
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
          containsPhi: false,
        },
      },
    });
    advanced.push(snapshot.instanceId);
  }

  return advanced;
}
