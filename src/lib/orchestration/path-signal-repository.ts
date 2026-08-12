import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getKlinikosPath } from "@/lib/paths/catalog";

export type LivingPathSignal = {
  id: string;
  pathId: string;
  pathTitle: string;
  nodeId: string | null;
  nodeLabel: string | null;
  kind: "started" | "advanced" | "completed";
  label: string;
  occurredAt: string;
};

type PathSignalRow = {
  id: string;
  pathId: string;
  eventType: string;
  nodeId: string | null;
  occurredAt: Date;
};

export function pathSignalKind(eventType: string): LivingPathSignal["kind"] {
  if (eventType.includes("completed")) return eventType.startsWith("path.completed") ? "completed" : "advanced";
  if (eventType === "path.started") return "started";
  return "advanced";
}

export function pathSignalLabel(input: { kind: LivingPathSignal["kind"]; pathTitle: string; nodeLabel: string | null }) {
  if (input.kind === "started") return `${input.pathTitle} started`;
  if (input.kind === "completed") return `${input.pathTitle} completed`;
  return input.nodeLabel ? `${input.nodeLabel} completed` : `${input.pathTitle} moved forward`;
}

export async function listRecentPathSignals(session: ClinicSession, limit = 6): Promise<LivingPathSignal[]> {
  const safeLimit = Math.max(1, Math.min(limit, 12));
  const rows = await db.$queryRaw<PathSignalRow[]>(Prisma.sql`
    SELECT event."id", instance."pathId", event."eventType", event."nodeId", event."occurredAt"
    FROM "KlinikosPathEvent" event
    INNER JOIN "KlinikosPathInstance" instance ON instance."id" = event."instanceId"
    WHERE instance."organizationId" = ${session.organizationId}
      AND instance."actorId" = ${session.userId}
      AND event."eventType" IN (
        'path.started',
        'path.node_completed',
        'path.completed',
        'path.node_completed_from_domain_event',
        'path.completed_from_domain_event'
      )
    ORDER BY event."occurredAt" DESC
    LIMIT ${safeLimit}
  `);

  return rows.flatMap((row) => {
    const definition = getKlinikosPath(row.pathId);
    if (!definition) return [];
    const nodeLabel = row.nodeId ? definition.nodes.find((node) => node.id === row.nodeId)?.label ?? null : null;
    const kind = pathSignalKind(row.eventType);
    return [{
      id: row.id,
      pathId: row.pathId,
      pathTitle: definition.title,
      nodeId: row.nodeId,
      nodeLabel,
      kind,
      label: pathSignalLabel({ kind, pathTitle: definition.title, nodeLabel }),
      occurredAt: row.occurredAt.toISOString(),
    }];
  });
}
