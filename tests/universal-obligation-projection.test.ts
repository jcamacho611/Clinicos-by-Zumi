import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  projectReferralObligation,
  projectTaskObligation,
} from "@/lib/obligations/universal-obligation";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const now = new Date("2026-08-22T20:00:00.000Z");

describe("universal obligation projection", () => {
  it("projects open owned and unassigned tasks without replacing Task authority", () => {
    expect(projectTaskObligation({
      id: "task-owned",
      organizationId: "org-1",
      patientId: "patient-1",
      title: "Review result",
      status: "open",
      ownerId: "user-1",
      priority: "high",
      riskLevel: "NEEDS_PROVIDER",
      dueAt: "2026-08-22T21:00:00.000Z",
      completedAt: null,
      updatedAt: "2026-08-22T19:00:00.000Z",
    }, now)).toMatchObject({ state: "OWNED", open: true, overdue: false, ownerReference: "user-1" });

    expect(projectTaskObligation({
      id: "task-unassigned",
      organizationId: "org-1",
      patientId: null,
      title: "Confirm vendor",
      status: "open",
      ownerId: null,
      priority: "normal",
      riskLevel: "NORMAL",
      dueAt: null,
      completedAt: null,
      updatedAt: "2026-08-22T19:00:00.000Z",
    }, now)).toMatchObject({ state: "EXPECTED", open: true, overdue: false, ownerReference: null });
  });

  it("treats authoritative task completion as closed work", () => {
    const obligation = projectTaskObligation({
      id: "task-complete",
      organizationId: "org-1",
      patientId: "patient-1",
      title: "Call patient",
      status: "completed",
      ownerId: "user-1",
      priority: "normal",
      riskLevel: "NORMAL",
      dueAt: "2026-08-22T18:00:00.000Z",
      completedAt: "2026-08-22T19:00:00.000Z",
      updatedAt: "2026-08-22T19:00:00.000Z",
    }, now);

    expect(obligation).toMatchObject({ state: "CLOSED", open: false, overdue: false });
  });

  it("marks unresolved work overdue only from source due dates", () => {
    const obligation = projectTaskObligation({
      id: "task-overdue",
      organizationId: "org-1",
      patientId: null,
      title: "Follow up",
      status: "open",
      ownerId: "user-1",
      priority: "normal",
      riskLevel: "NORMAL",
      dueAt: "2026-08-22T19:59:59.000Z",
      completedAt: null,
      updatedAt: "2026-08-22T19:00:00.000Z",
    }, now);

    expect(obligation.overdue).toBe(true);
  });

  it("preserves referral lifecycle instead of collapsing completion into closed-loop care", () => {
    const base = {
      id: "ref-1",
      organizationId: "org-1",
      patientId: "patient-1",
      specialty: "Cardiology",
      destination: "Specialty Clinic",
      deliveryStatus: "delivered",
      followUpDueAt: "2026-08-23T20:00:00.000Z",
      closedLoopAt: null,
      updatedAt: "2026-08-22T19:00:00.000Z",
    };

    expect(projectReferralObligation({ ...base, status: "draft" }, now).state).toBe("EXPECTED");
    expect(projectReferralObligation({ ...base, status: "ready_to_send" }, now).state).toBe("OWNED");
    expect(projectReferralObligation({ ...base, status: "sent" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "received" }, now).state).toBe("ACKNOWLEDGED");
    expect(projectReferralObligation({ ...base, status: "accepted" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "scheduled" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "completed" }, now)).toMatchObject({ state: "FULFILLED", open: true });
    expect(projectReferralObligation({ ...base, status: "consultation_received" }, now)).toMatchObject({ state: "VERIFIED", open: true });
    expect(projectReferralObligation({ ...base, status: "closed", closedLoopAt: "2026-08-22T19:30:00.000Z" }, now)).toMatchObject({ state: "CLOSED", open: false });
  });

  it("keeps declined or failed-delivery referrals visible as blocked obligations", () => {
    const base = {
      id: "ref-blocked",
      organizationId: "org-1",
      patientId: "patient-1",
      specialty: "Imaging",
      destination: "Imaging Center",
      followUpDueAt: "2026-08-22T18:00:00.000Z",
      closedLoopAt: null,
      updatedAt: "2026-08-22T19:00:00.000Z",
    };

    expect(projectReferralObligation({ ...base, status: "declined", deliveryStatus: "delivered" }, now)).toMatchObject({ state: "BLOCKED", open: true, overdue: true });
    expect(projectReferralObligation({ ...base, status: "sent", deliveryStatus: "failed" }, now)).toMatchObject({ state: "BLOCKED", open: true, overdue: true });
  });

  it("wires a minimum-necessary tenant projection into the existing Tasks workspace", () => {
    const repository = read("src/lib/obligations/universal-obligation-repository.ts");
    const page = read("src/app/(platform)/[workspace]/page.tsx");
    const workspace = read("src/components/clinic/tasks-workspace-real.tsx");

    expect(repository).toContain("organizationId");
    expect(repository).toContain("db.task.findMany");
    expect(repository).toContain("db.referral.findMany");
    expect(repository).not.toContain("destinationOrganizationId: organizationId");
    expect(page).toContain("listUniversalObligations");
    expect(workspace).toContain("What still needs to happen?");
    expect(workspace).toContain("obligations");
  });
});
