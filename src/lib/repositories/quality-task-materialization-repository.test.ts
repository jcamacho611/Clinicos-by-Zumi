import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const queryRaw = vi.fn();
const qualityGapFindFirst = vi.fn();
const qualityMeasureFindFirst = vi.fn();
const auditFindFirst = vi.fn();
const auditCreate = vi.fn();
const taskFindFirst = vi.fn();
const taskCreate = vi.fn();
const userFindFirst = vi.fn();
const notificationCreate = vi.fn();
const transaction = vi.fn(async (callback: (tx: unknown) => unknown) => callback(tx));

const tx = {
  $queryRaw: (...args: unknown[]) => queryRaw(...args),
  qualityGap: { findFirst: (...args: unknown[]) => qualityGapFindFirst(...args) },
  qualityMeasure: { findFirst: (...args: unknown[]) => qualityMeasureFindFirst(...args) },
  auditLog: {
    findFirst: (...args: unknown[]) => auditFindFirst(...args),
    create: (...args: unknown[]) => auditCreate(...args),
  },
  task: {
    findFirst: (...args: unknown[]) => taskFindFirst(...args),
    create: (...args: unknown[]) => taskCreate(...args),
  },
  user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
  notification: { create: (...args: unknown[]) => notificationCreate(...args) },
};

vi.mock("@/lib/db", () => ({
  db: { $transaction: (...args: unknown[]) => transaction(...args) },
}));

const { materializeQualityGapTask, QualityTaskMaterializationError } = await import(
  "@/lib/repositories/quality-task-materialization-repository"
);

const now = new Date("2026-08-18T18:30:00Z");

function session(role: ClinicSession["role"] = "quality"): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-quality",
    organizationId: "org-a",
    organizationName: "Clinic A",
    organizationSlug: "clinic-a",
    email: "quality@example.invalid",
    name: "Quality User",
    role,
    demo: true,
    expiresAt: now.getTime() + 60_000,
  };
}

function gap(overrides: Record<string, unknown> = {}) {
  return {
    id: "gap-1",
    organizationId: "org-a",
    patientId: "patient-1",
    measureId: "measure-1",
    dueAt: new Date("2026-08-20T12:00:00Z"),
    impact: "high",
    status: "open",
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queryRaw.mockResolvedValue([{ id: "gap-1" }]);
  qualityGapFindFirst.mockResolvedValue(gap());
  qualityMeasureFindFirst.mockResolvedValue({ id: "measure-1", key: "internal.followup", name: "Follow-up review", version: "2026.1" });
  auditFindFirst.mockResolvedValue(null);
  taskFindFirst.mockResolvedValue(null);
  taskCreate.mockResolvedValue({ id: "task-1", status: "open", ownerId: null, title: "Quality follow-up: Follow-up review" });
  userFindFirst.mockResolvedValue(null);
  auditCreate.mockResolvedValue({ id: "audit-1" });
  notificationCreate.mockResolvedValue({ id: "notification-1" });
});

describe("Quality Guardian durable task materialization", () => {
  it("fails before database work when the role cannot update quality", async () => {
    await expect(materializeQualityGapTask(session("front_desk"), { gapId: "gap-1" }))
      .rejects.toMatchObject({ status: 403 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("fails closed when the gap is outside the active organization", async () => {
    queryRaw.mockResolvedValue([]);
    await expect(materializeQualityGapTask(session(), { gapId: "gap-other-tenant" }))
      .rejects.toMatchObject({ status: 404 });
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it("does not create work for a closed gap", async () => {
    qualityGapFindFirst.mockResolvedValue(gap({ status: "closed", closedAt: now }));
    await expect(materializeQualityGapTask(session(), { gapId: "gap-1" }))
      .rejects.toMatchObject({ status: 409 });
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it("creates one unassigned operational task without pretending the gap is compliant", async () => {
    const result = await materializeQualityGapTask(session(), { gapId: "gap-1" });

    expect(result).toEqual({
      gapId: "gap-1",
      taskId: "task-1",
      taskStatus: "open",
      ownerId: null,
      created: true,
      idempotent: false,
      requiresReview: false,
    });
    expect(taskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: "org-a",
        patientId: "patient-1",
        category: "quality_gap",
        ownerId: null,
        priority: "high",
        status: "open",
      }),
    }));
    const materializationAudit = auditCreate.mock.calls.find(([input]) => input.data.action === "quality.task_materialized")?.[0];
    expect(materializationAudit.data.metadata).toMatchObject({ taskId: "task-1", complianceEstablished: false });
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it("returns the already-linked task idempotently instead of creating a duplicate", async () => {
    auditFindFirst.mockResolvedValue({ metadata: { taskId: "task-existing" } });
    taskFindFirst.mockResolvedValue({ id: "task-existing", status: "open", ownerId: "owner-1" });

    const result = await materializeQualityGapTask(session(), { gapId: "gap-1" });

    expect(result).toMatchObject({ taskId: "task-existing", created: false, idempotent: true, requiresReview: false });
    expect(taskCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("surfaces human review when the linked task is closed but the quality gap remains open", async () => {
    auditFindFirst.mockResolvedValue({ metadata: { taskId: "task-existing" } });
    taskFindFirst.mockResolvedValue({ id: "task-existing", status: "completed", ownerId: "owner-1" });

    const result = await materializeQualityGapTask(session(), { gapId: "gap-1" });

    expect(result).toMatchObject({ taskId: "task-existing", idempotent: true, requiresReview: true });
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it("refuses to guess or accept a cross-tenant task owner", async () => {
    userFindFirst.mockResolvedValue(null);
    await expect(materializeQualityGapTask(session(), { gapId: "gap-1", ownerId: "user-other-org" }))
      .rejects.toBeInstanceOf(QualityTaskMaterializationError);
    expect(userFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-other-org", organizationId: "org-a", status: "active" },
    }));
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it("assigns only an explicitly selected active organization user and emits a notification", async () => {
    userFindFirst.mockResolvedValue({ id: "owner-2", name: "Quality Owner" });
    taskCreate.mockResolvedValue({ id: "task-1", status: "open", ownerId: "owner-2", title: "Quality follow-up: Follow-up review" });

    const result = await materializeQualityGapTask(session(), { gapId: "gap-1", ownerId: "owner-2" });

    expect(result.ownerId).toBe("owner-2");
    expect(notificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organizationId: "org-a", userId: "owner-2", type: "task_assigned" }),
    }));
  });

  it("fails closed when provenance exists but its linked task cannot be found", async () => {
    auditFindFirst.mockResolvedValue({ metadata: { taskId: "missing-task" } });
    taskFindFirst.mockResolvedValue(null);

    await expect(materializeQualityGapTask(session(), { gapId: "gap-1" }))
      .rejects.toMatchObject({ status: 409 });
    expect(taskCreate).not.toHaveBeenCalled();
  });
});
