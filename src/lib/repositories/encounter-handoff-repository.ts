import "server-only";

import type { Prisma } from "@prisma/client";
import type { EncounterStaffHandoffProjection } from "@/lib/clinical/encounter-handoff-types";
import { db } from "@/lib/db";
import { findLatestVitalForEncounter } from "@/lib/repositories/vital-repository";

const medicationReconciliationSelect = {
  id: true,
  status: true,
  source: true,
  summary: true,
  discrepancies: true,
  medicationIds: true,
  completedAt: true,
  updatedAt: true,
} as const satisfies Prisma.MedicationReconciliationSelect;

const formSubmissionSelect = {
  id: true,
  templateId: true,
  status: true,
  completionPercent: true,
  currentReviewStage: true,
  updatedAt: true,
} as const satisfies Prisma.FormSubmissionSelect;

const formTemplateSelect = {
  id: true,
  name: true,
  category: true,
} as const satisfies Prisma.FormTemplateSelect;

const taskSelect = {
  id: true,
  title: true,
  category: true,
  status: true,
  riskLevel: true,
  ownerId: true,
  dueAt: true,
  completedAt: true,
} as const satisfies Prisma.TaskSelect;

function jsonArrayCount(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.length : 0;
}

export async function getEncounterStaffHandoffProjection(
  encounterId: string,
  patientId: string,
  organizationId: string,
): Promise<EncounterStaffHandoffProjection> {
  const [vital, reconciliation, submissions, tasks] = await Promise.all([
    findLatestVitalForEncounter(encounterId, patientId, organizationId),
    db.medicationReconciliation.findFirst({
      where: { organizationId, patientId, encounterId },
      select: medicationReconciliationSelect,
      orderBy: { updatedAt: "desc" },
    }),
    db.formSubmission.findMany({
      where: { organizationId, patientId, encounterId },
      select: formSubmissionSelect,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.task.findMany({
      where: { organizationId, patientId, encounterId },
      select: taskSelect,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const templateIds = [...new Set(submissions.map((submission) => submission.templateId))];
  const templates = templateIds.length > 0
    ? await db.formTemplate.findMany({
        where: { organizationId, id: { in: templateIds } },
        select: formTemplateSelect,
      })
    : [];
  const templateById = new Map(templates.map((template) => [template.id, template]));

  return {
    vital,
    medicationReconciliation: reconciliation
      ? {
          id: reconciliation.id,
          status: reconciliation.status,
          source: reconciliation.source,
          summary: reconciliation.summary,
          discrepancyCount: jsonArrayCount(reconciliation.discrepancies),
          medicationCount: reconciliation.medicationIds.length,
          completedAt: reconciliation.completedAt?.toISOString() ?? null,
          updatedAt: reconciliation.updatedAt.toISOString(),
        }
      : null,
    forms: submissions.map((submission) => {
      const template = templateById.get(submission.templateId);
      return {
        id: submission.id,
        templateName: template?.name ?? "Unknown form",
        category: template?.category ?? "general",
        status: submission.status,
        completionPercent: submission.completionPercent,
        reviewStage: submission.currentReviewStage,
        updatedAt: submission.updatedAt.toISOString(),
      };
    }),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      category: task.category,
      status: task.status,
      riskLevel: task.riskLevel,
      ownerAssigned: Boolean(task.ownerId),
      dueAt: task.dueAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
    })),
  };
}
