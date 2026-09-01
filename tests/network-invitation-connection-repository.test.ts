import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { isActiveNetworkRelationship } from "@/lib/network-access-rules";

const invitationFindFirst = vi.fn();
const organizationFindFirst = vi.fn();
const connectionFindFirst = vi.fn();
const connectionCreate = vi.fn();
const connectionUpdate = vi.fn();
const auditCreateMany = vi.fn();
const agreementCreate = vi.fn();
const recordRequestCreate = vi.fn();
const accessGrantCreate = vi.fn();
const paymentCreate = vi.fn();
const relationshipLock = vi.fn();

const tx = {
  $queryRaw: (...args: unknown[]) => relationshipLock(...args),
  networkInvitation: { findFirst: (...args: unknown[]) => invitationFindFirst(...args) },
  organization: { findFirst: (...args: unknown[]) => organizationFindFirst(...args) },
  networkConnection: {
    findFirst: (...args: unknown[]) => connectionFindFirst(...args),
    create: (...args: unknown[]) => connectionCreate(...args),
    update: (...args: unknown[]) => connectionUpdate(...args),
  },
  auditLog: { createMany: (...args: unknown[]) => auditCreateMany(...args) },
  dataSharingAgreement: { create: (...args: unknown[]) => agreementCreate(...args) },
  recordRequest: { create: (...args: unknown[]) => recordRequestCreate(...args) },
  accessGrant: { create: (...args: unknown[]) => accessGrantCreate(...args) },
  payment: { create: (...args: unknown[]) => paymentCreate(...args) },
};

const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));

vi.mock("@/lib/db", () => ({
  db: { $transaction: (callback: (client: typeof tx) => unknown) => transaction(callback) },
}));

const {
  createNetworkConnectionFromInvitation,
  transitionNetworkConnection,
} = await import("@/lib/repositories/network-directory-repository");

const acceptedInvitation = {
  id: "invitation-1",
  status: "accepted",
  invitingOrganizationId: "org-a",
  targetOrganizationId: "org-b",
};

function session(organizationId: string, role: ClinicRole = "clinic_owner"): ClinicSession {
  return {
    sessionId: `session-${organizationId}`,
    userId: `user-${organizationId}`,
    organizationId,
    organizationName: `Organization ${organizationId}`,
    organizationSlug: organizationId,
    email: `${organizationId}@example.test`,
    name: `User ${organizationId}`,
    role,
    demo: true,
    expiresAt: Date.now() + 60_000,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  invitationFindFirst.mockResolvedValue(acceptedInvitation);
  organizationFindFirst.mockResolvedValue({ id: "org-b", name: "Organization B" });
  connectionFindFirst.mockResolvedValue(null);
  connectionCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({
    id: "connection-1",
    approvedBy: null,
    activatedAt: null,
    ...data,
  }));
  connectionUpdate.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({
    id: "connection-1",
    sourceOrganizationId: "org-a",
    targetOrganizationId: "org-b",
    allowedPurposes: ["treatment"],
    ...data,
  }));
  auditCreateMany.mockResolvedValue({ count: 2 });
  relationshipLock.mockResolvedValue([{ pg_advisory_xact_lock: null }]);
});

