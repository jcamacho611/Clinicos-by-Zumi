import { describe, expect, it, vi, beforeEach } from "vitest";

const escalationFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    patient: { findMany: vi.fn().mockResolvedValue([]) },
    provider: { findMany: vi.fn().mockResolvedValue([]) },
    careHandoff: { findMany: vi.fn().mockResolvedValue([]) },
    task: { findMany: vi.fn().mockResolvedValue([]) },
    escalation: { findMany: (...args: unknown[]) => escalationFindMany(...args) },
    notification: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const { listCareCoordinationWorkspace } = await import(
  "@/lib/repositories/care-coordination-repository"
);

beforeEach(() => {
  escalationFindMany.mockReset();
  escalationFindMany.mockResolvedValue([]);
});

function whereClause() {
  return escalationFindMany.mock.calls[0][0].where;
}

/**
 * `escalations:read` is granted to billers, quality analysts and viewers. That is right
 * for an overdue referral and wrong for a colleague's mental-health crisis, which began
 * arriving in the same queue once urgent signals were recorded. The exclusion is applied
 * in the query so the rows never reach a caller that might forget to drop them.
 */
describe("who can see that a colleague reported a self-harm signal", () => {
  it("hides it from roles that hold escalations:read but have no basis to act", async () => {
    for (const role of ["biller", "quality", "viewer", "front_desk", "registered_nurse", "case_manager"]) {
      escalationFindMany.mockClear();
      await listCareCoordinationWorkspace("org-1", "user-1", role);

      expect(whereClause().NOT, role).toEqual({
        AND: [{ sourceType: "urgent_signal" }, { category: "self_harm" }],
      });
    }
  });

  it("shows it to the roles that can act on staff welfare", async () => {
    for (const role of ["clinic_owner", "administrator", "provider"]) {
      escalationFindMany.mockClear();
      await listCareCoordinationWorkspace("org-1", "user-1", role);

      expect(whereClause().NOT, role).toBeUndefined();
    }
  });

  it("fails closed when no role is supplied", async () => {
    // A caller that forgets to pass a role gets the restrictive result, not the
    // permissive one.
    await listCareCoordinationWorkspace("org-1", "user-1");

    expect(whereClause().NOT).toEqual({
      AND: [{ sourceType: "urgent_signal" }, { category: "self_harm" }],
    });
  });

  it("still scopes every read to the organization", async () => {
    await listCareCoordinationWorkspace("org-1", "user-1", "biller");
    expect(whereClause().organizationId).toBe("org-1");
  });

  it("hides nothing else — an ordinary urgent escalation stays visible to everyone", async () => {
    await listCareCoordinationWorkspace("org-1", "user-1", "biller");

    // The exclusion names both conditions together. A life-threatening urgent signal,
    // and every other escalation type, remain in the queue for every role.
    expect(whereClause().NOT.AND).toHaveLength(2);
    expect(whereClause().NOT.AND).toContainEqual({ category: "self_harm" });
  });
});
