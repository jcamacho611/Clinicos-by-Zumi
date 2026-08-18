import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";

const MATERIALIZATION_ACTION = "quality.task_materialized";
const MATERIALIZATION_RESOURCE = "quality_gap";

export class QualityTaskMaterializationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type MaterializationMetadata = {
  taskId?: unknown;
};

function metadataTaskId(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const taskId = (value as MaterializationMetadata).taskId;
  return typeof taskId === "string" && taskId.trim() ? taskId.trim() : null;
}

function impactPriority(impact: string) {
  const normalized = impact.trim().toLowerCase();
  if (["critical", "urgent"].includes(normalized)) return "urgent" as const;
  if (normalized === "high") return "high" as const;
  return "normal" as const;
}

function riskForPriority(priority: "normal" | "high" | "urgent") {
  return priority === "urgent" ? RiskLevel.URGENT : priority === "high" ? RiskLevel.NEEDS_STAFF : RiskLevel.NORMAL;
}

function taskIsTerminal(status: string) {
  return ["completed", "cancelled", "closed"].includes(status.trim().toLowerCase());
}

function requireMaterializationPermissions(session: ClinicSession) {
  if (!can(session.role, "quality", "update") || !can(session.role, "tasks", "create")) {
    throw new QualityTaskMaterializationError("Quality follow-up task creation is not permitted for this role.", 403);
  }
}

export type QualityTaskMaterializationResult = {
  gapId: string;
  taskId: string;
  taskStatus: string;
  ownerId: string | null;
  created: boolean;
  idempotent: boolean;
  requiresReview: boolean;
};

export async function materializeQualityGapTask(
  session: ClinicSession,
  input: { gapId: string; ownerId?: string | null },
): Promise<QualityTaskMaterializationResult> {
  requireMaterializationPermissions(session);
  const gapId = input.gapId.trim();
  if (!gapId) throw new QualityTaskMaterializationError("Quality gap is required.");

  return db.$transaction(async (tx) => {
    // The row lock is the concurrency boundary. Every attempt for the same gap is
    // serialized before provenance is inspected or work is created, preventing two
    // simultaneous requests from materializing duplicate clinic tasks.
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
        FROM "quality_gaps"
       WHERE "id" = ${gapId}
         AND "organizationId" = ${session.organizationId}
       FOR UPDATE
    `);
    if (!locked[0]) throw new QualityTaskMaterializationError("Quality gap was not found in this organization.", 404);

    const gap = await tx.qualityGap.findFirst({
      where: { id: gapId, organizationId: session.organizationId },
    });
    if (!gap) throw new QualityTaskMaterializationError("Quality gap was not found in this organization.", 404);
    if (gap.status.trim().toLowerCase() === "closed" || gap.closedAt) {
      throw new QualityTaskMaterializationError("A closed quality gap cannot create new follow-up work.", 409);
    }

    const prior = await tx.auditLog.findFirst({
      where: {
        organizationId: session.organizationId,
        action: MATERIALIZATION_ACTION,
        resourceType: MATERIALIZATION_RESOURCE,
        resourceId: gap.id,
      },
      orderBy: { createdAt: "asc" },
      select: { metadata: true },
    });

    if (prior) {
      const taskId = metadataTaskId(prior.metadata);
      if (!taskId) {
        throw new QualityTaskMaterializationError("Existing quality-task provenance is incomplete and requires human review.", 409);
      }
      const task = await tx.task.findFirst({
        where: { id: taskId, organizationId: session.organizationId },
        select: { id: true, status: true, ownerId: true },
      });
      if (!task) {
        throw new QualityTaskMaterializationError("The quality gap is linked to a task that is no longer available. Review the audit trail before creating more work.", 409);
      }
      return {
        gapId: gap.id,
        taskId: task.id,
        taskStatus: task.status,
        ownerId: task.ownerId,
        created: false,
        idempotent: true,
        requiresReview: taskIsTerminal(task.status),
      };
    }

    // Only active organization measure metadata may label new operational work.
    // A gap tied to a retired/inactive definition stays visible, but the task uses
    // a neutral label and requires the human reviewer to resolve the governing rule.
    const measure = await tx.qualityMeasure.findFirst({
      where: { id: gap.measureId, organizationId: session.organizationId, status: "active" },
      select: { id: true, key: true, name: true, version: true },
    });

    let owner: { id: string; name: string } | null = null;
    if (input.ownerId?.trim()) {
      owner = await tx.user.findFirst({
        where: { id: input.ownerId.trim(), organizationId: session.organizationId, status: "active" },
        select: { id: true, name: true },
      });
      if (!owner) throw new QualityTaskMaterializationError("Task owner must be an active user in this organization.", 400);
    }

    const priority = impactPriority(gap.impact);
    const measureLabel = measure?.name?.trim() || "Quality follow-up";
    const task = await tx.task.create({
      data: {
        organizationId: session.organizationId,
        patientId: gap.patientId,
        category: "quality_gap",
        title: `Quality follow-up: ${measureLabel}`.slice(0, 200),
        details: "A persisted quality gap remains unresolved. Review the governing requirement and supporting evidence before resolving it. This task is operational work and does not itself establish compliance.",
        ownerId: owner?.id ?? null,
        priority,
        riskLevel: riskForPriority(priority),
        dueAt: gap.dueAt,
        status: "open",
        createdBy: session.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "task.created",
        resourceType: "task",
        resourceId: task.id,
        patientId: gap.patientId,
        metadata: {
          source: "quality_guardian",
          sourceQualityGapId: gap.id,
          ownerAssigned: Boolean(owner),
          priority,
          dueAt: gap.dueAt?.toISOString() ?? null,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: MATERIALIZATION_ACTION,
        resourceType: MATERIALIZATION_RESOURCE,
        resourceId: gap.id,
        patientId: gap.patientId,
        metadata: {
          taskId: task.id,
          measureId: gap.measureId,
          measureKey: measure?.key ?? null,
          measureVersion: measure?.version ?? null,
          activeMeasureMapped: Boolean(measure),
          ownerAssigned: Boolean(owner),
          priority,
          dueAt: gap.dueAt?.toISOString() ?? null,
          source: "persisted_quality_gap_backlog",
          complianceEstablished: false,
        },
      },
    });

    if (owner && owner.id !== session.userId) {
      await tx.notification.create({
        data: {
          organizationId: session.organizationId,
          userId: owner.id,
          type: "task_assigned",
          title: task.title,
          body: "A Quality Guardian follow-up task was assigned to you.",
        },
      });
    }

    return {
      gapId: gap.id,
      taskId: task.id,
      taskStatus: task.status,
      ownerId: task.ownerId,
      created: true,
      idempotent: false,
      requiresReview: !measure,
    };
  });
}