describe("accepted invitation to governed relationship", () => {
  it("derives the counterpart server-side and creates only a pending purpose-scoped request", async () => {
    const connection = await createNetworkConnectionFromInvitation(session("org-a"), "invitation-1", {
      allowedPurposes: ["treatment", "operations"],
    });

    expect(invitationFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "invitation-1",
        OR: [{ invitingOrganizationId: "org-a" }, { targetOrganizationId: "org-a" }],
      },
    }));
    expect(connectionCreate).toHaveBeenCalledWith({ data: {
      sourceOrganizationId: "org-a",
      targetOrganizationId: "org-b",
      status: "pending",
      trustLevel: "unverified",
      allowedPurposes: ["treatment", "operations"],
      requestedBy: "user-org-a",
    } });
    expect(relationshipLock).toHaveBeenCalledTimes(2);
    expect(relationshipLock.mock.invocationCallOrder[0]).toBeLessThan(invitationFindFirst.mock.invocationCallOrder[0]);
    expect(relationshipLock.mock.invocationCallOrder[1]).toBeLessThan(connectionFindFirst.mock.invocationCallOrder[0]);
    expect(connection).toMatchObject({ status: "pending", approvedBy: null, activatedAt: null });
    expect(isActiveNetworkRelationship(connection, "org-a", "org-b", "treatment")).toBe(false);
    expect(isActiveNetworkRelationship(connection, "org-a", "org-b", "payment")).toBe(false);

    expect(auditCreateMany).toHaveBeenCalledWith({ data: expect.arrayContaining([
      expect.objectContaining({
        organizationId: "org-a",
        action: "network.connection_requested",
        metadata: expect.objectContaining({ sourceInvitationId: "invitation-1" }),
      }),
      expect.objectContaining({
        organizationId: "org-b",
        action: "network.connection_requested",
        metadata: expect.objectContaining({ sourceInvitationId: "invitation-1" }),
      }),
    ]) });
    expect(agreementCreate).not.toHaveBeenCalled();
    expect(recordRequestCreate).not.toHaveBeenCalled();
    expect(accessGrantCreate).not.toHaveBeenCalled();
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("fails closed for non-accepted, unresolved, or inaccessible invitations", async () => {
    for (const invitation of [
      { ...acceptedInvitation, status: "sent" },
      { ...acceptedInvitation, status: "rejected" },
      { ...acceptedInvitation, status: "suspended" },
      { ...acceptedInvitation, status: "cancelled" },
      { ...acceptedInvitation, targetOrganizationId: null },
      null,
    ]) {
      invitationFindFirst.mockResolvedValueOnce(invitation);
      await expect(createNetworkConnectionFromInvitation(session("org-a"), "invitation-1", {
        allowedPurposes: ["treatment"],
      })).rejects.toMatchObject({ status: expect.any(Number) });
    }
    expect(connectionCreate).not.toHaveBeenCalled();
    expect(auditCreateMany).not.toHaveBeenCalled();
  });

  it("rejects an existing relationship in either direction", async () => {
    connectionFindFirst.mockResolvedValue({ id: "connection-existing", status: "pending" });

    await expect(createNetworkConnectionFromInvitation(session("org-a"), "invitation-1", {
      allowedPurposes: ["treatment"],
    })).rejects.toMatchObject({ status: 409 });
    expect(connectionFindFirst).toHaveBeenCalledWith({ where: { OR: [
      { sourceOrganizationId: "org-a", targetOrganizationId: "org-b" },
      { sourceOrganizationId: "org-b", targetOrganizationId: "org-a" },
    ] } });
    expect(connectionCreate).not.toHaveBeenCalled();
  });

  it("keeps approval as a separate receiving-organization action", async () => {
    const pending = {
      id: "connection-1",
      sourceOrganizationId: "org-a",
      targetOrganizationId: "org-b",
      status: "pending",
      allowedPurposes: ["treatment"],
      approvedBy: null,
      activatedAt: null,
      suspendedAt: null,
    };
    connectionFindFirst.mockResolvedValue(pending);

    await expect(transitionNetworkConnection(session("org-a"), "connection-1", {
      action: "approve",
      reason: "The receiving organization approved this purpose-scoped relationship.",
    })).rejects.toMatchObject({ status: 403 });

    const active = await transitionNetworkConnection(session("org-b", "administrator"), "connection-1", {
      action: "approve",
      reason: "The receiving organization approved this purpose-scoped relationship.",
    });
    expect(relationshipLock).toHaveBeenCalledTimes(2);
    expect(relationshipLock.mock.invocationCallOrder[0]).toBeLessThan(connectionFindFirst.mock.invocationCallOrder[0]);
    expect(relationshipLock.mock.invocationCallOrder[1]).toBeLessThan(connectionFindFirst.mock.invocationCallOrder[1]);
    expect(connectionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "connection-1" },
      data: expect.objectContaining({ status: "active", approvedBy: "user-org-b" }),
    }));
    expect(active).toMatchObject({ status: "active", approvedBy: "user-org-b" });
    expect(agreementCreate).not.toHaveBeenCalled();
    expect(recordRequestCreate).not.toHaveBeenCalled();
    expect(accessGrantCreate).not.toHaveBeenCalled();
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("enforces network create permission inside the repository boundary", async () => {
    await expect(createNetworkConnectionFromInvitation(session("org-a", "viewer"), "invitation-1", {
      allowedPurposes: ["treatment"],
    })).rejects.toMatchObject({ status: 403 });
    expect(invitationFindFirst).not.toHaveBeenCalled();
  });
});
