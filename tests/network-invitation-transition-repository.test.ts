import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const invitationLock = vi.fn();
const invitationFindFirst = vi.fn();
const invitationUpdate = vi.fn();
const auditCreateMany = vi.fn();

const tx = {
  $queryRaw: (...args: unknown[]) => invitationLock(...args),
  networkInvitation: {
    findFirst: (...args: unknown[]) => invitationFindFirst(...args),
    update: (...args: unknown[]) => invitationUpdate(...args),
  },
  auditLog: { createMany: (...args: unknown[]) => auditCreateMany(...args) },
};

const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));

vi.mock("@/lib/db", () => ({
  db: { $transaction: (callback: (client: typeof tx) => unknown) => transaction(callback) },
}));

const { transitionNetworkInvitation } = await import("@/lib/repositories/network-growth-repository");

const session: ClinicSession = {
  sessionId: "session-b",
  userId: "user-b",
  organizationId: "org-b",
  organizationName: "Organization B",
  organizationSlug: "organization-b",
  email: "owner-b@example.test",
  name: "Organization B Owner",
  role: "clinic_owner",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  invitationLock.mockResolvedValue([{ pg_advisory_xact_lock: null }]);
  invitationFindFirst.mockResolvedValue({
    id: "invitation-1",
    status: "sent",
    invitingOrganizationId: "org-a",
    targetOrganizationId: "org-b",
    expiresAt: null,
    verifiedBy: null,
    verifiedAt: null,
    acceptedBy: null,
    acceptedAt: null,
    rejectedBy: null,
    rejectedAt: null,
  });
  invitationUpdate.mockResolvedValue({ id: "invitation-1", status: "accepted" });
  auditCreateMany.mockResolvedValue({ count: 2 });
});

describe("network invitation transition serialization", () => {
  it("locks the invitation before reading its transition state", async () => {
    const updated = await transitionNetworkInvitation(session, "invitation-1", {
      action: "accept",
      note: "The receiving organization accepted the invitation scope.",
    });

    expect(invitationLock).toHaveBeenCalledTimes(1);
    expect(invitationLock.mock.invocationCallOrder[0]).toBeLessThan(invitationFindFirst.mock.invocationCallOrder[0]);
    expect(invitationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "invitation-1" },
      data: expect.objectContaining({ status: "accepted", acceptedBy: "user-b" }),
    }));
    expect(updated).toMatchObject({ status: "accepted" });
  });

  it("does not let the sender self-accept an invitation without a bound receiving organization", async () => {
    invitationFindFirst.mockResolvedValue({
      id: "invitation-1",
      status: "verified",
      invitingOrganizationId: "org-a",
      targetOrganizationId: null,
      expiresAt: null,
      verifiedBy: "user-a",
      verifiedAt: new Date("2026-09-01T12:00:00.000Z"),
      acceptedBy: null,
      acceptedAt: null,
      rejectedBy: null,
      rejectedAt: null,
    });

    await expect(transitionNetworkInvitation({ ...session, organizationId: "org-a", userId: "user-a" }, "invitation-1", {
      action: "accept",
      note: "The sender cannot establish the receiving organization's acceptance.",
    })).rejects.toMatchObject({ status: 409 });
    expect(invitationUpdate).not.toHaveBeenCalled();
    expect(auditCreateMany).not.toHaveBeenCalled();
  });
});
