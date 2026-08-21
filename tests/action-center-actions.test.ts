import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const taskFindMany = vi.fn();
const taskCount = vi.fn();
const escalationFindMany = vi.fn();
const escalationCount = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    task: { findMany: (...a: unknown[]) => taskFindMany(...a), count: (...a: unknown[]) => taskCount(...a) },
    escalation: { findMany: (...a: unknown[]) => escalationFindMany(...a), count: (...a: unknown[]) => escalationCount(...a) },
  },
}));

const { getActionCenter } = await import("@/lib/home/action-center");

const viewer = (role: ClinicRole = "clinic_owner") => ({ organizationId: "org-1", userId: "u1", role });
const now = new Date("2026-06-15T12:00:00Z");

function stub(rows: { mine?: unknown[]; others?: unknown[]; escalations?: unknown[] }) {
  const mine = rows.mine ?? [];
  const others = rows.others ?? [];
  taskFindMany.mockResolvedValueOnce(mine).mockResolvedValueOnce(others).mockResolvedValueOnce([]);
  escalationFindMany.mockResolvedValue(rows.escalations ?? []);
  taskCount.mockResolvedValueOnce(mine.length).mockResolvedValueOnce(others.length).mockResolvedValueOnce(0);
  escalationCount.mockResolvedValue((rows.escalations ?? []).length);
}

beforeEach(() => {
  taskFindMany.mockReset().mockResolvedValue([]);
  escalationFindMany.mockReset().mockResolvedValue([]);
  taskCount.mockReset().mockResolvedValue(0);
  escalationCount.mockReset().mockResolvedValue(0);
});

/**
 * The Action Center could not act. Every item linked away, so the one screen built to
 * answer "what needs me" could do nothing about the answer. These cover which controls
 * the server offers, because the browser must never be the one deciding that — the API
 * re-checks the same permission either way, so this governs what is offered, not what
 * is allowed.
 */
describe("action center actions", () => {
  it("offers claim on an unowned task and nothing else", () => {
    // Unfinished work stays visible until it has an owner, so an unowned task is the
    // one item a passer-by can genuinely resolve.
    stub({ others: [{ id: "t1", title: "Chase the lab", dueAt: null, ownerId: null }] });
    return getActionCenter(viewer(), now).then((center) => {
      const item = center.buckets?.find((b) => b.key === "waiting_on_others")?.items[0];
      expect(item?.canClaim).toBe(true);
      expect(item?.canComplete).toBe(false);
      expect(item?.taskId).toBe("t1");
    });
  });

  it("does not offer to claim work somebody else already owns", async () => {
    stub({ others: [{ id: "t2", title: "Their task", dueAt: null, ownerId: "someone-else" }] });
    const item = (await getActionCenter(viewer(), now)).buckets?.find((b) => b.key === "waiting_on_others")?.items[0];
    expect(item?.canClaim).toBe(false);
    expect(item?.canComplete).toBe(false);
  });

  it("offers complete on a task already assigned to the viewer", async () => {
    stub({ mine: [{ id: "t3", title: "Yours", dueAt: null }] });
    const item = (await getActionCenter(viewer(), now)).buckets?.[0].items[0];
    expect(item?.canComplete).toBe(true);
    expect(item?.canClaim).toBe(false);
  });

  it("never offers an inline action on an escalation", async () => {
    // An escalation exists because something needed a human to look at it. A one-tap
    // resolve on a glanceable list is exactly how that stops happening, so these route
    // to the review surface where the reviewer and their note are recorded.
    stub({ escalations: [{ id: "e1", category: "missing_result", riskLevel: "HIGH", assignedTeam: "care_team", createdAt: now }] });
    const item = (await getActionCenter(viewer(), now)).buckets?.[0].items.find((entry) => entry.id.startsWith("escalation-"));
    expect(item?.canClaim).toBe(false);
    expect(item?.canComplete).toBe(false);
    expect(item?.taskId, "an escalation carries no task to act on").toBeNull();
  });

  it("offers no controls to a role that cannot update tasks", async () => {
    // `viewer` reads tasks but cannot write them. Rendering a control it would be
    // refused is a dead button, and the API refusal is not a user experience.
    const { can } = await import("@/lib/auth/rbac");
    expect(can("viewer", "tasks", "read"), "precondition: viewer can see tasks").toBe(true);
    expect(can("viewer", "tasks", "update"), "precondition: viewer cannot write tasks").toBe(false);

    stub({ others: [{ id: "t4", title: "Unowned", dueAt: null, ownerId: null }] });
    const item = (await getActionCenter(viewer("viewer"), now)).buckets?.find((b) => b.key === "waiting_on_others")?.items[0];
    expect(item?.canClaim).toBe(false);
  });

  it("never offers an action on something already completed", async () => {
    taskFindMany.mockReset()
      .mockResolvedValueOnce([]).mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "t5", title: "Finished", completedAt: now }]);
    taskCount.mockReset().mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const item = (await getActionCenter(viewer(), now)).buckets?.find((b) => b.key === "completed_recently")?.items[0];
    expect(item?.canComplete).toBe(false);
    expect(item?.canClaim).toBe(false);
  });
});
