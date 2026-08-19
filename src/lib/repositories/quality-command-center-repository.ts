import "server-only";

import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";

const MAX_COMMAND_CENTER_GAPS = 500;
const MATERIALIZATION_ACTION = "quality.task_materialized";
const MATERIALIZATION_RESOURCE = "quality_gap";

function metadataTaskId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const taskId = (value as Record<string, unknown>).taskId;
  return typeof taskId === "string" && taskId.trim() ? taskId.trim() : null;
}

function normalized(value: string) { return value.trim().toLowerCase(); }
function highImpact(value: string) { return ["high", "critical", "urgent"].includes(normalized(value)); }
function terminalTask(value: string) { return ["completed", "cancelled", "closed"].includes(normalized(value)); }

export type QualityCommandCenterGap = {
  id: string;
  patient: { id: string; displayName: string; mrn: string };
  measure: { id: string; name: string; key: string | null; version: string | null; mapped: boolean };
  dueAt: string | null;
  impact: string;
  workflowStatus: string;
  timing: "overdue" | "due_soon" | "open";
  task: null | { id: string; status: string; priority: string; dueAt: string | null; owner: { id: string; name: string } | null };
  requiresReview: boolean;
};

export type QualityCommandCenterWorkspace = {
  complete: boolean;
  coverage: "persisted_active_quality_gap_backlog";
  canMaterializeTasks: boolean;
  summary: null | { open: number; overdue: number; dueSoon: number; highImpact: number; materialized: number; unassigned: number; humanReview: number };
  gaps: QualityCommandCenterGap[];
  warnings: string[];
};

