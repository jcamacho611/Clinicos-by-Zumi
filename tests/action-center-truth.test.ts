import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const taskFindMany = vi.fn();
const taskCount = vi.fn();
const escalationFindMany = vi.fn();
const escalationCount = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    task: { findMany: (...a: unknown[]) => taskFindMany(...a), count: (...a: unknown[]) => taskCount(...a) },
    escalation: {
      findMany: (...a: unknown[]) => escalationFindMany(...a),
      count: (...a: unknown[]) => escalationCount(...a),
    },
  },
}));

const { getActionCenter } = await import("@/lib/home/action-center");

const viewer = (role: ClinicRole = "clinic_owner") => ({ organizationId: "org-1", userId: "u1", role });
const now = new Date("2026-06-15T12:00:00Z");

interface TaskRow { id: string; title: string; dueAt?: Date | null; ownerId?: string | null; completedAt?: Date | null }
interface EscalationRow { id: string; category: string; riskLevel: string; assignedTeam: string; createdAt: Date }

/**
 * Stub the four reads and their four counts together.
 *
 * The surface asks the database twice for each bucket — once for the page a person reads
 * and once for how many there really are — so a stub that answers only the page would let
 * a count-vs-page bug pass. `totals` defaults to the page length (the ordinary case where
 * nothing is truncated) and is overridden where truncation is the thing under test.
 */
function stub(rows: {
  mine?: TaskRow[];
  others?: TaskRow[];
  done?: TaskRow[];
  escalations?: EscalationRow[];
  totals?: { mine?: number; others?: number; done?: number; escalations?: number };
}) {
  const mine = rows.mine ?? [];
  const others = rows.others ?? [];
  const done = rows.done ?? [];
  const escalations = rows.escalations ?? [];
  taskFindMany
    .mockResolvedValueOnce(mine)
    .mockResolvedValueOnce(others)
    .mockResolvedValueOnce(done);
  escalationFindMany.mockResolvedValue(escalations);
  taskCount
    .mockResolvedValueOnce(rows.totals?.mine ?? mine.length)
    .mockResolvedValueOnce(rows.totals?.others ?? others.length)
    .mockResolvedValueOnce(rows.totals?.done ?? done.length);
  escalationCount.mockResolvedValue(rows.totals?.escalations ?? escalations.length);
}

beforeEach(() => {
  taskFindMany.mockReset().mockResolvedValue([]);
  escalationFindMany.mockReset().mockResolvedValue([]);
  taskCount.mockReset().mockResolvedValue(0);
  escalationCount.mockReset().mockResolvedValue(0);
});

