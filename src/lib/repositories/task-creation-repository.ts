import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import type { CreateTaskInput } from "@/lib/task-create-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function riskForPriority(priority: CreateTaskInput["priority"]) {
  return priority === "urgent" ? RiskLevel.URGENT : priority === "high" ? RiskLevel.NEEDS_STAFF : RiskLevel.NORMAL;
}

export async function listTaskCreationOptions(session: ClinicSession) {
  if (!can(session.role, "tasks", "create")) throw new NetworkAccessError("Task creation permission is required.", 403);
  const [patients, users] = await Promise.all([
    db.patient.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, firstName: true, lastName: true, mrn: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.user.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, name: true, roleKey: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    patients: patients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })),
    users,
    currentUserId: session.userId,
  };
}

export async function createTaskForOrganization(session: ClinicSession, fields: CreateTaskInput) {
  if (!can(session.role, "tasks", "create")) throw new NetworkAccessError("Task creation permission is required.", 403);

  return db.$transaction(async (tx) => {
    const patient = fields.patientId
      ? await tx.patient.findFirst({ where: { id: fields.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } })
      : null;
    if (fields.patientId && !patient) throw new NetworkAccessError("Patient not found for this organization.", 404);

    const ownerId = fields.ownerId ?? session.userId;
    const owner = await tx.user.findFirst({ where: { id: ownerId, organizationId: session.organizationId, status: "active" }, select: { id: true, name: true } });
    if (!owner) throw new NetworkAccessError("Task owner not found for this organization.", 404);

    const dueAt = fields.dueAt ? new Date(fields.dueAt) : null;
    const task = await tx.task.create({
      data: {
        organizationId: session.organizationId,
        patientId: patient?.id ?? null,
        category: fields.category,
        title: fields.title,
        details: fields.details || null,
        ownerId: owner.id,
        priority: fields.priority,
        riskLevel: riskForPriority(fields.priority),
        dueAt,
        status: "open",
        createdBy: session.userId,
      },
    });

    if (owner.id !== session.userId) {
      await tx.notification.create({
        data: {
          organizationId: session.organizationId,
          userId: owner.id,
          type: "task_assigned",
          title: fields.title,
          body: fields.details ? fields.details.slice(0, 500) : "A Klinikos task was assigned to you.",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "task.created",
        resourceType: "task",
        resourceId: task.id,
        patientId: patient?.id ?? null,
        metadata: {
          ownerId: owner.id,
          ownerName: owner.name,
          category: fields.category,
          priority: fields.priority,
          dueAt: dueAt?.toISOString() ?? null,
        },
      },
    });

    return task;
  });
}
