import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const qualityGapFindMany = vi.fn();
const qualityMeasureFindMany = vi.fn();
const qualityMeasureCount = vi.fn();
const patientFindMany = vi.fn();
const auditFindMany = vi.fn();
const taskFindMany = vi.fn();
const userFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    qualityGap: { findMany: (...args: unknown[]) => qualityGapFindMany(...args) },
    qualityMeasure: {
      findMany: (...args: unknown[]) => qualityMeasureFindMany(...args),
      // Counted so an organization with no configured measures is distinguishable from
      // one that simply has nothing open.
      count: (...args: unknown[]) => qualityMeasureCount(...args),
    },
    patient: { findMany: (...args: unknown[]) => patientFindMany(...args) },
    auditLog: { findMany: (...args: unknown[]) => auditFindMany(...args) },
    task: { findMany: (...args: unknown[]) => taskFindMany(...args) },
    user: { findMany: (...args: unknown[]) => userFindMany(...args) },
  },
}));

const { listQualityCommandCenter } = await import("@/lib/repositories/quality-command-center-repository");

const now = new Date();

function session(role: ClinicSession["role"] = "quality"): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "quality-user",
    organizationId: "org-a",
    organizationName: "Clinic A",
    organizationSlug: "clinic-a",
    email: "quality@example.invalid",
    name: "Quality User",
    role,
    demo: true,
    expiresAt: Date.now() + 60_000,
  };
}

function gap(overrides: Record<string, unknown> = {}) {
  return {
    id: "gap-1",
    organizationId: "org-a",
    patientId: "patient-1",
    measureId: "measure-1",
    dueAt: new Date(Date.now() - 60_000),
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
  qualityGapFindMany.mockResolvedValue([gap()]);
  qualityMeasureFindMany.mockResolvedValue([{ id: "measure-1", key: "internal.followup", name: "Follow-up review", version: "2026.1" }]);
  patientFindMany.mockResolvedValue([{ id: "patient-1", firstName: "Maria", lastName: "Example", preferredName: null, mrn: "MRN-1" }]);
  auditFindMany.mockResolvedValue([]);
  taskFindMany.mockResolvedValue([]);
  userFindMany.mockResolvedValue([]);
});

describe("Quality Command Center projection", () => {
  it("does not query quality data for a role without quality read access", async () => {
    const result = await listQualityCommandCenter(session("front_desk"));
    expect(result.complete).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.gaps).toEqual([]);
    expect(qualityGapFindMany).not.toHaveBeenCalled();
  });

  it("scopes gaps, measures, patients, provenance, tasks and owners to the active organization", async () => {
    auditFindMany.mockResolvedValue([{ resourceId: "gap-1", metadata: { taskId: "task-1" }, createdAt: now }]);
    taskFindMany.mockResolvedValue([{ id: "task-1", status: "open", priority: "high", dueAt: now, ownerId: "owner-1" }]);
    userFindMany.mockResolvedValue([{ id: "owner-1", name: "Quality Owner" }]);

    const result = await listQualityCommandCenter(session());

    expect(result.complete).toBe(true);
    expect(result.summary).toMatchObject({ open: 1, overdue: 1, highImpact: 1, materialized: 1, unassigned: 0, humanReview: 1 });
    expect(result.gaps[0]).toMatchObject({
      id: "gap-1",
      patient: { id: "patient-1", displayName: "Maria Example", mrn: "MRN-1" },
      measure: { name: "Follow-up review", version: "2026.1", mapped: true },
      task: { id: "task-1", owner: { id: "owner-1", name: "Quality Owner" } },
    });
    expect(qualityGapFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { organizationId: "org-a", status: { not: "closed" } },
      take: 501,
    }));
    expect(patientFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a" }) }));
    expect(taskFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a" }) }));
    expect(userFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a" }) }));
  });

  it("refuses partial totals when the active backlog exceeds the command-center bound", async () => {
    qualityGapFindMany.mockResolvedValue(Array.from({ length: 501 }, (_, index) => gap({ id: `gap-${index}` })));
    const result = await listQualityCommandCenter(session());
    expect(result.complete).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.gaps).toEqual([]);
    expect(result.warnings[0]).toContain("No partial totals");
    expect(qualityMeasureFindMany).not.toHaveBeenCalled();
  });

  it("fails closed when a quality subject cannot be resolved within tenant scope", async () => {
    patientFindMany.mockResolvedValue([]);
    const result = await listQualityCommandCenter(session());
    expect(result.complete).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.gaps).toEqual([]);
    expect(result.warnings.join(" ")).toContain("No partial command-center totals");
    expect(taskFindMany).not.toHaveBeenCalled();
  });

  it("keeps unmapped requirements visible and marks them for human review", async () => {
    qualityMeasureFindMany.mockResolvedValue([]);
    const result = await listQualityCommandCenter(session());
    expect(result.complete).toBe(true);
    expect(result.gaps[0].measure).toMatchObject({ name: "Unmapped quality requirement", mapped: false });
    expect(result.gaps[0].requiresReview).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("do not map"))).toBe(true);
  });

  it("never represents task creation as evidence of compliance", async () => {
    auditFindMany.mockResolvedValue([{ resourceId: "gap-1", metadata: { taskId: "task-1" }, createdAt: now }]);
    taskFindMany.mockResolvedValue([{ id: "task-1", status: "completed", priority: "high", dueAt: now, ownerId: null }]);

    const result = await listQualityCommandCenter(session());

    expect(result.gaps[0].workflowStatus).toBe("open");
    expect(result.gaps[0].task?.status).toBe("completed");
    expect(result.gaps[0].requiresReview).toBe(true);
    expect(result.warnings.join(" ")).toContain("not evidence");
  });

  it("exposes task materialization only when both quality update and task-create permissions exist", async () => {
    const provider = await listQualityCommandCenter(session("provider"));
    const viewer = await listQualityCommandCenter(session("viewer"));
    expect(provider.canMaterializeTasks).toBe(true);
    expect(viewer.canMaterializeTasks).toBe(false);
  });
});
