import { describe, expect, it } from "vitest";
import {
  projectReferralObligation,
  projectTaskObligation,
} from "@/lib/obligations/universal-obligation";

const now = new Date("2026-09-01T20:00:00.000Z");

describe("universal unfinished-work projection", () => {
  it("projects Task state without becoming Task authority", () => {
    expect(projectTaskObligation({
      id: "task-owned",
      organizationId: "org-1",
      patientId: "patient-1",
      title: "Review result",
      status: "open",
      ownerId: "user-1",
      priority: "high",
      riskLevel: "NEEDS_PROVIDER",
      dueAt: "2026-09-01T21:00:00.000Z",
      completedAt: null,
      updatedAt: "2026-09-01T19:00:00.000Z",
    }, now)).toMatchObject({
      sourceType: "task",
      sourceId: "task-owned",
      state: "OWNED",
      open: true,
      overdue: false,
      ownerReference: "user-1",
    });

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
      updatedAt: "2026-09-01T19:00:00.000Z",
    }, now)).toMatchObject({
      state: "EXPECTED",
      open: true,
      overdue: false,
      ownerReference: null,
    });
  });

  it("treats authoritative Task completion as closed and never overdue", () => {
    expect(projectTaskObligation({
      id: "task-complete",
      organizationId: "org-1",
      patientId: "patient-1",
      title: "Call patient",
      status: "completed",
      ownerId: "user-1",
      priority: "normal",
      riskLevel: "NORMAL",
      dueAt: "2026-09-01T18:00:00.000Z",
      completedAt: "2026-09-01T19:00:00.000Z",
      updatedAt: "2026-09-01T19:00:00.000Z",
    }, now)).toMatchObject({ state: "CLOSED", open: false, overdue: false });
  });

  it("derives overdue only from a real unresolved source due time", () => {
    expect(projectTaskObligation({
      id: "task-overdue",
      organizationId: "org-1",
      patientId: null,
      title: "Follow up",
      status: "open",
      ownerId: "user-1",
      priority: "normal",
      riskLevel: "NORMAL",
      dueAt: "2026-09-01T19:59:59.000Z",
      completedAt: null,
      updatedAt: "2026-09-01T19:00:00.000Z",
    }, now).overdue).toBe(true);
  });

  it("preserves the source-owned Referral lifecycle instead of collapsing fulfillment into closure", () => {
    const base = {
      id: "ref-1",
      organizationId: "org-1",
      patientId: "patient-1",
      specialty: "Cardiology",
      destination: "Specialty Clinic",
      deliveryStatus: "delivered",
      followUpDueAt: "2026-09-02T20:00:00.000Z",
      closedLoopAt: null,
      updatedAt: "2026-09-01T19:00:00.000Z",
    };

    expect(projectReferralObligation({ ...base, status: "draft" }, now).state).toBe("EXPECTED");
    expect(projectReferralObligation({ ...base, status: "ready_to_send" }, now).state).toBe("OWNED");
    expect(projectReferralObligation({ ...base, status: "sent" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "received" }, now).state).toBe("ACKNOWLEDGED");
    expect(projectReferralObligation({ ...base, status: "accepted" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "scheduled" }, now).state).toBe("IN_PROGRESS");
    expect(projectReferralObligation({ ...base, status: "completed" }, now)).toMatchObject({ state: "FULFILLED", open: true });
    expect(projectReferralObligation({ ...base, status: "consultation_received" }, now)).toMatchObject({ state: "VERIFIED", open: true });
    expect(projectReferralObligation({ ...base, status: "closed", closedLoopAt: "2026-09-01T19:30:00.000Z" }, now)).toMatchObject({ state: "CLOSED", open: false });
  });

  it("keeps declined or failed-delivery referrals visible as blocked unfinished work", () => {
    const base = {
      id: "ref-blocked",
      organizationId: "org-1",
      patientId: "patient-1",
      specialty: "Imaging",
      destination: "Imaging Center",
      followUpDueAt: "2026-09-01T18:00:00.000Z",
      closedLoopAt: null,
      updatedAt: "2026-09-01T19:00:00.000Z",
    };

    expect(projectReferralObligation({ ...base, status: "declined", deliveryStatus: "delivered" }, now)).toMatchObject({ state: "BLOCKED", open: true, overdue: true });
    expect(projectReferralObligation({ ...base, status: "sent", deliveryStatus: "failed" }, now)).toMatchObject({ state: "BLOCKED", open: true, overdue: true });
  });
});
