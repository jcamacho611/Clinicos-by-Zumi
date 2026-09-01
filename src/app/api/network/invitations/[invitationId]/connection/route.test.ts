import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const enforcePermission = vi.fn();
const createConnection = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getClinicSession: () => getSession() }));
vi.mock("@/lib/auth/api-authorization", () => ({
  enforceApiPermission: (...args: unknown[]) => enforcePermission(...args),
}));
vi.mock("@/lib/repositories/network-directory-repository", () => ({
  createNetworkConnectionFromInvitation: (...args: unknown[]) => createConnection(...args),
}));

const { POST } = await import("@/app/api/network/invitations/[invitationId]/connection/route");

const clinicSession = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-a",
  organizationName: "Organization A",
  organizationSlug: "organization-a",
  email: "owner@example.test",
  name: "Organization Owner",
  role: "clinic_owner",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

function request(body: unknown = { allowedPurposes: ["treatment"] }) {
  return new Request("https://klinikos.io/api/network/invitations/invitation-1/connection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(clinicSession);
  enforcePermission.mockResolvedValue(null);
  createConnection.mockResolvedValue({
    id: "connection-1",
    sourceOrganizationId: "org-a",
    targetOrganizationId: "org-b",
    status: "pending",
    trustLevel: "unverified",
    allowedPurposes: ["treatment"],
    requestedBy: "user-1",
    approvedBy: null,
    activatedAt: null,
  });
});

describe("invitation-scoped connection request API", () => {
  it("requires authentication", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(request(), { params: Promise.resolve({ invitationId: "invitation-1" }) });
    expect(response.status).toBe(401);
    expect(createConnection).not.toHaveBeenCalled();
  });

  it("enforces network create permission and derives the target from the URL-bound invitation", async () => {
    const pendingRequest = request({ allowedPurposes: ["treatment", "operations"] });
    const response = await POST(pendingRequest, { params: Promise.resolve({ invitationId: "invitation-1" }) });

    expect(response.status).toBe(201);
    expect(enforcePermission).toHaveBeenCalledWith(
      clinicSession,
      "network",
      "create",
      expect.objectContaining({ request: pendingRequest, resourceId: "invitation-1" }),
    );
    expect(createConnection).toHaveBeenCalledWith(clinicSession, "invitation-1", {
      allowedPurposes: ["treatment", "operations"],
    });
  });

  it("returns only the pending request projection", async () => {
    const response = await POST(request(), { params: Promise.resolve({ invitationId: "invitation-1" }) });
    const payload = await response.json();

    expect(payload).toEqual({ data: {
      id: "connection-1",
      status: "pending",
      allowedPurposes: ["treatment"],
      receivingApprovalRequired: true,
    } });
    expect(JSON.stringify(payload)).not.toContain("trustLevel");
    expect(JSON.stringify(payload)).not.toContain("requestedBy");
    expect(JSON.stringify(payload)).not.toContain("approvedBy");
    expect(JSON.stringify(payload)).not.toContain("org-a");
    expect(JSON.stringify(payload)).not.toContain("org-b");
  });
});
