import { beforeEach, describe, expect, it, vi } from "vitest";

const taskFindMany = vi.fn();
const referralFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    task: { findMany: (...args: unknown[]) => taskFindMany(...args) },
    referral: { findMany: (...args: unknown[]) => referralFindMany(...args) },
  },
}));

const { listUniversalObligations } = await import("@/lib/obligations/universal-obligation-repository");

const now = new Date("2026-09-01T20:00:00.000Z");

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    organizationId: "org-1",
    patientId: "patient-1",
    title: "Review result",
    status: "open",
    ownerId: "user-1",
    priority: "high",
    riskLevel: "NEEDS_PROVIDER",
    dueAt: new Date("2026-09-01T21:00:00.000Z"),
    completedAt: null,
    updatedAt: new Date("2026-09-01T19:00:00.000Z"),
    ...overrides,
  };
}

function referral(overrides: Record<string, unknown> = {}) {
  return {
    id: "ref-1",
    organizationId: "org-1",
    patientId: "patient-1",
    specialty: "Cardiology",
    destination: "Specialty Clinic",
    status: "sent",
    deliveryStatus: "delivered",
    followUpDueAt: new Date("2026-09-02T20:00:00.000Z"),
    closedLoopAt: null,
    updatedAt: new Date("2026-09-01T19:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  taskFindMany.mockReset().mockResolvedValue([]);
  referralFindMany.mockReset().mockResolvedValue([]);
});

describe("universal obligation repository projection", () => {
  it("reads only source-owned Task and Referral records inside the requested organization", async () => {
    await listUniversalObligations("org-1", now);

    expect(taskFindMany).toHaveBeenCalledTimes(1);
    expect(referralFindMany).toHaveBeenCalledTimes(1);
    expect(taskFindMany.mock.calls[0][0].where).toEqual({ organizationId: "org-1" });
    expect(referralFindMany.mock.calls[0][0].where).toEqual({ organizationId: "org-1" });

    const taskSelect = taskFindMany.mock.calls[0][0].select;
    const referralSelect = referralFindMany.mock.calls[0][0].select;
    expect(taskSelect).toEqual({
      id: true,
      organizationId: true,
      patientId: true,
      title: true,
      status: true,
      ownerId: true,
      priority: true,
      riskLevel: true,
      dueAt: true,
      completedAt: true,
      updatedAt: true,
    });
    expect(referralSelect).toEqual({
      id: true,
      organizationId: true,
      patientId: true,
      specialty: true,
      destination: true,
      status: true,
      deliveryStatus: true,
      followUpDueAt: true,
      closedLoopAt: true,
      updatedAt: true,
    });
    expect(referralFindMany.mock.calls[0][0].where).not.toHaveProperty("destinationOrganizationId");
  });

  it("uses a one-row probe so loaded counts never pretend to be exhaustive when a source exceeds 100", async () => {
    taskFindMany.mockResolvedValue(Array.from({ length: 101 }, (_, index) => task({ id: `task-${index}` })));
    referralFindMany.mockResolvedValue([referral()]);

    const workspace = await listUniversalObligations("org-1", now);

    expect(taskFindMany.mock.calls[0][0].take).toBe(101);
    expect(referralFindMany.mock.calls[0][0].take).toBe(101);
    expect(workspace.sourceWindowComplete).toBe(false);
    expect(workspace.obligations.filter((item) => item.sourceType === "task")).toHaveLength(100);
    expect(workspace.metrics.open).toBe(101);
  });

  it("orders open risk visibly: overdue first, then blocked, then ordinary due work, with closed work last", async () => {
    taskFindMany.mockResolvedValue([
      task({ id: "ordinary", dueAt: new Date("2026-09-02T20:00:00.000Z") }),
      task({ id: "overdue", dueAt: new Date("2026-09-01T19:00:00.000Z") }),
      task({ id: "closed", status: "completed", completedAt: new Date("2026-09-01T19:30:00.000Z") }),
    ]);
    referralFindMany.mockResolvedValue([
      referral({ id: "blocked", status: "declined", followUpDueAt: null }),
    ]);

    const workspace = await listUniversalObligations("org-1", now);

    expect(workspace.obligations.map((item) => item.sourceId)).toEqual([
      "overdue",
      "blocked",
      "ordinary",
      "closed",
    ]);
    expect(workspace.metrics).toEqual({
      open: 3,
      overdue: 1,
      blocked: 1,
      taskOpen: 2,
      referralOpen: 1,
    });
  });

  it("does not invent inbound referral visibility or expose general document/content payloads", async () => {
    await listUniversalObligations("org-1", now);

    const referralQuery = referralFindMany.mock.calls[0][0];
    expect(referralQuery.where).toEqual({ organizationId: "org-1" });
    expect(referralQuery.select).not.toHaveProperty("documents");
    expect(referralQuery.select).not.toHaveProperty("specialistResponse");
    expect(referralQuery.select).not.toHaveProperty("metadata");
    expect(referralQuery.select).not.toHaveProperty("destinationOrganizationId");
  });
});
