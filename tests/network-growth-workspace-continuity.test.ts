import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const invitationFindMany = vi.fn();
const organizationFindMany = vi.fn();
const facilityFindMany = vi.fn();
const providerFindMany = vi.fn();
const referralFindMany = vi.fn();
const connectionFindMany = vi.fn();
const connectionCreate = vi.fn();
const auditFindMany = vi.fn();
const auditCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    networkInvitation: { findMany: (...args: unknown[]) => invitationFindMany(...args) },
    organization: { findMany: (...args: unknown[]) => organizationFindMany(...args) },
    facility: { findMany: (...args: unknown[]) => facilityFindMany(...args) },
    provider: { findMany: (...args: unknown[]) => providerFindMany(...args) },
    referral: { findMany: (...args: unknown[]) => referralFindMany(...args) },
    networkConnection: {
      findMany: (...args: unknown[]) => connectionFindMany(...args),
      create: (...args: unknown[]) => connectionCreate(...args),
    },
    auditLog: {
      findMany: (...args: unknown[]) => auditFindMany(...args),
      create: (...args: unknown[]) => auditCreate(...args),
    },
  },
}));

const { listNetworkGrowthWorkspace } = await import("@/lib/repositories/network-growth-repository");

const session: ClinicSession = {
  sessionId: "session-a",
  userId: "user-a",
  organizationId: "org-a",
  organizationName: "Organization A",
  organizationSlug: "organization-a",
  email: "owner@example.test",
  name: "Organization Owner",
  role: "clinic_owner",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  invitationFindMany.mockResolvedValue([{
    id: "invitation-1",
    inviteeType: "clinic",
    inviteeName: "Organization B",
    inviteeEmail: null,
    specialty: "Imaging",
    location: null,
    status: "accepted",
    notes: null,
    invitingOrganizationId: "org-a",
    targetOrganizationId: "org-b",
    expiresAt: null,
    createdAt: new Date("2026-09-01T10:00:00.000Z"),
    updatedAt: new Date("2026-09-01T11:00:00.000Z"),
    invitingOrganization: { name: "Organization A" },
    targetOrganization: { name: "Organization B" },
  }]);
  organizationFindMany.mockResolvedValue([
    { id: "org-a", name: "Organization A", clinicType: "clinic" },
    { id: "org-b", name: "Organization B", clinicType: "clinic" },
  ]);
  facilityFindMany.mockResolvedValue([]);
  providerFindMany.mockResolvedValue([]);
  referralFindMany.mockResolvedValue([]);
  connectionFindMany.mockResolvedValue([]);
  auditFindMany.mockResolvedValue([]);
  auditCreate.mockResolvedValue({ id: "audit-1" });
});

describe("network growth workspace relationship continuity", () => {
  it("exposes setup-needed work without mutating a relationship", async () => {
    const workspace = await listNetworkGrowthWorkspace(session);

    expect(workspace.relationshipGaps).toEqual([expect.objectContaining({
      invitationId: "invitation-1",
      counterpartOrganizationId: "org-b",
      state: "relationship_setup_needed",
      nextStep: "request_relationship",
    })]);
    expect(workspace.insights.relationshipSetupNeeded).toBe(1);
    expect(invitationFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: {
        status: "accepted",
        OR: [{ invitingOrganizationId: "org-a" }, { targetOrganizationId: "org-a" }],
      },
    }));
    expect(invitationFindMany.mock.calls[1]?.[0]).not.toHaveProperty("take");
    expect(auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: "network.growth_accessed",
      metadata: expect.objectContaining({ relationshipSetupNeeded: 1 }),
    }) });
    expect(connectionCreate).not.toHaveBeenCalled();
  });

  it("removes setup-needed work once a pending relationship request exists", async () => {
    connectionFindMany.mockResolvedValue([{
      id: "connection-1",
      sourceOrganizationId: "org-a",
      targetOrganizationId: "org-b",
      status: "pending",
      updatedAt: new Date("2026-09-01T12:00:00.000Z"),
    }]);

    const workspace = await listNetworkGrowthWorkspace(session);
    expect(workspace.relationshipGaps).toEqual([]);
    expect(workspace.insights.relationshipSetupNeeded).toBe(0);
  });
});