export async function listQualityCommandCenter(session: ClinicSession): Promise<QualityCommandCenterWorkspace> {
  if (!can(session.role, "quality", "read")) {
    return { complete: false, coverage: "persisted_active_quality_gap_backlog", canMaterializeTasks: false, summary: null, gaps: [], warnings: ["Quality operations are not authorized for this role."] };
  }

  const canMaterializeTasks = can(session.role, "quality", "update") && can(session.role, "tasks", "create");
  const gaps = await db.qualityGap.findMany({
    where: { organizationId: session.organizationId, status: { not: "closed" } },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    take: MAX_COMMAND_CENTER_GAPS + 1,
  });

  if (gaps.length > MAX_COMMAND_CENTER_GAPS) {
    return {
      complete: false,
      coverage: "persisted_active_quality_gap_backlog",
      canMaterializeTasks,
      summary: null,
      gaps: [],
      warnings: [
        `The active quality backlog exceeds the ${MAX_COMMAND_CENTER_GAPS}-record command-center boundary. No partial totals are shown.`,
        "Use a governed cohort/filter workflow before relying on command-center totals.",
      ],
    };
  }

  const measureIds = [...new Set(gaps.map((gap) => gap.measureId))];
  const patientIds = [...new Set(gaps.map((gap) => gap.patientId))];
  const gapIds = gaps.map((gap) => gap.id);

  const [measures, patients, materializationAudits] = await Promise.all([
    measureIds.length
      ? db.qualityMeasure.findMany({
          where: { organizationId: session.organizationId, id: { in: measureIds }, status: "active" },
          select: { id: true, key: true, name: true, version: true },
        })
      : Promise.resolve([]),
    patientIds.length
      ? db.patient.findMany({
          where: { organizationId: session.organizationId, id: { in: patientIds } },
          select: { id: true, firstName: true, lastName: true, preferredName: true, mrn: true },
        })
      : Promise.resolve([]),
    gapIds.length
      ? db.auditLog.findMany({
          where: { organizationId: session.organizationId, action: MATERIALIZATION_ACTION, resourceType: MATERIALIZATION_RESOURCE, resourceId: { in: gapIds } },
          select: { resourceId: true, metadata: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const measureById = new Map(measures.map((measure) => [measure.id, measure]));
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const missingPatientIds = patientIds.filter((patientId) => !patientById.has(patientId));
  if (missingPatientIds.length) {
    return {
      complete: false,
      coverage: "persisted_active_quality_gap_backlog",
      canMaterializeTasks,
      summary: null,
      gaps: [],
      warnings: [
        `${missingPatientIds.length} quality subject(s) could not be resolved inside the active organization. No partial command-center totals are shown.`,
        "Review data integrity before relying on this quality backlog.",
      ],
    };
  }

  const taskIdByGapId = new Map<string, string>();
  for (const audit of materializationAudits) {
    if (taskIdByGapId.has(audit.resourceId)) continue;
    const taskId = metadataTaskId(audit.metadata);
    if (taskId) taskIdByGapId.set(audit.resourceId, taskId);
  }

  const taskIds = [...new Set(taskIdByGapId.values())];
  const tasks = taskIds.length
    ? await db.task.findMany({ where: { organizationId: session.organizationId, id: { in: taskIds } }, select: { id: true, status: true, priority: true, dueAt: true, ownerId: true } })
    : [];
  const ownerIds = [...new Set(tasks.map((task) => task.ownerId).filter((value): value is string => Boolean(value)))];
  const owners = ownerIds.length
    ? await db.user.findMany({ where: { organizationId: session.organizationId, id: { in: ownerIds }, status: "active" }, select: { id: true, name: true } })
    : [];
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

  const now = Date.now();
  const dueSoonBoundary = now + 7 * 24 * 60 * 60 * 1000;
  let unmappedMeasureCount = 0;

  const projected = gaps.map<QualityCommandCenterGap>((gap) => {
    const patient = patientById.get(gap.patientId)!;
    const measure = measureById.get(gap.measureId);
    if (!measure) unmappedMeasureCount += 1;
    const linkedTaskId = taskIdByGapId.get(gap.id) ?? null;
    const linkedTask = linkedTaskId ? taskById.get(linkedTaskId) ?? null : null;
    const dueTime = gap.dueAt?.getTime() ?? null;
    const timing = dueTime !== null && dueTime < now ? "overdue" as const : dueTime !== null && dueTime <= dueSoonBoundary ? "due_soon" as const : "open" as const;
    const owner = linkedTask?.ownerId ? ownerById.get(linkedTask.ownerId) ?? null : null;

    return {
      id: gap.id,
      patient: { id: patient.id, displayName: patient.preferredName?.trim() || `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn },
      measure: { id: gap.measureId, name: measure?.name ?? "Unmapped quality requirement", key: measure?.key ?? null, version: measure?.version?.trim() || null, mapped: Boolean(measure) },
      dueAt: gap.dueAt?.toISOString() ?? null,
      impact: gap.impact,
      workflowStatus: gap.status,
      timing,
      task: linkedTask ? { id: linkedTask.id, status: linkedTask.status, priority: linkedTask.priority, dueAt: linkedTask.dueAt?.toISOString() ?? null, owner: owner ? { id: owner.id, name: owner.name } : null } : null,
      requiresReview: highImpact(gap.impact) || !measure || Boolean(linkedTask && terminalTask(linkedTask.status)),
    };
  });

  const summary = {
    open: projected.length,
    overdue: projected.filter((gap) => gap.timing === "overdue").length,
    dueSoon: projected.filter((gap) => gap.timing === "due_soon").length,
    highImpact: projected.filter((gap) => highImpact(gap.impact)).length,
    materialized: projected.filter((gap) => Boolean(gap.task)).length,
    unassigned: projected.filter((gap) => gap.task && !gap.task.owner).length,
    humanReview: projected.filter((gap) => gap.requiresReview).length,
  };

  const warnings = [
    "Coverage is the persisted active QualityGap backlog only. This view does not represent a complete CMS, NCQA, HEDIS, MIPS, Stars, ACO, or payer-program calculation.",
    "A task records operational follow-up. It is not evidence that a measure is satisfied or that the organization is compliant.",
  ];
  if (unmappedMeasureCount) warnings.push(`${unmappedMeasureCount} open gap(s) do not map to an active organization quality-measure record.`);

  return { complete: true, coverage: "persisted_active_quality_gap_backlog", canMaterializeTasks, summary, gaps: projected, warnings };
}