describe("the action centre splits work by whose hands it is in", () => {
  it("separates what needs you from what is with someone else", async () => {
    stub({
      mine: [{ id: "t1", title: "Call the lab", dueAt: null }],
      others: [{ id: "t2", title: "Chase the referral", dueAt: null, ownerId: "u2" }],
    });

    const center = await getActionCenter(viewer(), now);
    const needsYou = center.buckets?.find((bucket) => bucket.key === "needs_you");
    const waiting = center.buckets?.find((bucket) => bucket.key === "waiting_on_others");

    expect(needsYou?.items.map((item) => item.title)).toEqual(["Call the lab"]);
    expect(waiting?.items[0].detail).toBe("Owned by someone else");
    // The point of the split: a person can put down work that is not theirs.
    expect(needsYou?.count).toBe(1);
  });

  it("marks an unowned task as having no owner rather than as yours", async () => {
    stub({ others: [{ id: "t3", title: "Unassigned follow-up", dueAt: null, ownerId: null }] });
    const center = await getActionCenter(viewer(), now);
    expect(center.buckets?.find((b) => b.key === "waiting_on_others")?.items[0].detail).toBe("No owner yet");
  });

  it("calls a past due date overdue and a near one due soon", async () => {
    stub({
      mine: [
        { id: "t1", title: "Late", dueAt: new Date("2026-06-14T12:00:00Z") },
        { id: "t2", title: "Soon", dueAt: new Date("2026-06-16T00:00:00Z") },
        { id: "t3", title: "Later", dueAt: new Date("2026-07-01T00:00:00Z") },
      ],
    });
    const items = (await getActionCenter(viewer(), now)).buckets?.[0].items ?? [];
    expect(items.map((item) => item.urgency)).toEqual(["overdue", "due_soon", "open"]);
  });

  it("never names a patient in an escalation item", async () => {
    stub({
      escalations: [
        { id: "e1", category: "missing_result", riskLevel: "HIGH", assignedTeam: "care_team", createdAt: now },
      ],
    });
    const center = await getActionCenter(viewer(), now);
    const item = center.buckets?.[0].items.find((entry) => entry.id.startsWith("escalation-"));
    expect(item?.title).toBe("missing result needs review");
    expect(item?.detail).toBe("high risk · care team");

    // The stronger guarantee: the query never asks for the patient at all, so there is
    // nothing to leak even if the projection changed later.
    const select = escalationFindMany.mock.calls[0][0].select as Record<string, boolean>;
    expect(select.patientId).toBeUndefined();
  });

  it("draws no badge when nothing needs you", async () => {
    const center = await getActionCenter(viewer(), now);
    // A badge that is always present stops being read.
    expect(center.needsYouBadge).toBeNull();
    expect(center.everythingHandled).toBe(true);
  });

  it("counts a badge from rows rather than from a sentence", async () => {
    stub({ mine: [{ id: "t1", title: "A", dueAt: null }, { id: "t2", title: "B", dueAt: null }] });
    const center = await getActionCenter(viewer(), now);
    expect(center.needsYouBadge).toBe(2);
  });

  it("reports the real total when more work exists than fits on the page", async () => {
    // The regression this exists for: the count used to be the length of the page, so a
    // clinic with forty open tasks was told it had six. The badge is the number a person
    // acts on, and a pagination limit must never be allowed to decide it.
    stub({
      mine: Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, title: `Task ${i}`, dueAt: null })),
      totals: { mine: 40 },
    });
    const center = await getActionCenter(viewer(), now);
    const needsYou = center.buckets?.find((bucket) => bucket.key === "needs_you");
    expect(needsYou?.count).toBe(40);
    expect(needsYou?.items).toHaveLength(6);
    expect(center.needsYouBadge).toBe(40);
  });

  it("never lets the page decide that everything is handled", async () => {
    // `everythingHandled` hides every bucket behind a reassurance. It must answer to the
    // counts, not to a page that happened to come back empty.
    stub({ totals: { mine: 3 } });
    const center = await getActionCenter(viewer(), now);
    expect(center.everythingHandled).toBe(false);
    expect(center.needsYouBadge).toBe(3);
  });

  it("gives every role that can read the work all three buckets", async () => {
    // Checked against real RBAC rather than assumed: every role except `contractor`
    // currently holds both tasks and escalations read, so no role today exercises the
    // task-less path. The conditional stays because permissions change and the surface
    // must not claim "nothing is sitting with anyone" to someone not entitled to know —
    // but asserting a split no role can reach would be testing the mock, not the product.
    for (const role of ["clinic_owner", "quality", "front_desk", "biller", "viewer"] as ClinicRole[]) {
      const keys = (await getActionCenter(viewer(role), now)).buckets?.map((bucket) => bucket.key) ?? [];
      expect(keys, `${role} is missing a bucket`).toEqual(["needs_you", "waiting_on_others", "completed_recently"]);
    }
  });

  it("returns null rather than empty buckets for a role that sees neither", async () => {
    const center = await getActionCenter(viewer("contractor"), now);
    expect(center.buckets).toBeNull();
    expect(taskFindMany).not.toHaveBeenCalled();
    expect(taskCount).not.toHaveBeenCalled();
    expect(escalationFindMany).not.toHaveBeenCalled();
    expect(escalationCount).not.toHaveBeenCalled();
  });

  it("scopes every read to the caller's organization", async () => {
    await getActionCenter(viewer(), now);
    for (const call of [
      ...taskFindMany.mock.calls,
      ...taskCount.mock.calls,
      ...escalationFindMany.mock.calls,
      ...escalationCount.mock.calls,
    ]) {
      expect((call[0] as { where: { organizationId: string } }).where.organizationId).toBe("org-1");
    }
  });
});

describe("the action centre surface", () => {
  const surface = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/action-center.tsx"), "utf8");

  it("shows all three buckets by name", () => {
    // The labels are server-owned, so they live beside the counts they describe rather
    // than being restated in the component where the two could drift apart.
    const bucketSource = fs.readFileSync(path.join(process.cwd(), "src/lib/home/action-center.ts"), "utf8");
    for (const label of ["Needs you", "Waiting on others", "Completed recently"]) {
      expect(bucketSource, `bucket "${label}" is not defined`).toContain(label);
    }
    expect(surface).toContain("bucket.label");
  });

  it("does not rely on colour alone for urgency", () => {
    expect(surface).toContain("Overdue");
    expect(surface).toContain("Due soon");
    expect(surface).toContain("TriangleAlert");
  });

  it("says nothing is waiting rather than rendering three empty lists", () => {
    expect(surface).toContain("Nothing is waiting on anyone.");
  });

  it("calls the governed task routes rather than writing its own", () => {
    // The Action Center gets no privileges of its own. Both controls go through the
    // existing endpoints, which enforce tasks:update, scope to the caller's
    // organization and write an audit row.
    const controls = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/action-center-controls.tsx"), "utf8");
    expect(controls).toContain("/api/tasks/${taskId}/assign");
    expect(controls).toContain("/api/tasks/${taskId}/transition");
    expect(controls, "no direct database or repository access from the browser").not.toMatch(/@\/lib\/db|prisma/i);
  });

  it("re-reads from the server instead of guessing the new state", () => {
    // A row leaves the list because the task changed, not because a button was pressed.
    // Optimistic removal makes the list quietly disagree with the database.
    const controls = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/action-center-controls.tsx"), "utf8");
    expect(controls).toContain("router.refresh()");
  });

  it("never draws a zero count", () => {
    expect(surface).toContain("bucket.count > 0 ?");
  });

  it("admits when the list is shorter than the count above it", () => {
    expect(surface).toContain("bucket.count > bucket.items.length");
    expect(surface).toContain("Showing {bucket.items.length} of {bucket.count}");
  });
});
